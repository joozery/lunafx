import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { calcTradePnl } from "@/lib/pnl";
import { getConversionMids, getServerQuote } from "@/lib/quote";
import { stopSubscription } from "@/lib/copyTrading";
import { notifyAdmins, thaiTime } from "@/lib/lineNotify";

/** The signed-in user's copies with live results. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDb();
  const userId = new ObjectId(session.userId);

  const list = await db.collection("copySubscriptions").find({ followerUserId: userId }).sort({ startedAt: -1 }).limit(50).toArray();
  const masterNames = new Map((await db.collection("copyMasters")
    .find({ _id: { $in: [...new Set(list.map((s) => s.masterId.toString()))].map((id) => new ObjectId(id)) } }, { projection: { displayName: 1 } })
    .toArray()).map((m) => [m._id.toString(), m.displayName]));

  const open = await db.collection("trades").find({ "copy.subscriptionId": { $in: list.map((s) => s._id) }, status: "open" }).toArray();
  const symbols = [...new Set(open.map((t) => t.symbol as string))];
  const quotes = new Map(await Promise.all(symbols.map(async (s) => [s, await getServerQuote(s)] as const)));
  const mids = await getConversionMids(symbols);

  return NextResponse.json({
    success: true,
    subscriptions: list.map((s) => {
      const mine = open.filter((t) => t.copy.subscriptionId.equals(s._id));
      const floating = mine.reduce((sum, t) => {
        const q = quotes.get(t.symbol);
        return q ? sum + calcTradePnl(t.type, t.symbol, t.openPrice, t.type === "buy" ? q.bid : q.ask, t.volume, mids) : sum;
      }, 0);
      const total = (s.realizedPnl ?? 0) + floating;
      return {
        id: s._id.toString(),
        masterName: masterNames.get(s.masterId.toString()) ?? "—",
        accountNumber: s.followerAccountNumber,
        allocation: s.allocation,
        mode: s.mode,
        fixedLot: s.fixedLot ?? null,
        multiplier: s.multiplier ?? null,
        maxLossPercent: s.maxLossPercent,
        status: s.status,
        stopReason: s.stopReason ?? null,
        openPositions: mine.length,
        realizedPnl: Math.round((s.realizedPnl ?? 0) * 100) / 100,
        floatingPnl: Math.round(floating * 100) / 100,
        roi: s.allocation > 0 ? Math.round((total / s.allocation) * 10000) / 100 : 0,
        feePercent: s.feePercent ?? null,
        feesPaid: Math.round((s.feesPaid ?? 0) * 100) / 100,
        copiedTrades: s.copiedTrades ?? 0,
        skippedTrades: s.skippedTrades ?? 0,
        lastSkip: s.lastSkip ?? null,
        startedAt: s.startedAt,
        stoppedAt: s.stoppedAt ?? null,
      };
    }),
  });
}

/** Start copying a master with one of the user's trading accounts. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const db = await getDb();
  const userId = new ObjectId(session.userId);

  if (!ObjectId.isValid(body.masterId) || !ObjectId.isValid(body.accountId)) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  const master = await db.collection("copyMasters").findOne({ _id: new ObjectId(body.masterId), status: "active" });
  if (!master) return NextResponse.json({ error: "ไม่พบ Master หรือ Master ถูกระงับ" }, { status: 404 });

  const account = await db.collection("accounts").findOne({ _id: new ObjectId(body.accountId), userId });
  if (!account || account.status === "suspended") return NextResponse.json({ error: "ไม่พบบัญชีเทรด" }, { status: 404 });
  const accountId = account._id.toString();
  if (accountId === master.accountId) return NextResponse.json({ error: "คัดลอกบัญชีตัวเองไม่ได้" }, { status: 400 });
  if (await db.collection("copyMasters").findOne({ accountId, status: { $in: ["pending", "active"] } })) {
    return NextResponse.json({ error: "บัญชีนี้เป็นบัญชี Master — ใช้บัญชีอื่นในการคัดลอก" }, { status: 400 });
  }
  if (await db.collection("copySubscriptions").findOne({ followerAccountId: accountId, masterId: master._id, status: "active" })) {
    return NextResponse.json({ error: "บัญชีนี้คัดลอก Master คนนี้อยู่แล้ว" }, { status: 409 });
  }

  const mode = body.mode === "fixed" || body.mode === "multiplier" ? body.mode : "ratio";
  const allocation = Math.round(Number(body.allocation) * 100) / 100;
  const maxLossPercent = Number(body.maxLossPercent ?? 0);
  const fixedLot = Number(body.fixedLot);
  const multiplier = Number(body.multiplier);

  if (!(allocation > 0)) return NextResponse.json({ error: "กรุณาระบุจำนวนเงินที่ใช้คัดลอก" }, { status: 400 });
  if (allocation < (master.minAllocation ?? 0)) return NextResponse.json({ error: `Master คนนี้กำหนดเงินขั้นต่ำ $${master.minAllocation}` }, { status: 400 });
  if (allocation > (Number(account.balance) || 0)) return NextResponse.json({ error: "จำนวนเงินมากกว่ายอดคงเหลือในบัญชี" }, { status: 400 });
  if (!Number.isFinite(maxLossPercent) || maxLossPercent < 0 || maxLossPercent > 100) return NextResponse.json({ error: "จุดหยุดขาดทุนต้องอยู่ระหว่าง 0–100%" }, { status: 400 });
  if (mode === "fixed" && !(fixedLot >= 0.01 && fixedLot <= 100)) return NextResponse.json({ error: "lot คงที่ต้องอยู่ระหว่าง 0.01–100" }, { status: 400 });
  if (mode === "multiplier" && !(multiplier > 0 && multiplier <= 10)) return NextResponse.json({ error: "ตัวคูณต้องมากกว่า 0 และไม่เกิน 10" }, { status: 400 });

  const { insertedId } = await db.collection("copySubscriptions").insertOne({
    masterId: master._id,
    followerUserId: userId,
    followerAccountId: accountId,
    followerAccountNumber: account.accountNumber,
    allocation,
    mode,
    ...(mode === "fixed" ? { fixedLot: Math.round(fixedLot * 100) / 100 } : {}),
    ...(mode === "multiplier" ? { multiplier } : {}),
    maxLossPercent,
    status: "active",
    realizedPnl: 0,
    feePercent: master.feePercent ?? 0,
    highWaterMark: 0,
    feesPaid: 0,
    lastSettledAt: null,
    copiedTrades: 0,
    skippedTrades: 0,
    startedAt: new Date(),
  });
  void notifyAdmins(
    `📋 เริ่มคัดลอกเทรด\nผู้คัดลอก: ${session.firstName} ${session.lastName} (#${account.accountNumber})\nMaster: ${master.displayName}\nเงินที่ใช้คัดลอก: $${allocation}\nเวลา: ${thaiTime()}`,
    "copy",
  );
  return NextResponse.json({ success: true, id: insertedId.toString() });
}

/** { id } — stop copying; open copied positions are closed at market. */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!ObjectId.isValid(body.id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const db = await getDb();
  const sub = await db.collection("copySubscriptions").findOne({ _id: new ObjectId(body.id), followerUserId: new ObjectId(session.userId) });
  if (!sub) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  const ok = await stopSubscription(db, sub._id, "user");
  return ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: "หยุดไปแล้ว" }, { status: 409 });
}
