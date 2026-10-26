import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getBonusStatus } from "@/lib/bonus";

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

  // Trading volume per user on live accounts (demo excluded), so admins can check turnover before approving a withdrawal
  const ids = users.map((u) => u._id);
  const liveAccounts = await db.collection("accounts").find({ userId: { $in: ids }, isDemo: { $ne: true } }).toArray();
  const lots = await db.collection("trades").aggregate([
    { $match: { accountId: { $in: liveAccounts.map((a) => a._id.toString()) } } },
    { $group: {
      _id: "$userId",
      closedLots: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, "$volume", 0] } },
      openLots:   { $sum: { $cond: [{ $eq: ["$status", "open"] }, "$volume", 0] } },
      trades:     { $sum: 1 },
    } },
  ]).toArray();
  const lotsBy = new Map(lots.map((l) => [l._id.toString(), l]));

  const bonusBy = new Map<string, { bonusUsd: number; tradedLots: number; requiredLots: number }>();
  for (const acc of liveAccounts) {
    const st = await getBonusStatus(db, acc);
    if (st.active) bonusBy.set(acc.userId.toString(), st.active);
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return NextResponse.json({
    users: users.map((u) => {
      const id = u._id.toString();
      const l = lotsBy.get(id);
      return {
        ...u,
        _id: id,
        trading: {
          closedLots: round2(l?.closedLots ?? 0),
          openLots: round2(l?.openLots ?? 0),
          trades: l?.trades ?? 0,
          bonus: bonusBy.get(id) ?? null,
        },
      };
    }),
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
