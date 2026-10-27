import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { r2, getPublicUrl } from "@/lib/r2";
import {
  verifySlipImage,
  getBankAccountType,
  type Slip2GoStatus,
} from "@/lib/slip2go";
import { getExchangeRate } from "@/lib/exchangeRate";
import { grantDepositBonus } from "@/lib/bonus";
import { recordReferralCommission } from "@/lib/referral";
import { notifyAdmins, thaiTime } from "@/lib/lineNotify";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heic",
};

// Human-readable Thai errors per Slip2Go status
const SLIP_ERROR_TH: Partial<Record<Slip2GoStatus, string>> = {
  duplicate:         "สลิปนี้ถูกใช้งานไปแล้ว กรุณาตรวจสอบอีกครั้ง",
  fake:              "ตรวจพบสลิปปลอมหรือสลิปเสีย กรุณาติดต่อทีมงาน",
  amount_mismatch:   "ยอดเงินในสลิปไม่ตรงกับจำนวนที่ระบุ กรุณาตรวจสอบและลองใหม่",
  receiver_mismatch: "บัญชีผู้รับในสลิปไม่ตรงกับบัญชีบริษัท กรุณาโอนมายังบัญชีที่ระบุเท่านั้น",
  not_found:         "ไม่พบข้อมูลการโอนนี้ในระบบธนาคาร กรุณารอสักครู่แล้วลองใหม่",
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const slip        = formData.get("slip") as File | null;
  const amountThb   = parseFloat((formData.get("amountThb") as string) ?? "0");
  const accountNumber = (formData.get("accountNumber") as string)?.trim();

  if (!slip)                           return NextResponse.json({ error: "กรุณาแนบสลิปโอนเงิน" }, { status: 400 });
  if (!ALLOWED_TYPES[slip.type])       return NextResponse.json({ error: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP)" }, { status: 400 });
  if (!amountThb || amountThb < 500)   return NextResponse.json({ error: "ยอดฝากขั้นต่ำ 500 บาท" }, { status: 400 });
  if (!accountNumber)                  return NextResponse.json({ error: "กรุณาเลือกบัญชีเทรด" }, { status: 400 });

  const buffer = Buffer.from(await slip.arrayBuffer());

  const db = await getDb();

  // Never trust a USD amount from the client — derive it from the THB amount
  const { depositRate } = await getExchangeRate(db);
  const amountUsd = Math.round((amountThb / depositRate) * 100) / 100;

  /* ── Slip2Go verification ── */
  const bankDoc = await db.collection("settings").findOne({ key: "depositBank" });
  const bankSetting = bankDoc?.value as { bankCode?: string; accountNumber?: string } | undefined;

  let slip2goStatus: Slip2GoStatus = "unavailable";
  let slip2goCode: string | undefined;
  let slip2goData: unknown;

  if (process.env.SLIP2GO_SECRET) {
    const bankCode = bankSetting?.bankCode ?? "KBANK";
    const accountType = getBankAccountType(bankCode);

    // Only check receiver when account number is configured — partial config causes false mismatch
    const cleanAccNum = bankSetting?.accountNumber?.replace(/[^0-9]/g, "") ?? "";
    // Name is left out on purpose: slips show a truncated name, which would cause false mismatches
    const receiver = (accountType && cleanAccNum) ? [{
      accountType,
      accountNumber: cleanAccNum,
    }] : undefined;

    const result = await verifySlipImage(
      buffer,
      slip.type,
      slip.name || `slip.${ALLOWED_TYPES[slip.type]}`,
      {
        checkDuplicate: true,
        checkAmount: {
          type: "eq",
          amount: amountThb % 1 === 0
            ? String(amountThb)
            : amountThb.toFixed(2).replace(/\.?0+$/, ""),
        },
        ...(receiver ? { checkReceiver: receiver } : {}),
      }
    );

    slip2goStatus = result.status;
    slip2goCode   = result.code;
    slip2goData   = result.data;

    // Hard-reject on definitive fraud / mismatches
    if (
      result.status === "duplicate" ||
      result.status === "fake" ||
      result.status === "amount_mismatch" ||
      result.status === "receiver_mismatch"
    ) {
      const errMsg = SLIP_ERROR_TH[result.status] ?? "สลิปไม่ผ่านการตรวจสอบ";
      return NextResponse.json({ error: errMsg, slip2goCode: result.code }, { status: 400 });
    }

    // not_found / bank_error / auth_error / unavailable → fall through to pending (manual review)
  }

  /* ── Upload slip → R2 ── */
  const ext = ALLOWED_TYPES[slip.type];
  const slipKey = `deposits/${session.userId}/slip_${crypto.randomUUID()}.${ext}`;
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key:    slipKey,
    Body:   buffer,
    ContentType: slip.type,
  }));
  const slipUrl = getPublicUrl(slipKey);

  /* ── Save transaction ── */
  const txnId = `DEP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Only a slip Slip2Go confirmed is credited immediately. not_found can also mean a
  // fabricated slip, so it goes to manual review with the other non-verified states.
  const autoApprove = slip2goStatus === "verified";
  const txStatus = autoApprove ? "completed" : "pending";

  const { insertedId: depositTxnId } = await db.collection("transactions").insertOne({
    userId:          new ObjectId(session.userId),
    type:            "deposit",
    method:          "bank_slip",
    accountNumber,
    amountThb,
    amount:          amountUsd,
    exchangeRate:    depositRate,
    slipUrl,
    slipKey,
    status:          txStatus,
    transactionId:   txnId,
    adminNotes:      autoApprove ? "อนุมัติอัตโนมัติ (Slip2Go verified)" : "",
    slip2go: {
      status:  slip2goStatus,
      code:    slip2goCode ?? null,
      data:    slip2goData ?? null,
      checked: slip2goStatus !== "unavailable",
    },
    createdAt:  new Date(),
    updatedAt:  new Date(),
  });

  // Credit account balance immediately when auto-approved
  if (autoApprove && amountUsd > 0) {
    const updateResult = await db.collection("accounts").updateOne(
      { accountNumber },
      { $inc: { balance: amountUsd, equity: amountUsd, freeMargin: amountUsd } }
    );
    if (updateResult.matchedCount === 0) {
      console.error(`[deposit] account not found for accountNumber=${accountNumber}`);
    }
  }

  let bonusUsd = 0;
  if (autoApprove) {
    const txn = await db.collection("transactions").findOne({ _id: depositTxnId });
    if (txn) {
      bonusUsd = await grantDepositBonus(db, txn).catch((e) => { console.error("[deposit] bonus failed:", e); return 0; });
      await recordReferralCommission(db, txn).catch((e) => console.error("[deposit] referral failed:", e));
    }
  }

  const statusLine = autoApprove
    ? "✅ อนุมัติอัตโนมัติ (Slip2Go ตรวจผ่าน)"
    : `⏳ รอแอดมินตรวจสอบ (Slip2Go: ${slip2goStatus})`;
  void notifyAdmins(
    `💰 แจ้งฝากเงิน / ส่งสลิป\nลูกค้า: ${session.firstName} ${session.lastName ?? ""} (${session.email})\nบัญชีเทรด: #${accountNumber}\n` +
    `ยอด: ฿${amountThb.toLocaleString()} ≈ $${amountUsd}${bonusUsd > 0 ? ` (+โบนัส $${bonusUsd})` : ""}\n${statusLine}\nRef: ${txnId}\nสลิป: ${slipUrl}\nเวลา: ${thaiTime()}`,
    "deposit",
  );

  return NextResponse.json({
    ok: true,
    transactionId: txnId,
    slip2goStatus,
    autoApproved: autoApprove,
    bonusUsd,
  });
}
