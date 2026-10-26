import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAdmin } from "@/lib/adminAuth";
import { r2, getPublicUrl } from "@/lib/r2";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

/* POST — admin image upload (e.g. the PromptPay QR shown on the deposit page) to R2 */
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "กรุณาเลือกไฟล์" }, { status: 400 });
  if (!ALLOWED_TYPES[file.type]) return NextResponse.json({ error: "รองรับเฉพาะรูป JPG, PNG, WEBP" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 5MB" }, { status: 400 });

  const key = `settings/promptpay_qr_${crypto.randomUUID()}.${ALLOWED_TYPES[file.type]}`;
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
  }));

  return NextResponse.json({ publicUrl: getPublicUrl(key) });
}
