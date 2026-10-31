import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ensureReferralCode, getReferralSetting } from "@/lib/referral";

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

  return NextResponse.json({
    enabled: true,
    code,
    percent: typeof me?.referralPercent === "number" ? me.referralPercent : setting.defaultPercent,
    // Friends' surnames are shortened to an initial for privacy
    friends: friends.map((f) => ({ name: `${f.firstName ?? ""} ${(f.lastName ?? "").slice(0, 1)}.`.trim(), joinedAt: f.createdAt })),
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
