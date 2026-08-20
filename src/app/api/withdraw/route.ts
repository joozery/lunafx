import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
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

  /* ล็อคยอด (หักจาก balance ทันทีเพื่อกันถอนซ้ำ) */
  await db.collection("accounts").updateOne(
    { accountNumber, userId: new ObjectId(session.userId) },
    { $inc: { balance: -amountUsd, equity: -amountUsd } }
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
    status: "pending",
    transactionId: txnId,
    adminNotes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true, transactionId: txnId });
}
