import { NextRequest, NextResponse } from "next/server";
import { bonusWithdrawSummary, grantDepositBonus, restoreBonusesForRejectedWithdrawal, WITHDRAW_ATTEMPTS, type BonusWithdrawSummary } from "@/lib/bonus";
import { recordReferralCommission } from "@/lib/referral";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { ObjectId, type Db } from "mongodb";

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  const db = await getDb();

  // Withdrawals the bonus rules refused live in their own collection (they never became transactions)
  if (status === "blocked") return blockedAttempts(db, page, limit, type);

  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;
  if (status) filter.status = status;

  const [transactions, total] = await Promise.all([
    db.collection("transactions")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    db.collection("transactions").countDocuments(filter),
  ]);

  // Enrich with user info
  const userIds = [...new Set(transactions.map((t) => t.userId.toString()))];
  const users = await db.collection("users")
    .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }, { projection: { firstName: 1, lastName: 1, email: 1 } })
    .toArray();
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  // Pending withdrawals: the account's bonus status right now, so admins see how much may be withdrawn
  const bonusByAccount = new Map<string, BonusWithdrawSummary>();
  const pendingAccounts = [...new Set(
    transactions.filter((t) => t.type === "withdrawal" && t.status === "pending" && t.accountNumber).map((t) => t.accountNumber as string),
  )];
  await Promise.all(pendingAccounts.map(async (accountNumber) => {
    const account = await db.collection("accounts").findOne({ accountNumber, isDemo: { $ne: true } });
    if (account) bonusByAccount.set(accountNumber, await bonusWithdrawSummary(db, account).catch((): BonusWithdrawSummary => {
      const balanceUsd = Math.round((Number(account.balance) || 0) * 100) / 100;
      return { hasBonus: false, active: null, withdrawLimitUsd: null, balanceUsd, bonusHeldUsd: 0, withdrawableUsd: balanceUsd };
    }));
  }));

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      ...t,
      _id: t._id.toString(),
      userId: t.userId.toString(),
      user: userMap[t.userId.toString()] ?? null,
      bonusStatus: t.type === "withdrawal" && t.status === "pending" ? bonusByAccount.get(t.accountNumber) ?? null : undefined,
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}

async function blockedAttempts(db: Db, page: number, limit: number, type: string) {
  if (type && type !== "withdrawal") return NextResponse.json({ transactions: [], total: 0, pages: 1, page });
  const col = db.collection(WITHDRAW_ATTEMPTS);
  const [attempts, total] = await Promise.all([
    col.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    col.countDocuments({}),
  ]);
  const users = await db.collection("users")
    .find({ _id: { $in: [...new Set(attempts.map((a) => a.userId.toString()))].map((id) => new ObjectId(id)) } }, { projection: { firstName: 1, lastName: 1, email: 1 } })
    .toArray();
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  return NextResponse.json({
    transactions: attempts.map((a) => ({
      _id: a._id.toString(),
      type: "withdrawal",
      amount: a.amountUsd,
      amountThb: a.amountThb,
      status: "blocked",
      transactionId: "-",
      accountNumber: a.accountNumber,
      createdAt: a.createdAt,
      userId: a.userId.toString(),
      user: userMap[a.userId.toString()] ?? null,
      blockReason: a.message,
      bonusStatus: a.bonus ?? null, // as it was at the time of the attempt
    })),
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    page,
  });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status, adminNotes } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "ID and status required" }, { status: 400 });

  const db = await getDb();

  // Atomic: returns the document as it was *before* this update, so two clicks
  // on "approve" can never both see a non-completed deposit and credit it twice
  const txn = await db.collection("transactions").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status, adminNotes: adminNotes ?? "", updatedAt: new Date() } },
  );
  if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  /* อนุมัติฝาก → เติมยอดในบัญชีเทรด (only if not already auto-approved by Slip2Go) */
  if (status === "completed" && txn.type === "deposit" && txn.accountNumber && txn.amount > 0
    && txn.status !== "completed") {
    const r = await db.collection("accounts").updateOne(
      { accountNumber: txn.accountNumber },
      { $inc: { balance: txn.amount, equity: txn.amount, freeMargin: txn.amount } }
    );
    if (r.matchedCount === 0) {
      console.error(`[admin/txn] no account found for accountNumber=${txn.accountNumber}`);
    }
    await grantDepositBonus(db, { ...txn, status: "completed" }).catch((e) => console.error("[admin/txn] bonus failed:", e));
    await recordReferralCommission(db, txn).catch((e) => console.error("[admin/txn] referral failed:", e));
  }

  /* ปฏิเสธถอน → คืนยอดให้ user (ยอดถูกหักไปแล้วตอนส่งคำขอ) */
  if (status === "failed" && txn.type === "withdrawal" && txn.accountNumber && txn.amount > 0 && txn.status !== "failed") {
    await db.collection("accounts").updateOne(
      { accountNumber: txn.accountNumber },
      { $inc: { balance: txn.amount, equity: txn.amount, freeMargin: txn.amount } }
    );
    // A full withdrawal took the bonus out with it: put it back and reactivate it
    await restoreBonusesForRejectedWithdrawal(db, txn).catch((e) => console.error("[admin/txn] bonus restore failed:", e));
  }

  return NextResponse.json({ ok: true });
}
