import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { getExchangeRate } from "@/lib/exchangeRate";
import { bonusWithdrawSummary, recordBlockedWithdrawal } from "@/lib/bonus";
import { notifyAdmins, thaiTime } from "@/lib/lineNotify";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    amountUsd: number;
  };

  const { accountNumber, bankCode, bankName, bankAccountNumber, bankAccountName, amountUsd } = body;

  if (!accountNumber) return NextResponse.json({ error: "กรุณาเลือกบัญชีเทรด" }, { status: 400 });
  if (!bankCode || !bankAccountNumber || !bankAccountName) return NextResponse.json({ error: "กรุณากรอกข้อมูลธนาคารให้ครบ" }, { status: 400 });
  if (!amountUsd || amountUsd < 10) return NextResponse.json({ error: "ยอดถอนขั้นต่ำ $10 USD" }, { status: 400 });

  const db = await getDb();

  /* ตรวจสอบยอดคงเหลือ */
  const account = await db.collection("accounts").findOne({
    accountNumber,
    userId: new ObjectId(session.userId),
    isDemo: { $ne: true },
  });
  if (!account) return NextResponse.json({ error: "ไม่พบบัญชีเทรด" }, { status: 404 });
  if ((account.balance ?? 0) < amountUsd) return NextResponse.json({ error: "ยอดคงเหลือไม่เพียงพอ" }, { status: 400 });

  /* เงื่อนไขโบนัส: ห้ามถอนจนกว่าจะเทรดครบ และถอนได้ไม่เกินเพดาน (ถ้าตั้งไว้) */
  const { withdrawRate } = await getExchangeRate(db);
  const amountThb = Math.round(amountUsd * withdrawRate * 100) / 100;
  const bonus = await bonusWithdrawSummary(db, account);

  let blocked: { reason: "bonus_active" | "over_cap"; message: string } | null = null;
  if (bonus.active) {
    const a = bonus.active;
    const missing = [
      a.remainingLots > 0 ? `เทรดอีก ${a.remainingLots} lots (เทรดแล้ว ${a.tradedLots}/${a.requiredLots} lots)` : "",
      a.remainingPips > 0 ? `ทำอีก ${a.remainingPips.toLocaleString()} pips (ทำแล้ว ${a.tradedPips.toLocaleString()}/${a.requiredPips.toLocaleString()} pips)` : "",
    ].filter(Boolean).join(" และ ");
    blocked = { reason: "bonus_active", message: `ยังถอนไม่ได้: ต้อง${missing} เพื่อปลดล็อกโบนัส` };
  } else if (bonus.withdrawLimitUsd !== null && amountUsd > bonus.withdrawLimitUsd) {
    blocked = { reason: "over_cap", message: `ถอนได้สูงสุด $${bonus.withdrawLimitUsd} ตามเงื่อนไขโบนัส` };
  }

  if (blocked) {
    // Let admins see refused withdrawals too: logged for the admin transactions page, LINE at most every 10 min per account
    try {
      const { notify } = await recordBlockedWithdrawal(db, {
        userId: new ObjectId(session.userId), accountNumber, amountUsd, amountThb, ...blocked, bonus,
      });
      if (notify) {
        const canWithdraw = bonus.active ? 0 : bonus.withdrawLimitUsd;
        void notifyAdmins(
          `⛔ ถอนเงินไม่ผ่านเงื่อนไขโบนัส\nลูกค้า: ${session.firstName} ${session.lastName ?? ""} (${session.email})\nบัญชีเทรด: #${accountNumber}\n` +
          `ขอถอน: $${amountUsd} ≈ ฿${amountThb.toLocaleString()}\nเหตุผล: ${blocked.message.replace(/^ยังถอนไม่ได้: /, "")}\n` +
          `ตอนนี้ถอนได้: ${canWithdraw === null ? "ไม่จำกัด" : `$${canWithdraw}`}\nเวลา: ${thaiTime()}`,
          "withdraw",
        );
      }
    } catch (e) {
      console.error("[withdraw] failed to record blocked attempt:", e);
    }
    return NextResponse.json({ error: blocked.message }, { status: 400 });
  }

  /* ล็อคยอด (หักจาก balance ทันทีเพื่อกันถอนซ้ำ) */
  await db.collection("accounts").updateOne(
    { accountNumber, userId: new ObjectId(session.userId) },
    { $inc: { balance: -amountUsd, equity: -amountUsd, freeMargin: -amountUsd } }
  );

  const txnId = `WDR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  await db.collection("transactions").insertOne({
    userId: new ObjectId(session.userId),
    type: "withdrawal",
    method: "bank_transfer",
    accountNumber,
    bankCode,
    bankName,
    bankAccountNumber,
    bankAccountName,
    amount: amountUsd,
    amountThb,
    exchangeRate: withdrawRate,
    status: "pending",
    transactionId: txnId,
    adminNotes: "",
    bonusAtRequest: bonus.hasBonus ? bonus : null, // what the bonus check saw when this was allowed
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  void notifyAdmins(
    `🏧 คำขอถอนเงิน\nลูกค้า: ${session.firstName} ${session.lastName ?? ""} (${session.email})\nบัญชีเทรด: #${accountNumber}\n` +
    `ยอด: $${amountUsd} ≈ ฿${amountThb.toLocaleString()}\nโอนเข้า: ${bankName} ${bankAccountNumber} (${bankAccountName})\nRef: ${txnId}\nเวลา: ${thaiTime()}`,
    "withdraw",
  );

  return NextResponse.json({ ok: true, transactionId: txnId });
}
