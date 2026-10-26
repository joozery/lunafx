import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { calcPerformanceFee } from "@/lib/copyRules";

const r2 = (n: number) => Math.round(n * 100) / 100;

/** A master's income: fees earned, the fee building up for the next settlement, followers and payouts. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDb();
  const userId = new ObjectId(session.userId);

  const myMasters = await db.collection("copyMasters").find({ userId }).toArray();
  if (myMasters.length === 0) return NextResponse.json({ success: true, masters: [] });
  const ids = myMasters.map((m) => m._id);

  const [subs, settlements] = await Promise.all([
    db.collection("copySubscriptions").find({ masterId: { $in: ids } }).sort({ startedAt: -1 }).toArray(),
    db.collection("copyFeeSettlements").find({ masterId: { $in: ids }, fee: { $gt: 0 } }).sort({ at: -1 }).limit(100).toArray(),
  ]);
  const followerNames = new Map((await db.collection("users")
    .find({ _id: { $in: subs.map((s) => s.followerUserId) } }, { projection: { firstName: 1, lastName: 1 } })
    .toArray()).map((u) => [u._id.toString(), `${u.firstName ?? ""} ${(u.lastName ?? "").slice(0, 1)}.`.trim()]));

  const since30 = Date.now() - 30 * 86_400_000;
  return NextResponse.json({
    success: true,
    masters: myMasters.map((m) => {
      const mySubs = subs.filter((s) => s.masterId.equals(m._id));
      const mySettlements = settlements.filter((x) => x.masterId.equals(m._id));
      const pending = mySubs
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + calcPerformanceFee(s.realizedPnl ?? 0, s.highWaterMark ?? 0, s.feePercent ?? m.feePercent ?? 0).fee, 0);
      return {
        id: m._id.toString(),
        displayName: m.displayName,
        status: m.status,
        feePercent: m.feePercent ?? 0,
        feesTotal: r2(mySettlements.reduce((s, x) => s + x.fee, 0)),
        fees30d: r2(mySettlements.filter((x) => new Date(x.at).getTime() >= since30).reduce((s, x) => s + x.fee, 0)),
        pendingFees: r2(pending),
        followers: mySubs.map((s) => ({
          id: s._id.toString(),
          name: followerNames.get(s.followerUserId.toString()) ?? "—",
          allocation: s.allocation,
          realizedPnl: r2(s.realizedPnl ?? 0),
          feesPaid: r2(s.feesPaid ?? 0),
          feePercent: s.feePercent ?? m.feePercent ?? 0,
          status: s.status,
          startedAt: s.startedAt,
          lastSettledAt: s.lastSettledAt ?? null,
        })),
        payouts: mySettlements.slice(0, 30).map((x) => ({
          ref: x.ref, fee: x.fee, feePercent: x.feePercent, profit: r2(x.newHighWaterMark - x.previousHighWaterMark), at: x.at,
          follower: followerNames.get(x.followerUserId.toString()) ?? "—",
        })),
      };
    }),
  });
}
