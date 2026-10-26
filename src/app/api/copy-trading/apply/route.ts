import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { summarizeMaster } from "@/lib/copyTrading";

/** The signed-in user's master applications / profiles. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDb();
  const mine = await db.collection("copyMasters").find({ userId: new ObjectId(session.userId) }).sort({ createdAt: -1 }).toArray();
  const masters = await Promise.all(mine.map(async (m) => ({ ...(await summarizeMaster(db, m)), accountNumber: m.accountNumber })));
  return NextResponse.json({ success: true, masters });
}

/** Apply to become a master with one live trading account; an admin approves it. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const displayName = String(body.displayName ?? "").trim();
  const description = String(body.description ?? "").trim().slice(0, 500);
  const feePercent = Number(body.feePercent ?? 0);
  const minAllocation = Number(body.minAllocation ?? 0);
  if (!/^[\p{L}\p{N}_. -]{3,30}$/u.test(displayName)) return NextResponse.json({ error: "ชื่อที่แสดงต้องยาว 3–30 ตัวอักษร" }, { status: 400 });
  if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent > 50) return NextResponse.json({ error: "ส่วนแบ่งกำไรต้องอยู่ระหว่าง 0–50%" }, { status: 400 });
  if (!Number.isFinite(minAllocation) || minAllocation < 0) return NextResponse.json({ error: "เงินขั้นต่ำไม่ถูกต้อง" }, { status: 400 });
  if (!ObjectId.isValid(body.accountId)) return NextResponse.json({ error: "กรุณาเลือกบัญชีเทรด" }, { status: 400 });

  const db = await getDb();
  const userId = new ObjectId(session.userId);
  const account = await db.collection("accounts").findOne({ _id: new ObjectId(body.accountId), userId, isDemo: { $ne: true } });
  if (!account) return NextResponse.json({ error: "ต้องใช้บัญชีเทรดจริงของคุณเอง" }, { status: 400 });

  const accountId = account._id.toString();
  if (await db.collection("copyMasters").findOne({ accountId, status: { $in: ["pending", "active"] } })) {
    return NextResponse.json({ error: "บัญชีนี้สมัครเป็น Master ไว้แล้ว" }, { status: 409 });
  }
  if (await db.collection("copySubscriptions").findOne({ followerAccountId: accountId, status: "active" })) {
    return NextResponse.json({ error: "บัญชีนี้กำลังคัดลอก Master อื่นอยู่ — ใช้บัญชีแยกสำหรับเป็น Master" }, { status: 409 });
  }
  if (await db.collection("copyMasters").findOne({ displayName, status: { $ne: "rejected" } })) {
    return NextResponse.json({ error: "ชื่อนี้ถูกใช้แล้ว" }, { status: 409 });
  }

  await db.collection("copyMasters").insertOne({
    userId, accountId, accountNumber: account.accountNumber,
    displayName, description, feePercent, minAllocation: Math.round(minAllocation * 100) / 100,
    featured: false, status: "pending", createdAt: new Date(),
  });
  return NextResponse.json({ success: true });
}
