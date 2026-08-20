import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getDb();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalUsers,
    activeUsers,
    pendingTransactions,
    pendingAccountRequests,
    todayAppointments,
    totalTransactionVolume,
  ] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("users").countDocuments({ status: "active" }),
    db.collection("transactions").countDocuments({ status: "pending" }),
    db.collection("accountRequests").countDocuments({ status: "pending" }),
    db.collection("appointments").countDocuments({
      date: { $gte: startOfDay },
      status: { $ne: "cancelled" },
    }),
    db.collection("transactions").aggregate([
      { $match: { status: "completed", type: "deposit" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray(),
  ]);

  return NextResponse.json({
    totalUsers,
    activeUsers,
    pendingTransactions,
    pendingAccountRequests,
    todayAppointments,
    totalDepositVolume: totalTransactionVolume[0]?.total ?? 0,
  });
}
