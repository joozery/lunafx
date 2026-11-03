import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { getExchangeRate } from "@/lib/exchangeRate";
import { getBonusSetting, grantDepositBonus } from "@/lib/bonus";
import { requiredLots } from "@/lib/bonusRules";
import { recordReferralCommission } from "@/lib/referral";
import { notifyAdmins, thaiTime } from "@/lib/lineNotify";

const round2 = (n: number) => Math.round(n * 100) / 100;
const MAX_USD = 100_000;

type Kind = "deposit" | "bonus" | "adjustment";
const KIND_TH: Record<Kind, string> = { deposit: "ยอดฝาก", bonus: "โบนัส", adjustment: "ปรับยอด" };

/**
 * Admin credits (or, for "adjustment", debits) a user's trading account by hand.
 * - deposit: counts as a real deposit — deposit bonus and referral commission apply as usual
 * - bonus: a bonus with the current turnover rules; it stays in the account until met
 * - adjustment: plain balance change, nothing else; may be negative (not below a zero balance)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const accountId = body?.accountId;
  const kind = body?.kind as Kind;
  const amount = round2(Number(body?.amountUsd));
  const note = String(body?.note ?? "").trim().slice(0, 300);

  if (!ObjectId.isValid(id) || typeof accountId !== "string" || !ObjectId.isValid(accountId)) {
    return NextResponse.json({ error: "ไม่พบบัญชีเทรด" }, { status: 404 });
  }
  if (!["deposit", "bonus", "adjustment"].includes(kind)) return NextResponse.json({ error: "ประเภทไม่ถูกต้อง" }, { status: 400 });
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > MAX_USD) {
    return NextResponse.json({ error: `จำนวนเงินต้องไม่เป็น 0 และไม่เกิน $${MAX_USD.toLocaleString()}` }, { status: 400 });
  }
  if (amount < 0 && kind !== "adjustment") return NextResponse.json({ error: "หักยอดได้เฉพาะประเภท \"ปรับยอด\"" }, { status: 400 });
  if (!note) return NextResponse.json({ error: "กรุณาใส่หมายเหตุ" }, { status: 400 });

  const db = await getDb();
  const userId = new ObjectId(id);
  const account = await db.collection("accounts").findOne({ _id: new ObjectId(accountId), userId });
  if (!account) return NextResponse.json({ error: "ไม่พบบัญชีเทรด" }, { status: 404 });
  if (account.isDemo && kind !== "adjustment") return NextResponse.json({ error: "บัญชีเดโมเติมได้เฉพาะประเภท \"ปรับยอด\"" }, { status: 400 });

  // Atomic: a debit never takes the balance below zero
  const moved = await db.collection("accounts").updateOne(
    amount < 0 ? { _id: account._id, balance: { $gte: -amount } } : { _id: account._id },
    { $inc: { balance: amount, equity: amount, freeMargin: amount } },
  );
  if (moved.modifiedCount === 0) return NextResponse.json({ error: "ยอดคงเหลือไม่พอให้หัก" }, { status: 400 });

  const by = { adminEmail: admin.email, adminName: `${admin.firstName} ${admin.lastName}`.trim() };
  const stamp = `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const now = new Date();
  let bonusUsd = 0;

  if (kind === "deposit") {
    const { depositRate } = await getExchangeRate(db);
    const { insertedId } = await db.collection("transactions").insertOne({
      userId, type: "deposit", method: "manual", accountNumber: account.accountNumber,
      amount, amountThb: round2(amount * depositRate), exchangeRate: depositRate,
      status: "completed", transactionId: `DEP-M-${stamp}`, adminNotes: `เติมโดยแอดมิน: ${note}`,
      manualBy: by, createdAt: now, updatedAt: now,
    });
    const txn = await db.collection("transactions").findOne({ _id: insertedId });
    if (txn) {
      bonusUsd = await grantDepositBonus(db, txn).catch((e) => { console.error("[admin/credit] bonus failed:", e); return 0; });
      await recordReferralCommission(db, txn).catch((e) => console.error("[admin/credit] referral failed:", e));
    }
  } else if (kind === "bonus") {
    const setting = await getBonusSetting(db);
    const { insertedId } = await db.collection("transactions").insertOne({
      userId, type: "bonus", method: "manual_bonus", accountNumber: account.accountNumber, amount,
      status: "completed", transactionId: `BON-M-${stamp}`, adminNotes: `โบนัสโดยแอดมิน: ${note}`,
      manualBy: by, createdAt: now, updatedAt: now,
    });
    await db.collection("bonuses").insertOne({
      depositTxnId: insertedId, // unique key in the bonuses collection; here the bonus's own transaction
      manual: true,
      userId, accountId: account._id.toString(), accountNumber: account.accountNumber,
      depositUsd: 0, bonusUsd: amount,
      requiredLots: requiredLots(setting, amount), requiredPips: setting.requiredPips, pipMode: setting.pipMode,
      maxWithdrawUsd: setting.maxWithdrawUsd, status: "active", createdAt: now, note, manualBy: by,
    });
  } else {
    await db.collection("transactions").insertOne({
      userId, type: "manual_adjustment", method: "manual", accountNumber: account.accountNumber, amount,
      status: "completed", transactionId: `ADJ-M-${stamp}`, adminNotes: `ปรับยอดโดยแอดมิน: ${note}`,
      manualBy: by, createdAt: now, updatedAt: now,
    });
  }

  const user = await db.collection("users").findOne({ _id: userId }, { projection: { firstName: 1, lastName: 1, email: 1 } });
  void notifyAdmins(
    `🛠 แอดมิน${amount < 0 ? "หัก" : "เติม"}เครดิต (${KIND_TH[kind]})\nลูกค้า: ${user?.firstName ?? ""} ${user?.lastName ?? ""} (${user?.email ?? ""})\n` +
    `บัญชีเทรด: #${account.accountNumber}\nจำนวน: ${amount < 0 ? "−" : "+"}$${Math.abs(amount)}${bonusUsd > 0 ? ` (+โบนัสเงินฝาก $${bonusUsd})` : ""}\n` +
    `หมายเหตุ: ${note}\nโดย: ${by.adminName} (${by.adminEmail})\nเวลา: ${thaiTime()}`,
    "deposit",
  );

  return NextResponse.json({ ok: true, bonusUsd });
}
