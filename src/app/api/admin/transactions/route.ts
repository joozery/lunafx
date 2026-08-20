import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  const db = await getDb();
  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;
  if (status) filter.status = status;

  const [transactions, total] = await Promise.all([
    db.collection("transactions")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
    db.collection("transactions").countDocuments(filter),
  ]);

  // Enrich with user info
  const userIds = [...new Set(transactions.map((t) => t.userId.toString()))];
  const users = await db.collection("users")
    .find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }, { projection: { firstName: 1, lastName: 1, email: 1 } })
    .toArray();
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      ...t,
      _id: t._id.toString(),
      userId: t.userId.toString(),
      user: userMap[t.userId.toString()] ?? null,
    })),
    total,
    pages: Math.ceil(total / limit),
    page,
  });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status, adminNotes } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "ID and status required" }, { status: 400 });

  const db = await getDb();

  const txn = await db.collection("transactions").findOne({ _id: new ObjectId(id) });
  if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  await db.collection("transactions").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, adminNotes: adminNotes ?? "", updatedAt: new Date() } }
  );

  /* อนุมัติฝาก → เติมยอดในบัญชีเทรด */
  if (status === "completed" && txn.type === "deposit" && txn.accountNumber && txn.amount > 0) {
    await db.collection("accounts").updateOne(
      { accountNumber: txn.accountNumber },
      { $inc: { balance: txn.amount, equity: txn.amount } }
    );
  }

  /* ปฏิเสธถอน → คืนยอดให้ user (ยอดถูกหักไปแล้วตอนส่งคำขอ) */
  if (status === "failed" && txn.type === "withdrawal" && txn.accountNumber && txn.amount > 0) {
    await db.collection("accounts").updateOne(
      { accountNumber: txn.accountNumber },
      { $inc: { balance: txn.amount, equity: txn.amount } }
    );
  }

  return NextResponse.json({ ok: true });
}
