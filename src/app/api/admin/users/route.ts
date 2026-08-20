import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    db.collection("users")
      .find(filter, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    db.collection("users").countDocuments(filter),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({ ...u, _id: u._id.toString() })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status, accountType, role } = await req.json();
  if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (status) update.status = status;
  if (accountType) update.accountType = accountType;
  if (role !== undefined) update.role = role;

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );

  return NextResponse.json({ ok: true });
}
