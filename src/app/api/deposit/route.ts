import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { r2, getPublicUrl } from "@/lib/r2";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

/* POST — รับสลิปโอนเงินผ่าน multipart form → upload R2 → บันทึก transaction pending */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const slip = formData.get("slip") as File | null;
  const amountThb = parseFloat((formData.get("amountThb") as string) ?? "0");
  const amountUsd = parseFloat((formData.get("amountUsd") as string) ?? "0");
  const accountNumber = (formData.get("accountNumber") as string)?.trim();

  if (!slip) return NextResponse.json({ error: "กรุณาแนบสลิปโอนเงิน" }, { status: 400 });
  if (!ALLOWED_TYPES[slip.type]) return NextResponse.json({ error: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP)" }, { status: 400 });
  if (!amountThb || amountThb <= 0) return NextResponse.json({ error: "กรุณาระบุจำนวนเงินที่ถูกต้อง" }, { status: 400 });
  if (!accountNumber) return NextResponse.json({ error: "กรุณาเลือกบัญชีเทรด" }, { status: 400 });

  /* Upload slip → R2 */
  const ext = ALLOWED_TYPES[slip.type];
  const slipKey = `deposits/${session.userId}/slip_${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await slip.arrayBuffer());
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: slipKey,
    Body: buffer,
    ContentType: slip.type,
  }));
  const slipUrl = getPublicUrl(slipKey);

  /* บันทึก transaction */
  const txnId = `DEP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const db = await getDb();
  await db.collection("transactions").insertOne({
    userId: new ObjectId(session.userId),
    type: "deposit",
    method: "bank_slip",
    accountNumber,
    amountThb,
    amount: amountUsd,
    slipUrl,
    slipKey,
    status: "pending",
    transactionId: txnId,
    adminNotes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true, transactionId: txnId });
}
