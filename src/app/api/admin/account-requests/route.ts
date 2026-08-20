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

  const [requests, total] = await Promise.all([
    db.collection("accountRequests")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    db.collection("accountRequests").countDocuments(filter),
  ]);

  const userIds = requests.filter((r) => r.userId).map((r) => new ObjectId(r.userId));
  const users = userIds.length
    ? await db.collection("users")
        .find({ _id: { $in: userIds } }, { projection: { firstName: 1, lastName: 1, email: 1 } })
        .toArray()
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  return NextResponse.json({
    requests: requests.map((r) => ({
      ...r,
      _id: r._id.toString(),
      userId: r.userId?.toString() ?? null,
      user: r.userId ? (userMap[r.userId.toString()] ?? null) : null,
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status, notes } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "ID and status required" }, { status: 400 });

  const db = await getDb();

  await db.collection("accountRequests").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, adminNotes: notes ?? "", updatedAt: new Date() } }
  );

  if (status === "approved") {
    const request = await db.collection("accountRequests").findOne({ _id: new ObjectId(id) });
    if (request) {
      const accountNumber = `88${Math.floor(10000 + Math.random() * 90000)}`;
      await db.collection("accounts").insertOne({
        userId: request.userId,
        accountNumber,
        platform: request.platform ?? "MT5",
        type: request.accountType ?? "Standard",
        server: "LunaForex-Real01",
        currency: request.currency ?? "USD",
        balance: 0,
        equity: 0,
        freeMargin: 0,
        leverage: request.leverage ?? "1:200",
        isDemo: false,
        status: "active",
        createdAt: new Date(),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
