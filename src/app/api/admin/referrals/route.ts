import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Document } from "mongodb";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { payReferralCommission } from "@/lib/referral";

const fullName = (u: Document | null | undefined) =>
  u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "";

/** Every referrer with the users they brought in, their deposits, and commission totals. */
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getDb();

  const referred = await db.collection("users")
    .find({ referredBy: { $exists: true } }, { projection: { firstName: 1, lastName: 1, email: 1, referredBy: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .toArray();

  const referrerIds = [...new Set(referred.map((u) => u.referredBy.toString()))].map((id) => new ObjectId(id));
  const referrers = await db.collection("users")
    .find({ _id: { $in: referrerIds } }, { projection: { firstName: 1, lastName: 1, email: 1, referralCode: 1, referralPercent: 1 } })
    .toArray();

  const deposits = await db.collection("transactions").aggregate([
    { $match: { type: "deposit", status: "completed", userId: { $in: referred.map((u) => u._id) } } },
    { $group: { _id: "$userId", total: { $sum: "$amount" } } },
  ]).toArray();
  const depositBy = new Map(deposits.map((d) => [d._id.toString(), d.total]));

  const commissionTotals = await db.collection("referralCommissions").aggregate([
    { $group: { _id: { referrer: "$referrerId", status: "$status" }, total: { $sum: "$amountUsd" } } },
  ]).toArray();
  const totalFor = (id: string, status: string) =>
    commissionTotals.find((c) => c._id.referrer.toString() === id && c._id.status === status)?.total ?? 0;

  const pending = await db.collection("referralCommissions").find({ status: "pending" }).sort({ createdAt: -1 }).limit(200).toArray();
  const nameIds = [...new Set(pending.flatMap((c) => [c.referrerId.toString(), c.referredUserId.toString()]))].map((id) => new ObjectId(id));
  const names = new Map((await db.collection("users").find({ _id: { $in: nameIds } }, { projection: { firstName: 1, lastName: 1, email: 1 } }).toArray())
    .map((u) => [u._id.toString(), { name: fullName(u), email: u.email }]));

  return NextResponse.json({
    referrers: referrers.map((r) => {
      const id = r._id.toString();
      const mine = referred.filter((u) => u.referredBy.toString() === id);
      return {
        id,
        name: fullName(r),
        email: r.email,
        code: r.referralCode ?? null,
        percent: typeof r.referralPercent === "number" ? r.referralPercent : null,
        paidUsd: totalFor(id, "paid"),
        pendingUsd: totalFor(id, "pending"),
        referred: mine.map((u) => ({
          id: u._id.toString(),
          name: fullName(u),
          email: u.email,
          joinedAt: u.createdAt,
          depositsUsd: depositBy.get(u._id.toString()) ?? 0,
        })),
      };
    }).sort((a, b) => b.referred.length - a.referred.length),
    pending: pending.map((c) => ({
      id: c._id.toString(),
      referrer: names.get(c.referrerId.toString()) ?? null,
      referred: names.get(c.referredUserId.toString()) ?? null,
      kind: c.kind ?? "deposit",
      depositUsd: c.depositUsd,
      percent: c.percent,
      amountUsd: c.amountUsd,
      createdAt: c.createdAt,
    })),
  });
}

/** { action: "approve" | "reject", commissionId } or { action: "setPercent", email, percent: number | null } */
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const db = await getDb();

  if (body.action === "approve" || body.action === "reject") {
    if (!ObjectId.isValid(body.commissionId)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
    const id = new ObjectId(body.commissionId);
    if (body.action === "approve") {
      const r = await payReferralCommission(db, id);
      return r.ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: r.error }, { status: 400 });
    }
    const r = await db.collection("referralCommissions").updateOne(
      { _id: id, status: "pending" },
      { $set: { status: "rejected", rejectedAt: new Date() } },
    );
    return r.modifiedCount ? NextResponse.json({ success: true }) : NextResponse.json({ error: "รายการนี้ดำเนินการไปแล้ว" }, { status: 400 });
  }

  if (body.action === "setPercent") {
    const percent = body.percent === null || body.percent === "" ? null : Number(body.percent);
    if (percent !== null && (!Number.isFinite(percent) || percent < 0 || percent > 100)) {
      return NextResponse.json({ error: "เปอร์เซ็นต์ต้องอยู่ระหว่าง 0 – 100" }, { status: 400 });
    }
    const email = String(body.email ?? "").toLowerCase().trim();
    const r = await db.collection("users").updateOne(
      { email },
      percent === null ? { $unset: { referralPercent: "" } } : { $set: { referralPercent: Math.round(percent * 100) / 100 } },
    );
    return r.matchedCount ? NextResponse.json({ success: true }) : NextResponse.json({ error: "ไม่พบผู้ใช้อีเมลนี้" }, { status: 404 });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
