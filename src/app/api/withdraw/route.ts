import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { getExchangeRate } from "@/lib/exchangeRate";
import { bonusWithdrawSummary, forfeitBonusesForWithdrawal, recordBlockedWithdrawal, restartBonusTurnover } from "@/lib/bonus";
import { withdrawalForfeitsBonus } from "@/lib/bonusRules";
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

  /* เงื่อนไขโบนัส: ถอนทุน+กำไรได้ โบนัสที่ยังไม่ครบเงื่อนไขต้องคงไว้ในบัญชี และไม่เกินเพดาน (ถ้าตั้งไว้) */
  const { withdrawRate } = await getExchangeRate(db);
  const amountThb = Math.round(amountUsd * withdrawRate * 100) / 100;
  const bonus = await bonusWithdrawSummary(db, account);

  let blocked: { reason: "bonus_active" | "over_cap"; message: string } | null = null;
  if (amountUsd > bonus.withdrawableUsd) {
    blocked = bonus.active
      ? {
          reason: "bonus_active",
          message: `ถอนได้สูงสุด $${bonus.withdrawableUsd} (ยอดในบัญชี $${bonus.balanceUsd} หักโบนัส $${bonus.bonusHeldUsd} ที่ต้องคงไว้ในบัญชีจนกว่าจะทำเงื่อนไขครบ)`,
        }
      : { reason: "over_cap", message: `ถอนได้สูงสุด $${bonus.withdrawableUsd} ตามเงื่อนไขโบนัส` };
  }

  if (blocked) {
    // Let admins see refused withdrawals too: logged for the admin transactions page, LINE at most every 10 min per account
    try {
      const { notify } = await recordBlockedWithdrawal(db, {
        userId: new ObjectId(session.userId), accountNumber, amountUsd, amountThb, ...blocked, bonus,
      });
      if (notify) {
        const canWithdraw = bonus.withdrawableUsd;
        void notifyAdmins(
          `⛔ ถอนเงินไม่ผ่านเงื่อนไขโบนัส\nลูกค้า: ${session.firstName} ${session.lastName ?? ""} (${session.email})\nบัญชีเทรด: #${accountNumber}\n` +
          `ขอถอน: $${amountUsd} ≈ ฿${amountThb.toLocaleString()}\nเหตุผล: ${blocked.message.replace(/^ยังถอนไม่ได้: /, "")}\n` +
          `ตอนนี้ถอนได้: $${canWithdraw}${bonus.bonusHeldUsd > 0 ? ` (หักโบนัส $${bonus.bonusHeldUsd} ไว้ในบัญชี)` : ""}\nเวลา: ${thaiTime()}`,
          "withdraw",
        );
      }
    } catch (e) {
      console.error("[withdraw] failed to record blocked attempt:", e);
    }
    return NextResponse.json({ error: blocked.message }, { status: 400 });
  }

  /* ถอนหมด (เอาเงินตัวเองออกทั้งหมด) → โบนัสหายไปด้วย; ถอนบางส่วน → โบนัสและยอดที่เหลือคงอยู่ในบัญชี */
  const bonusForfeitedUsd = withdrawalForfeitsBonus(amountUsd, bonus) ? bonus.bonusHeldUsd : 0;
  const debit = Math.round((amountUsd + bonusForfeitedUsd) * 100) / 100;

  /* ล็อคยอด (หักจาก balance ทันทีเพื่อกันถอนซ้ำ) — atomic: balance ต้องยังพอสำหรับยอดถอน + โบนัสที่คงไว้ */
  const locked = await db.collection("accounts").updateOne(
    { _id: account._id, balance: { $gte: amountUsd + bonus.bonusHeldUsd } },
    { $inc: { balance: -debit, equity: -debit, freeMargin: -debit } }
  );
  if (locked.modifiedCount === 0) return NextResponse.json({ error: "ยอดคงเหลือไม่เพียงพอ กรุณาลองใหม่" }, { status: 400 });

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
    bonusBreakdown: bonus.hasBonus
      ? {
          balanceUsd: bonus.balanceUsd,          // ยอดในบัญชีตอนขอถอน
          bonusHeldUsd: bonus.bonusHeldUsd,      // โบนัสที่หักไว้ (คงอยู่ในบัญชี)
          withdrawableUsd: bonus.withdrawableUsd, // ถอนได้สูงสุดตอนนั้น
          amountUsd,                             // ยอดถอนจริง
          turnoverRestarted: Boolean(bonus.active) && bonusForfeitedUsd === 0,
          bonusForfeitedUsd,
        }
      : null,
    bonusForfeitedUsd, // removed from the account with this withdrawal; given back if it is rejected
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (bonusForfeitedUsd > 0) {
    // Full withdrawal: the bonus leaves the account too
    await forfeitBonusesForWithdrawal(db, account._id.toString(), txnId).catch((e) => console.error("[withdraw] forfeit bonus failed:", e));
    await db.collection("transactions").insertOne({
      userId: new ObjectId(session.userId),
      type: "bonus",
      method: "bonus_forfeited",
      accountNumber,
      amount: -bonusForfeitedUsd,
      status: "completed",
      transactionId: `BFF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      adminNotes: `โบนัสหมดสิทธิ์ (ถอนเงินทั้งหมด ${txnId})`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else if (bonus.active) {
    // A bonus still owing turnover stays in the account; withdrawing restarts its conditions from now
    await restartBonusTurnover(db, account._id.toString(), txnId).catch((e) => console.error("[withdraw] restart turnover failed:", e));
  }

  const bonusLine = bonusForfeitedUsd > 0
    ? `ถอนทั้งหมด → ตัดโบนัสออก: $${bonusForfeitedUsd}\n`
    : bonus.bonusHeldUsd > 0
      ? `ยอดในบัญชี: $${bonus.balanceUsd} · หักโบนัสคงไว้: $${bonus.bonusHeldUsd} · ถอนได้สูงสุด: $${bonus.withdrawableUsd}\n`
      : "";
  void notifyAdmins(
    `🏧 คำขอถอนเงิน\nลูกค้า: ${session.firstName} ${session.lastName ?? ""} (${session.email})\nบัญชีเทรด: #${accountNumber}\n` +
    `ยอด: $${amountUsd} ≈ ฿${amountThb.toLocaleString()}\n${bonusLine}โอนเข้า: ${bankName} ${bankAccountNumber} (${bankAccountName})\nRef: ${txnId}\nเวลา: ${thaiTime()}`,
    "withdraw",
  );

  return NextResponse.json({ ok: true, transactionId: txnId, bonusForfeitedUsd });
}
