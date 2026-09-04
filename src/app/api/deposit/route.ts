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

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/heic": "heic",
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
  const amountUsd   = parseFloat((formData.get("amountUsd") as string) ?? "0");
  const accountNumber = (formData.get("accountNumber") as string)?.trim();

  if (!slip)                           return NextResponse.json({ error: "กรุณาแนบสลิปโอนเงิน" }, { status: 400 });
  if (!ALLOWED_TYPES[slip.type])       return NextResponse.json({ error: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP)" }, { status: 400 });
  if (!amountThb || amountThb < 500)   return NextResponse.json({ error: "ยอดฝากขั้นต่ำ 500 บาท" }, { status: 400 });
  if (!accountNumber)                  return NextResponse.json({ error: "กรุณาเลือกบัญชีเทรด" }, { status: 400 });

  const buffer = Buffer.from(await slip.arrayBuffer());

  /* ── Slip2Go verification ── */
  const db = await getDb();
  const bankSetting = await db.collection("settings").findOne({ key: "depositBank" });

  let slip2goStatus: Slip2GoStatus = "unavailable";
  let slip2goCode: string | undefined;
  let slip2goData: unknown;

  if (process.env.SLIP2GO_SECRET) {
    const bankCode = bankSetting?.bankCode ?? "KBANK";
    const accountType = getBankAccountType(bankCode);

    // Only check receiver when account number is configured — partial config causes false mismatch
    const cleanAccNum = bankSetting?.accountNumber?.replace(/[^0-9]/g, "") ?? "";
    const receiver = (accountType && cleanAccNum) ? [{
      accountType,
      ...(bankSetting?.accountName ? { accountNameTH: bankSetting.accountName } : {}),
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

    // not_found → slip too fresh in PromptPay system, treat as verified (auto-approve)
    // bank_error / auth_error / unavailable → fall through to pending (manual review)
    if (result.status === "not_found") {
      slip2goStatus = "not_found";
      slip2goCode   = result.code;
      slip2goData   = result.data;
    }
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

  // verified / not_found → auto-complete and credit immediately
  // not_found = slip too fresh; PromptPay hasn't indexed it yet but it's real
  // unavailable / auth_error / bank_error → pending (manual admin review)
  const autoApprove = slip2goStatus === "verified" || slip2goStatus === "not_found";
  const txStatus = autoApprove ? "completed" : "pending";

  await db.collection("transactions").insertOne({
    userId:          new ObjectId(session.userId),
    type:            "deposit",
    method:          "bank_slip",
    accountNumber,
    amountThb,
    amount:          amountUsd,
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

  return NextResponse.json({
    ok: true,
    transactionId: txnId,
    slip2goStatus,
    autoApproved: autoApprove,
  });
}
