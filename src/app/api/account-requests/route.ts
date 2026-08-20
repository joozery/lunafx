import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type KycDoc = { key: string; url: string };

export type AccountRequestDocs = {
  idFront: KycDoc;
  idBack: KycDoc;
  selfie: KycDoc;
  bankStatement?: KycDoc;
};

/* GET — ดึงคำขอของ user ที่ล็อกอินอยู่ */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const requests = await db
    .collection("accountRequests")
    .find({ userId: new ObjectId(session.userId) })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    requests: requests.map((r) => ({
      ...r,
      _id: r._id.toString(),
      userId: r.userId?.toString(),
    })),
  });
}

/* POST — ส่งคำขอเปิดบัญชีพร้อมเอกสาร KYC */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    platform: string;
    accountType: string;
    leverage: string;
    currency: string;
    documents: AccountRequestDocs;
  };

  const { platform, accountType, leverage, currency, documents } = body;

  if (!documents?.idFront?.key || !documents?.idBack?.key || !documents?.selfie?.key) {
    return NextResponse.json({ error: "กรุณาอัปโหลดเอกสารให้ครบ" }, { status: 400 });
  }

  const db = await getDb();

  /* ตรวจสอบว่ามีคำขอที่ pending อยู่แล้วหรือไม่ */
  const existing = await db.collection("accountRequests").findOne({
    userId: new ObjectId(session.userId),
    status: "pending",
  });
  if (existing) {
    return NextResponse.json(
      { error: "คุณมีคำขอที่รอการอนุมัติอยู่แล้ว กรุณารอผลการพิจารณาก่อน" },
      { status: 409 }
    );
  }

  const doc = {
    userId: new ObjectId(session.userId),
    platform: platform ?? "MT5",
    accountType: accountType ?? "Standard",
    leverage: leverage ?? "1:200",
    currency: currency ?? "USD",
    documents,
    status: "pending",
    adminNotes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("accountRequests").insertOne(doc);

  return NextResponse.json({ ok: true, requestId: result.insertedId.toString() });
}
