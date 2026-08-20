import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const KEY = "depositBank";

const defaultBankSetting = {
  bankCode: "KBANK",
  bankName: "ธนาคารกสิกรไทย (KBank)",
  bankNameEn: "Kasikorn Bank (KBank)",
  accountNumber: "098-1-23456-7",
  accountName: "บริษัท ลูนา ฟอเร็กซ์ จำกัด (Luna Forex Co., Ltd.)",
  promptpayQr: "",
};

export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection("settings").findOne({ key: KEY });
    return NextResponse.json({
      success: true,
      setting: doc?.value ?? defaultBankSetting,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, setting: defaultBankSetting },
      { status: 200 }
    );
  }
}
