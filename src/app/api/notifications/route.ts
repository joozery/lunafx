import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Document } from "mongodb";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";

/*
 * Customer notifications, derived from what already happened to the user's money and
 * accounts (no separate notification store): deposits/withdrawals and their outcome,
 * bonuses, commissions, fees, positions closed by the system, account requests,
 * stopped copies and friends who joined through the user's referral link.
 */

type Tone = "success" | "warning" | "danger" | "info";
interface Item { id: string; tone: Tone; title: [string, string]; detail: [string, string]; href: string; at: Date }

const LIMIT = 20;
const usd = (n: number) => `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const thb = (n: number) => `฿${Number(n || 0).toLocaleString("en-US")}`;
const when = (d: Document) => d.updatedAt ?? d.createdAt;

function txnItem(t: Document): Item | null {
  const acct = t.accountNumber ? ` · #${t.accountNumber}` : "";
  const base = { id: `t-${t._id}`, href: "history", at: when(t) };
  switch (t.type) {
    case "deposit": {
      const amt = t.amountThb ? `${thb(t.amountThb)} (${usd(t.amount)})` : usd(t.amount);
      if (t.status === "completed") return { ...base, tone: "success", title: ["ฝากเงินสำเร็จ", "Deposit credited"], detail: [`${amt} เข้าบัญชีแล้ว${acct}`, `${amt} credited${acct}`] };
      if (t.status === "failed") return { ...base, tone: "danger", title: ["ยอดฝากไม่ผ่านการอนุมัติ", "Deposit rejected"], detail: [`${amt}${t.adminNotes ? ` — ${t.adminNotes}` : ""}`, `${amt}${t.adminNotes ? ` — ${t.adminNotes}` : ""}`] };
      return { ...base, tone: "info", title: ["ได้รับสลิปแล้ว รอตรวจสอบ", "Deposit under review"], detail: [`${amt}${acct}`, `${amt}${acct}`] };
    }
    case "withdrawal":
      if (t.status === "completed") return { ...base, tone: "success", title: ["โอนเงินถอนแล้ว", "Withdrawal paid"], detail: [`${usd(t.amount)} โอนเข้าบัญชีธนาคารของคุณแล้ว`, `${usd(t.amount)} sent to your bank`] };
      if (t.status === "failed") return { ...base, tone: "danger", title: ["คำขอถอนไม่ผ่าน — คืนยอดเข้าบัญชีแล้ว", "Withdrawal rejected — refunded"], detail: [`${usd(t.amount)}${t.adminNotes ? ` — ${t.adminNotes}` : ""}`, `${usd(t.amount)}${t.adminNotes ? ` — ${t.adminNotes}` : ""}`] };
      return { ...base, tone: "info", title: ["ได้รับคำขอถอนแล้ว", "Withdrawal requested"], detail: [`${usd(t.amount)} รอทีมงานโอน`, `${usd(t.amount)} pending`] };
    case "bonus":
      return { ...base, tone: "success", title: ["ได้รับโบนัสเงินฝาก 🎁", "Deposit bonus 🎁"], detail: [`+${usd(t.amount)}${acct}`, `+${usd(t.amount)}${acct}`] };
    case "commission":
      return { ...base, tone: "success", title: ["ได้รับค่าแนะนำเพื่อน", "Referral commission"], detail: [`+${usd(t.amount)}${acct}`, `+${usd(t.amount)}${acct}`] };
    case "copy_fee_income":
      return { ...base, tone: "success", title: ["ได้รับส่วนแบ่งกำไร Copy Trade", "Copy-trading income"], detail: [`+${usd(t.amount)}${acct}`, `+${usd(t.amount)}${acct}`], href: "copy-trading" };
    case "copy_fee":
      return { ...base, tone: "info", title: ["หักส่วนแบ่งกำไรให้ Master", "Copy-trading fee"], detail: [`-${usd(t.amount)}${acct}`, `-${usd(t.amount)}${acct}`], href: "copy-trading" };
    case "adjustment":
      return { ...base, tone: "warning", title: ["ปรับยอดติดลบเป็น 0", "Negative balance reset"], detail: [`ระบบคุ้มครองยอดติดลบ +${usd(t.amount)}${acct}`, `Protection credit +${usd(t.amount)}${acct}`] };
    default:
      return null;
  }
}

const CLOSE: Record<string, { tone: Tone; th: string; en: string }> = {
  sl:           { tone: "warning", th: "ออเดอร์ถึง Stop Loss", en: "Stop loss hit" },
  tp:           { tone: "success", th: "ออเดอร์ถึง Take Profit", en: "Take profit hit" },
  stop_out:     { tone: "danger",  th: "ออเดอร์ถูก Stop Out (มาร์จิ้นไม่พอ)", en: "Stopped out (margin)" },
  master_close: { tone: "info",    th: "Master ปิดออเดอร์ที่คัดลอก", en: "Copied trade closed by master" },
  copy_stop:    { tone: "info",    th: "ปิดออเดอร์จากการหยุดคัดลอก", en: "Copied trade closed (copy stopped)" },
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lang = req.nextUrl.searchParams.get("lang") === "en" ? 1 : 0;
  const db = await getDb();
  const userId = new ObjectId(session.userId);

  const [me, txns, trades, requests, copies, friends] = await Promise.all([
    db.collection("users").findOne({ _id: userId }, { projection: { notificationsSeenAt: 1 } }),
    db.collection("transactions").find({ userId }).sort({ updatedAt: -1, createdAt: -1 }).limit(LIMIT).toArray(),
    db.collection("trades").find({ userId, status: "closed", closeReason: { $in: Object.keys(CLOSE) } }).sort({ closeTime: -1 }).limit(LIMIT).toArray(),
    db.collection("accountRequests").find({ userId, status: { $in: ["approved", "rejected"] } }).sort({ updatedAt: -1 }).limit(10).toArray(),
    db.collection("copySubscriptions").find({ followerUserId: userId, status: "stopped", stopReason: { $in: ["max_loss", "master_suspended"] } }).sort({ stoppedAt: -1 }).limit(10).toArray(),
    db.collection("users").find({ referredBy: userId }, { projection: { firstName: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(10).toArray(),
  ]);

  const items: Item[] = [
    ...txns.map(txnItem).filter((x): x is Item => x !== null),
    ...trades.map((t) => {
      const c = CLOSE[t.closeReason];
      const pnl = t.pnl >= 0 ? `+${usd(t.pnl)}` : `-${usd(-t.pnl)}`;
      return {
        id: `tr-${t._id}`, tone: c.tone, title: [c.th, c.en] as [string, string],
        detail: [`${t.symbol} ${String(t.type).toUpperCase()} ${t.volume} lot · ${pnl}`, `${t.symbol} ${String(t.type).toUpperCase()} ${t.volume} lot · ${pnl}`] as [string, string],
        href: "webtrader", at: t.closeTime,
      };
    }),
    ...requests.map((r) => ({
      id: `r-${r._id}`,
      tone: (r.status === "approved" ? "success" : "danger") as Tone,
      title: (r.status === "approved" ? ["เปิดบัญชีเทรดสำเร็จ", "Trading account approved"] : ["คำขอเปิดบัญชีไม่ผ่าน", "Account request rejected"]) as [string, string],
      detail: [`${r.platform ?? ""} ${r.accountType ?? ""}${r.adminNotes ? ` — ${r.adminNotes}` : ""}`.trim(), `${r.platform ?? ""} ${r.accountType ?? ""}`.trim()] as [string, string],
      href: "accounts", at: when(r),
    })),
    ...copies.map((s) => ({
      id: `c-${s._id}`, tone: "warning" as Tone,
      title: (s.stopReason === "max_loss" ? ["หยุดคัดลอกอัตโนมัติ — ถึงจุดหยุดขาดทุน", "Copy stopped — loss limit reached"] : ["หยุดคัดลอก — Master ถูกระงับ", "Copy stopped — master suspended"]) as [string, string],
      detail: [`บัญชี #${s.followerAccountNumber}`, `Account #${s.followerAccountNumber}`] as [string, string],
      href: "copy-trading", at: s.stoppedAt,
    })),
    ...friends.map((f) => ({
      id: `f-${f._id}`, tone: "info" as Tone,
      title: ["เพื่อนสมัครผ่านลิงก์ของคุณ", "A friend joined with your link"] as [string, string],
      detail: [`${f.firstName ?? "เพื่อน"} สมัครสมาชิกแล้ว`, `${f.firstName ?? "Your friend"} signed up`] as [string, string],
      href: "partnership", at: f.createdAt,
    })),
  ]
    .filter((n) => n.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, LIMIT);

  const seenAt = me?.notificationsSeenAt ? new Date(me.notificationsSeenAt).getTime() : 0;
  return NextResponse.json({
    items: items.map((n) => ({ id: n.id, tone: n.tone, title: n.title[lang], detail: n.detail[lang], href: n.href, at: n.at })),
    unread: items.filter((n) => new Date(n.at).getTime() > seenAt).length,
    seenAt: seenAt || null,
  });
}

/** Mark everything up to now as read. */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDb();
  await db.collection("users").updateOne({ _id: new ObjectId(session.userId) }, { $set: { notificationsSeenAt: new Date() } });
  return NextResponse.json({ ok: true });
}
