import "server-only";
import { ObjectId, type Db, type Document, type WithId } from "mongodb";
import { calcTradePnl, type Mids } from "@/lib/pnl";
import { getServerQuote, type Quote } from "@/lib/quote";
import { closeTrade, openTrade } from "@/lib/trading";
import { calcCopyVolume, calcPerformanceFee, copyLossBreached, masterStats, FEE_PERIOD_DAYS, type CopyMode, type MasterStats } from "@/lib/copyRules";

/*
 * Copy trading on our own trading engine.
 *   copyMasters        — accounts approved by an admin to be copied
 *   copySubscriptions  — follower account → master, with sizing and a loss limit
 *   trades.copy        — on a follower's position: { masterId, subscriptionId, masterTradeId }
 * A master's order is mirrored right after it is filled (copyOpen); closing it closes every copy
 * (closeCopies, called from closeTrade). Followers' loss limits are enforced by the risk engine.
 */

export interface Subscription {
  _id: ObjectId;
  masterId: ObjectId;
  followerUserId: ObjectId;
  followerAccountId: string;
  followerAccountNumber: string;
  allocation: number;
  mode: CopyMode;
  fixedLot?: number;
  multiplier?: number;
  maxLossPercent: number;
  status: "active" | "stopped";
  realizedPnl: number;
  feePercent?: number;      // snapshot of the master's fee when the copy started
  highWaterMark?: number | null; // best cumulative realised result already charged a fee
  feesPaid?: number;
  lastSettledAt?: Date | null;
  copiedTrades: number;
  skippedTrades: number;
  lastSkip?: { at: Date; symbol: string; reason: string } | null;
  stopReason?: string | null;
  startedAt: Date;
  stoppedAt?: Date | null;
}

const masters = (db: Db) => db.collection("copyMasters");
const subs = (db: Db) => db.collection<Subscription>("copySubscriptions");

// Every trade close looks up copies of it, so these lookups must stay indexed (created once per process)
let indexed: Promise<unknown> | null = null;
function ensureIndexes(db: Db) {
  indexed ??= Promise.all([
    db.collection("trades").createIndex({ "copy.masterTradeId": 1, status: 1 }, { sparse: true }),
    db.collection("trades").createIndex({ "copy.subscriptionId": 1, status: 1 }, { sparse: true }),
    subs(db).createIndex({ masterId: 1, status: 1 }),
    masters(db).createIndex({ accountId: 1, status: 1 }),
  ]).catch((e) => { indexed = null; console.error("[copy] index:", e); });
  return indexed;
}

/** Mirror a master's newly opened order onto every active follower. */
export async function copyOpen(db: Db, masterTradeId: ObjectId): Promise<void> {
  const trade = await db.collection("trades").findOne({ _id: masterTradeId });
  if (!trade || trade.copy || trade.status !== "open") return;

  const master = await masters(db).findOne({ accountId: trade.accountId, status: "active" });
  if (!master) return;

  const followers = await subs(db).find({ masterId: master._id, status: "active" }).toArray();
  if (followers.length === 0) return;

  const masterAccount = await db.collection("accounts").findOne({ _id: new ObjectId(trade.accountId) });
  const masterBalance = Number(masterAccount?.balance) || 0;
  const quote = await getServerQuote(trade.symbol);

  await Promise.all(followers.map(async (sub) => {
    const skip = (reason: string) => subs(db).updateOne(
      { _id: sub._id },
      { $inc: { skippedTrades: 1 }, $set: { lastSkip: { at: new Date(), symbol: trade.symbol, reason } } },
    );

    if (!quote) return skip("ไม่มีราคาสดตอนที่ Master เปิดออเดอร์");
    const account = await db.collection("accounts").findOne({ _id: new ObjectId(sub.followerAccountId) });
    if (!account || account.status === "suspended") return skip("ไม่พบบัญชีผู้ติดตาม");

    const volume = calcCopyVolume(trade.volume, masterBalance, sub);
    if (volume === 0) return skip("เงินที่ใช้คัดลอกน้อยเกินไปสำหรับออเดอร์นี้ (ต่ำกว่า 0.01 lot)");

    const r = await openTrade(db, {
      account,
      symbol: trade.symbol,
      type: trade.type,
      volume,
      quote,
      sl: trade.sl ?? null,
      tp: trade.tp ?? null,
      copy: { masterId: master._id, subscriptionId: sub._id, masterTradeId: trade._id },
    });
    if (!r.ok) return skip(r.error);
    await subs(db).updateOne({ _id: sub._id }, { $inc: { copiedTrades: 1 } });
  }));
}

/** Close every follower position copied from this master order. */
export async function closeCopies(db: Db, masterTradeId: ObjectId, reason: "master_close" | "copy_stop" = "master_close"): Promise<void> {
  await ensureIndexes(db);
  const children = await db.collection("trades").find({ "copy.masterTradeId": masterTradeId, status: "open" }).toArray();
  await closeEach(db, children, reason);
}

async function closeEach(db: Db, trades: WithId<Document>[], reason: "master_close" | "copy_stop") {
  const quotes = new Map<string, Quote | null>();
  for (const t of trades) {
    if (!quotes.has(t.symbol)) quotes.set(t.symbol, await getServerQuote(t.symbol));
    const q = quotes.get(t.symbol);
    // without a price the position stays open; the risk engine / next close attempt picks it up
    if (q) await closeTrade(db, t, q, reason);
  }
}

/** Book a closed copy position's result against its subscription (feeds the loss limit). */
export async function recordCopyResult(db: Db, subscriptionId: ObjectId, pnl: number): Promise<void> {
  await subs(db).updateOne({ _id: subscriptionId }, { $inc: { realizedPnl: pnl } });
}

/** Stop copying: the subscription ends and its open copy positions are closed at market. */
export async function stopSubscription(db: Db, subscriptionId: ObjectId, reason: string): Promise<boolean> {
  const claimed = await subs(db).findOneAndUpdate(
    { _id: subscriptionId, status: "active" },
    { $set: { status: "stopped", stopReason: reason, stoppedAt: new Date() } },
  );
  if (!claimed) return false;
  const open = await db.collection("trades").find({ "copy.subscriptionId": subscriptionId, status: "open" }).toArray();
  await closeEach(db, open, "copy_stop");
  // final settlement now that every copied position is closed and realised
  await settleFees(db, subscriptionId).catch((e) => console.error("[copy] final fee:", e));
  return true;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Charge the master's performance fee on the follower's realised copy profit above the
 * high-water mark, moving it from the follower's account to the master's account.
 * Safe to call repeatedly: the mark is claimed atomically, so a fee is never charged twice.
 */
export async function settleFees(db: Db, subscriptionId: ObjectId): Promise<{ fee: number } | null> {
  const sub = await subs(db).findOne({ _id: subscriptionId });
  if (!sub) return null;
  const master = await masters(db).findOne({ _id: sub.masterId });
  if (!master) return null;

  const previous = sub.highWaterMark ?? 0;
  const feePercent = sub.feePercent ?? master.feePercent ?? 0;
  const { fee, newHighWaterMark } = calcPerformanceFee(sub.realizedPnl ?? 0, previous, feePercent);
  const now = new Date();

  if (fee <= 0) {
    await subs(db).updateOne({ _id: sub._id }, { $set: { lastSettledAt: now } });
    return { fee: 0 };
  }

  const follower = await db.collection("accounts").findOne({ _id: new ObjectId(sub.followerAccountId) });
  // never push a follower negative: charge what the balance covers, the rest is waived
  const charged = r2(Math.min(fee, Math.max(0, Number(follower?.balance) || 0)));

  const claimed = await subs(db).findOneAndUpdate(
    { _id: sub._id, highWaterMark: { $in: previous === 0 ? [0, null] : [previous] } },
    { $set: { highWaterMark: newHighWaterMark, lastSettledAt: now }, $inc: { feesPaid: charged } },
  );
  if (!claimed) return { fee: 0 }; // settled concurrently

  if (charged > 0 && follower) {
    await db.collection("accounts").updateOne({ _id: follower._id }, { $inc: { balance: -charged, equity: -charged, freeMargin: -charged } });
    await db.collection("accounts").updateOne({ _id: new ObjectId(master.accountId) }, { $inc: { balance: charged, equity: charged, freeMargin: charged } });
  }

  const ref = `CPF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  await db.collection("copyFeeSettlements").insertOne({
    ref, subscriptionId: sub._id, masterId: master._id, masterUserId: master.userId, followerUserId: sub.followerUserId,
    cumulativePnl: r2(sub.realizedPnl ?? 0), previousHighWaterMark: previous, newHighWaterMark,
    feePercent, fee: charged, owed: fee, at: now,
  });
  if (charged > 0) {
    await db.collection("transactions").insertMany([
      {
        userId: sub.followerUserId, type: "copy_fee", method: "copy_trading", accountNumber: sub.followerAccountNumber,
        amount: charged, status: "completed", transactionId: ref,
        adminNotes: `ส่วนแบ่งกำไร ${feePercent}% ให้ Master ${master.displayName}`, createdAt: now, updatedAt: now,
      },
      {
        userId: master.userId, type: "copy_fee_income", method: "copy_trading", accountNumber: master.accountNumber,
        amount: charged, status: "completed", transactionId: ref,
        adminNotes: `ส่วนแบ่งกำไรจากผู้คัดลอก #${sub.followerAccountNumber}`, createdAt: now, updatedAt: now,
      },
    ]);
  }
  return { fee: charged };
}

/** Weekly settlement: every active copy whose last settlement is at least FEE_PERIOD_DAYS old. */
export async function settleDueFees(db: Db, now = Date.now()): Promise<{ settled: number; total: number }> {
  const cutoff = new Date(now - FEE_PERIOD_DAYS * 86_400_000);
  const due = await subs(db).find({
    status: "active",
    $or: [{ lastSettledAt: { $lte: cutoff } }, { lastSettledAt: { $exists: false }, startedAt: { $lte: cutoff } }, { lastSettledAt: null, startedAt: { $lte: cutoff } }],
  }, { projection: { _id: 1 } }).toArray();

  let total = 0;
  for (const s of due) total += (await settleFees(db, s._id).catch(() => null))?.fee ?? 0;
  return { settled: due.length, total: r2(total) };
}

/** Risk-engine hook: stop subscriptions whose copy result breached the follower's loss limit. */
export async function enforceCopyLossLimits(db: Db, quotes: Map<string, Quote | null>, mids: Mids): Promise<string[]> {
  const active = await subs(db).find({ status: "active", maxLossPercent: { $gt: 0 } }).toArray();
  const stopped: string[] = [];
  for (const sub of active) {
    const open = await db.collection("trades").find({ "copy.subscriptionId": sub._id, status: "open" }).toArray();
    let floating = 0;
    let priced = true;
    for (const t of open) {
      const q = quotes.get(t.symbol) ?? await getServerQuote(t.symbol);
      if (!q) { priced = false; break; }
      floating += calcTradePnl(t.type, t.symbol, t.openPrice, t.type === "buy" ? q.bid : q.ask, t.volume, mids);
    }
    if (priced && copyLossBreached(sub.allocation, sub.maxLossPercent, sub.realizedPnl ?? 0, floating)) {
      if (await stopSubscription(db, sub._id, "max_loss")) stopped.push(sub._id.toString());
    }
  }
  return stopped;
}

export interface MasterSummary extends MasterStats {
  id: string;
  displayName: string;
  description: string;
  feePercent: number;
  minAllocation: number;
  featured: boolean;
  status: string;
  copiers: number;
  aum: number;
  daysActive: number;
}

/** Real track record of a master: closed trades on its account, measured against net deposits. */
export async function summarizeMaster(db: Db, master: WithId<Document>): Promise<MasterSummary> {
  const closed = await db.collection("trades")
    .find({ accountId: master.accountId, status: "closed" }, { projection: { pnl: 1, closeTime: 1 } })
    .toArray();

  const [flows] = await db.collection("transactions").aggregate([
    { $match: { accountNumber: master.accountNumber, status: "completed", type: { $in: ["deposit", "withdrawal", "bonus", "commission"] } } },
    { $group: { _id: null, inflow: { $sum: { $cond: [{ $eq: ["$type", "withdrawal"] }, 0, "$amount"] } }, outflow: { $sum: { $cond: [{ $eq: ["$type", "withdrawal"] }, "$amount", 0] } } } },
  ]).toArray();
  const account = await db.collection("accounts").findOne({ _id: new ObjectId(master.accountId) }, { projection: { balance: 1 } });
  // Capital base = net deposits; when the account was funded outside recorded transactions,
  // fall back to the starting capital implied by today's balance minus trading results
  const tradedPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const base = Math.max((flows?.inflow ?? 0) - (flows?.outflow ?? 0), (Number(account?.balance) || 0) - tradedPnl, 1);

  const stats = masterStats(closed.map((t) => ({ pnl: t.pnl ?? 0, closeTime: t.closeTime })), base);

  const [agg] = await subs(db).aggregate([
    { $match: { masterId: master._id, status: "active" } },
    { $group: { _id: null, copiers: { $sum: 1 }, aum: { $sum: "$allocation" } } },
  ]).toArray();

  const since = master.approvedAt ?? master.createdAt;
  return {
    ...stats,
    id: master._id.toString(),
    displayName: master.displayName,
    description: master.description ?? "",
    feePercent: master.feePercent ?? 0,
    minAllocation: master.minAllocation ?? 0,
    featured: Boolean(master.featured),
    status: master.status,
    copiers: agg?.copiers ?? 0,
    aum: Math.round((agg?.aum ?? 0) * 100) / 100,
    daysActive: since ? Math.max(1, Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000)) : 0,
  };
}
