import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { isValidPromptPayId } from "@/lib/promptpay";

const KEY = "depositBank";

const defaultBankSetting = {
  bankCode: "KBANK",
  bankName: "ธนาคารกสิกรไทย (KBank)",
  bankNameEn: "Kasikorn Bank (KBank)",
  accountNumber: "098-1-23456-7",
  accountName: "บริษัท ลูนา ฟอเร็กซ์ จำกัด (Luna Forex Co., Ltd.)",
  promptpayQr: "",
  promptpayId: "",
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await getDb();
  const doc = await db.collection("settings").findOne({ key: KEY });
  return NextResponse.json({ success: true, setting: doc?.value ?? defaultBankSetting });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { bankCode, bankName, bankNameEn, accountNumber, accountName, promptpayQr, promptpayId } = body;

  if (!bankCode || !accountNumber || !accountName) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลธนาคารให้ครบถ้วน" }, { status: 400 });
  }
  if (promptpayId && !isValidPromptPayId(promptpayId)) {
    return NextResponse.json({ error: "รหัสพร้อมเพย์ต้องเป็นเบอร์มือถือ (06/08/09) หรือเลขบัตรประชาชน/เลขผู้เสียภาษี 13 หลัก — ใส่เลขบัญชีธนาคารไม่ได้" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("settings").updateOne(
    { key: KEY },
    {
      $set: {
        key: KEY,
        value: {
          bankCode,
          bankName,
          bankNameEn: bankNameEn || bankName,
          accountNumber,
          accountName,
          promptpayQr: promptpayQr || "",
          promptpayId: promptpayId ? String(promptpayId).replace(/[^0-9]/g, "") : "",
        },
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
