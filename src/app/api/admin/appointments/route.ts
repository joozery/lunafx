import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const [appointments, total] = await Promise.all([
    db.collection("appointments")
      .find(filter)
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    db.collection("appointments").countDocuments(filter),
  ]);

  return NextResponse.json({
    appointments: appointments.map((a) => ({ ...a, _id: a._id.toString() })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, email, phone, topic, date, time, notes } = body;
  if (!name || !email || !date || !time) {
    return NextResponse.json({ error: "Name, email, date, and time are required" }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection("appointments").insertOne({
    name,
    email,
    phone: phone ?? "",
    topic: topic ?? "general",
    date: new Date(date),
    time,
    notes: notes ?? "",
    status: "confirmed",
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, id: result.insertedId.toString() }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status, date, time, notes } = await req.json();
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (status) update.status = status;
  if (date) update.date = new Date(date);
  if (time) update.time = time;
  if (notes !== undefined) update.notes = notes;

  const db = await getDb();
  await db.collection("appointments").updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );

  return NextResponse.json({ ok: true });
}
