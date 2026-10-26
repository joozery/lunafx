import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { stopSubscription, summarizeMaster } from "@/lib/copyTrading";

/** Every master application/profile with real stats and its owner. */
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getDb();
  const list = await db.collection("copyMasters").find().sort({ createdAt: -1 }).toArray();
  const owners = new Map((await db.collection("users")
    .find({ _id: { $in: list.map((m) => m.userId) } }, { projection: { firstName: 1, lastName: 1, email: 1 } })
    .toArray()).map((u) => [u._id.toString(), u]));

  const masters = await Promise.all(list.map(async (m) => {
    const o = owners.get(m.userId.toString());
    return {
      ...(await summarizeMaster(db, m)),
      accountNumber: m.accountNumber,
      owner: o ? { name: `${o.firstName ?? ""} ${o.lastName ?? ""}`.trim(), email: o.email } : null,
      createdAt: m.createdAt,
    };
  }));
  return NextResponse.json({ success: true, masters });
}

/** { id, action: "approve" | "reject" | "suspend" | "activate" } or { id, featured } / { id, feePercent } */
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!ObjectId.isValid(body.id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const db = await getDb();
  const id = new ObjectId(body.id);
  const master = await db.collection("copyMasters").findOne({ _id: id });
  if (!master) return NextResponse.json({ error: "ไม่พบ Master" }, { status: 404 });

  const set: Record<string, unknown> = { updatedAt: new Date() };
  switch (body.action) {
    case "approve":
    case "activate":
      set.status = "active";
      if (!master.approvedAt) set.approvedAt = new Date();
      break;
    case "reject":
      set.status = "rejected";
      break;
    case "suspend":
      set.status = "suspended";
      break;
  }
  if (typeof body.featured === "boolean") set.featured = body.featured;
  if (body.feePercent !== undefined) {
    const fee = Number(body.feePercent);
    if (!Number.isFinite(fee) || fee < 0 || fee > 50) return NextResponse.json({ error: "ส่วนแบ่งกำไรต้องอยู่ระหว่าง 0–50%" }, { status: 400 });
    set.feePercent = fee;
  }
  await db.collection("copyMasters").updateOne({ _id: id }, { $set: set });

  // Suspending or rejecting a master ends every copy of it (open copies closed at market)
  if (set.status === "suspended" || set.status === "rejected") {
    const active = await db.collection("copySubscriptions").find({ masterId: id, status: "active" }, { projection: { _id: 1 } }).toArray();
    for (const s of active) await stopSubscription(db, s._id, "master_suspended");
  }
  return NextResponse.json({ success: true });
}
