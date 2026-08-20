import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSession } from "@/lib/session";
import { r2, getPublicUrl } from "@/lib/r2";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/pdf": "pdf",
};

const ALLOWED_PURPOSES = new Set(["id_front", "id_back", "selfie", "bank_statement"]);

/* POST — รับไฟล์ multipart แล้วอัปโหลดไปยัง R2 โดยตรง (ไม่ผ่าน pre-signed URL) */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const purpose = formData.get("purpose") as string | null;

  if (!file || !purpose) {
    return NextResponse.json({ error: "Missing file or purpose" }, { status: 400 });
  }
  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json({ error: "File type not allowed (jpeg/png/webp/heic/pdf)" }, { status: 400 });
  }
  if (!ALLOWED_PURPOSES.has(purpose)) {
    return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  const key = `kyc/${session.userId}/${purpose}_${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return NextResponse.json({ key, publicUrl: getPublicUrl(key) });
}
