import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ensureReferralCode, friendStats, getReferralSetting } from "@/lib/referral";
import { getBonusStatus } from "@/lib/bonus";

/** The signed-in user's referral code, rate, referred friends and commissions. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const userId = new ObjectId(session.userId);
  const setting = await getReferralSetting(db);
  if (!setting.enabled) return NextResponse.json({ enabled: false });

  const [code, me] = await Promise.all([
    ensureReferralCode(db, userId),
    db.collection("users").findOne({ _id: userId }, { projection: { referralPercent: 1 } }),
  ]);

  const friends = await db.collection("users")
    .find({ referredBy: userId }, { projection: { firstName: 1, lastName: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .toArray();

  const commissions = await db.collection("referralCommissions")
    .find({ referrerId: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const stats = await friendStats(db, userId, friends.map((f) => f._id));

  // Paid commission lands in a live trading account as ordinary balance; this is what can be withdrawn now
  const myAccounts = await db.collection("accounts").find({ userId, isDemo: { $ne: true } }).toArray();
  let withdrawableUsd = 0;
  for (const a of myAccounts) withdrawableUsd += (await getBonusStatus(db, a)).withdrawableUsd;

  return NextResponse.json({
    enabled: true,
    bustPercent: setting.bustPercent,
    withdrawableUsd: Math.round(withdrawableUsd * 100) / 100,
    hasLiveAccount: myAccounts.length > 0,
    code,
    percent: typeof me?.referralPercent === "number" ? me.referralPercent : setting.defaultPercent,
    // Friends' surnames are shortened to an initial for privacy
    friends: friends.map((f) => ({
      name: `${f.firstName ?? ""} ${(f.lastName ?? "").slice(0, 1)}.`.trim(),
      joinedAt: f.createdAt,
      ...stats.get(f._id.toString()),
    })),
    commissions: commissions.map((c) => ({
      id: c._id.toString(),
      kind: c.kind ?? "deposit",
      depositUsd: c.depositUsd,
      percent: c.percent,
      amountUsd: c.amountUsd,
      status: c.status,
      createdAt: c.createdAt,
    })),
  });
}
