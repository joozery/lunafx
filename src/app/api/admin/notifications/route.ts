import { NextResponse } from "next/server";
import { ObjectId, type Document } from "mongodb";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";

type Kind = "signup" | "deposit" | "withdrawal" | "account_request" | "referral";

export interface AdminNotification {
  id: string;
  kind: Kind;
  title: string;
  detail: string;
  status: string | null;
  href: string;
  at: string;
}

const LIMIT = 15;
const name = (u: Document | undefined) => (u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email : "ลูกค้า");

/** Latest signups, deposits, withdrawals, account requests and referral commissions, plus pending counts and unread count. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getDb();

  const [me, users, txns, requests, commissions, pendingDeposits, pendingWithdrawals, pendingRequests, pendingReferrals] = await Promise.all([
    db.collection("users").findOne({ _id: new ObjectId(admin.userId) }, { projection: { adminNotificationsSeenAt: 1 } }),
    db.collection("users").find({ role: { $ne: "admin" } }, { projection: { firstName: 1, lastName: 1, email: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(LIMIT).toArray(),
    db.collection("transactions").find({ type: { $in: ["deposit", "withdrawal"] } }).sort({ createdAt: -1 }).limit(LIMIT).toArray(),
    db.collection("accountRequests").find().sort({ createdAt: -1 }).limit(LIMIT).toArray(),
    db.collection("referralCommissions").find().sort({ createdAt: -1 }).limit(LIMIT).toArray(),
    db.collection("transactions").countDocuments({ type: "deposit", status: "pending" }),
    db.collection("transactions").countDocuments({ type: "withdrawal", status: "pending" }),
    db.collection("accountRequests").countDocuments({ status: "pending" }),
    db.collection("referralCommissions").countDocuments({ status: "pending" }),
  ]);

  const userIds = [...new Set([
    ...[...txns, ...requests].map((t) => t.userId?.toString()),
    ...commissions.map((c) => c.referrerId?.toString()),
  ].filter(Boolean))].map((id) => new ObjectId(id));
  const owners = new Map((await db.collection("users").find({ _id: { $in: userIds } }, { projection: { firstName: 1, lastName: 1, email: 1 } }).toArray())
    .map((u) => [u._id.toString(), u]));

  const items: AdminNotification[] = [
    ...users.map((u) => ({
      id: `u-${u._id}`, kind: "signup" as const, title: "สมาชิกใหม่สมัคร",
      detail: `${name(u)} · ${u.email}`, status: null, href: "/admin/users", at: u.createdAt,
    })),
    ...txns.map((t) => ({
      id: `t-${t._id}`,
      kind: t.type === "deposit" ? "deposit" as const : "withdrawal" as const,
      title: t.type === "deposit" ? "แจ้งฝากเงิน" : "คำขอถอนเงิน",
      detail: `${name(owners.get(t.userId?.toString()))} · #${t.accountNumber ?? "-"} · ` +
        (t.type === "deposit" && t.amountThb ? `฿${Number(t.amountThb).toLocaleString()}` : `$${Number(t.amount ?? 0).toLocaleString()}`),
      status: t.status ?? null, href: "/admin/transactions", at: t.createdAt,
    })),
    ...requests.map((r) => ({
      id: `r-${r._id}`, kind: "account_request" as const, title: "คำขอเปิดบัญชีเทรด",
      detail: `${name(owners.get(r.userId?.toString()))} · ${r.platform ?? ""} ${r.accountType ?? ""}`.trim(),
      status: r.status ?? null, href: "/admin/account-requests", at: r.createdAt,
    })),
    ...commissions.map((c) => ({
      id: `c-${c._id}`, kind: "referral" as const, title: "ค่าแนะนำเพื่อน",
      detail: `${name(owners.get(c.referrerId?.toString()))} · ${c.kind === "bust" ? "พอร์ตแตก " : ""}${c.percent}% ของ $${Number(c.depositUsd ?? 0).toLocaleString()} = $${Number(c.amountUsd ?? 0).toLocaleString()}`,
      status: c.status ?? null, href: "/admin/referrals", at: c.createdAt,
    })),
  ]
    .filter((n) => n.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 20);

  const seenAt = me?.adminNotificationsSeenAt ? new Date(me.adminNotificationsSeenAt).getTime() : 0;
  return NextResponse.json({
    items,
    unread: items.filter((n) => new Date(n.at).getTime() > seenAt).length,
    seenAt: seenAt || null,
    pending: { deposits: pendingDeposits, withdrawals: pendingWithdrawals, accountRequests: pendingRequests, referrals: pendingReferrals },
  });
}

/** Mark everything up to now as read for this admin. */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getDb();
  await db.collection("users").updateOne({ _id: new ObjectId(admin.userId) }, { $set: { adminNotificationsSeenAt: new Date() } });
  return NextResponse.json({ ok: true });
}
