import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Document, type WithId } from "mongodb";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { bonusTrades, getBonusStatus, sumTurnover } from "@/lib/bonus";
import { tradePips, type PipMode } from "@/lib/bonusRules";
import { STOP_OUT_MAX, STOP_OUT_MIN, accountStopOutLevel } from "@/lib/risk";
import { getDefaultStopOutLevel } from "@/lib/stopOut";

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;
const PAGE_SIZE = 20;

/** End of a bonus's counting window: when it completed or was forfeited (open-ended while active). */
const bonusEnd = (b: Document): Date | null => b.completedAt ?? b.forfeitedAt ?? null;
const pipModeOf = (b: Document): PipMode => (b.pipMode === "lot_weighted" ? "lot_weighted" : "distance");

/**
 * One user's money and trading picture for the admin: balance per account, lots and pips traded,
 * realised P&L, deposit/withdraw totals, a per-bonus turnover check and paginated trade history.
 * ?format=csv returns every trade matching the filters as a CSV file.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  const userId = new ObjectId(id);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const accountFilter = searchParams.get("accountId") ?? "";
  const statusFilter = searchParams.get("status") ?? ""; // "open" | "closed" | ""
  const bonusFilter = searchParams.get("bonusId") ?? "";
  const asCsv = searchParams.get("format") === "csv";

  const db = await getDb();
  const accounts = await db.collection("accounts").find({ userId }).sort({ isDemo: 1, createdAt: -1 }).toArray();
  const accountIds = accounts.map((a) => a._id.toString());
  const accById = new Map<string, WithId<Document>>(accounts.map((a) => [a._id.toString(), a]));
  const accNumber = (accountId: string) => {
    const a = accById.get(accountId);
    return a ? (a.accountNumber || accountId.slice(-7)) : "—";
  };

  const bonusDocs = await db.collection("bonuses").find({ accountId: { $in: accountIds } }).sort({ createdAt: -1 }).toArray();

  // ── Trade history (filterable by account / status / bonus window) ──
  const tradeFilter: Record<string, unknown> = {
    accountId: accountFilter && accountIds.includes(accountFilter) ? accountFilter : { $in: accountIds },
  };
  if (statusFilter === "open" || statusFilter === "closed") tradeFilter.status = statusFilter;
  const filterBonus = bonusFilter ? bonusDocs.find((b) => b._id.toString() === bonusFilter) : undefined;
  if (filterBonus) {
    tradeFilter.accountId = filterBonus.accountId;
    tradeFilter.status = "closed";
    tradeFilter.openTime = { $gte: filterBonus.createdAt };
    const end = bonusEnd(filterBonus);
    if (end) tradeFilter.closeTime = { $lte: end };
  }

  // Which bonuses a closed trade counts toward (same rule as the withdrawal check)
  const countsFor = (t: Document) => t.status !== "closed" ? [] : bonusDocs
    .filter((b) => b.accountId === t.accountId && t.openTime >= b.createdAt && (!bonusEnd(b) || (t.closeTime && t.closeTime <= bonusEnd(b)!)))
    .map((b) => b._id.toString());

  const toRow = (t: WithId<Document>) => {
    const pips = t.status === "closed" ? tradePips(t as unknown as { symbol: string; openPrice: number; closePrice: number }) : null;
    return {
      id: t._id.toString(),
      accountId: t.accountId as string,
      accountNumber: accNumber(t.accountId),
      symbol: t.symbol,
      type: t.type,
      volume: t.volume,
      openPrice: t.openPrice,
      closePrice: t.closePrice ?? null,
      pips,
      lotPips: pips == null ? null : round1(pips * (t.volume || 0)),
      pnl: t.pnl ?? null,
      status: t.status,
      closeReason: t.closeReason ?? null,
      openTime: t.openTime,
      closeTime: t.closeTime ?? null,
      isCopy: Boolean(t.copy),
      bonusIds: countsFor(t),
    };
  };

  if (asCsv) {
    const all = await db.collection("trades").find(tradeFilter).sort({ openTime: 1 }).toArray();
    const user = await db.collection("users").findOne({ _id: userId }, { projection: { email: 1 } });
    const iso = (d: Date | null) => (d ? new Date(d).toISOString().replace("T", " ").slice(0, 19) : "");
    const header = ["open_time", "close_time", "account", "symbol", "type", "lots", "open_price", "close_price", "pips", "pips_x_lots", "pnl_usd", "status", "close_reason", "copy", "counts_for_bonus"];
    const lines = all.map(toRow).map((r) => [
      iso(r.openTime), iso(r.closeTime), r.accountNumber, r.symbol, r.type, r.volume, r.openPrice, r.closePrice ?? "",
      r.pips ?? "", r.lotPips ?? "", r.pnl ?? "", r.status, r.closeReason ?? "", r.isCopy ? "yes" : "", r.bonusIds.length ? "yes" : "",
    ].join(","));
    const name = `trades_${(user?.email ?? id).replace(/[^a-zA-Z0-9._-]/g, "_")}.csv`;
    return new NextResponse("﻿" + [header.join(","), ...lines].join("\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` },
    });
  }

  // ── Per-account lot / P&L summary ──
  const perAccount = await db.collection("trades").aggregate([
    { $match: { accountId: { $in: accountIds } } },
    { $group: {
      _id: "$accountId",
      closedLots: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, "$volume", 0] } },
      openLots:   { $sum: { $cond: [{ $eq: ["$status", "open"] }, "$volume", 0] } },
      closedTrades: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
      openTrades:   { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
      realizedPnl:  { $sum: { $cond: [{ $eq: ["$status", "closed"] }, { $ifNull: ["$pnl", 0] }, 0] } },
      wins:         { $sum: { $cond: [{ $and: [{ $eq: ["$status", "closed"] }, { $gt: ["$pnl", 0] }] }, 1, 0] } },
    } },
  ]).toArray();
  const statsBy = new Map(perAccount.map((s) => [s._id as string, s]));

  // Pips per account (needs each trade's symbol, so summed here rather than in the aggregation)
  const pipsBy = new Map<string, { pips: number; lotPips: number }>();
  const closedForPips = await db.collection("trades")
    .find({ accountId: { $in: accountIds }, status: "closed" }, { projection: { accountId: 1, symbol: 1, openPrice: 1, closePrice: 1, volume: 1 } })
    .toArray();
  for (const t of closedForPips) {
    const p = tradePips(t as unknown as { symbol: string; openPrice: number; closePrice: number });
    const cur = pipsBy.get(t.accountId) ?? { pips: 0, lotPips: 0 };
    cur.pips += p;
    cur.lotPips += p * (t.volume || 0);
    pipsBy.set(t.accountId, cur);
  }

  const defaultStopOut = await getDefaultStopOutLevel(db);
  const gateBy = new Map<string, Awaited<ReturnType<typeof getBonusStatus>>>();
  const accountsOut = await Promise.all(accounts.map(async (a) => {
    const aid = a._id.toString();
    const s = statsBy.get(aid);
    const st = a.isDemo ? null : await getBonusStatus(db, a);
    if (st) gateBy.set(aid, st);
    return {
      id: aid,
      accountNumber: a.accountNumber || aid.slice(-7),
      type: a.type || "Standard",
      isDemo: Boolean(a.isDemo),
      leverage: a.leverage || "1:500",
      stopOutLevel: accountStopOutLevel(a.stopOutLevel, defaultStopOut),
      stopOutIsDefault: a.stopOutLevel == null,
      status: a.status || "active",
      balance: round2(Number(a.balance) || 0),
      equity: round2(Number(a.equity ?? a.balance) || 0),
      freeMargin: round2(Number(a.freeMargin ?? a.balance) || 0),
      closedLots: round2(s?.closedLots ?? 0),
      openLots: round2(s?.openLots ?? 0),
      closedTrades: s?.closedTrades ?? 0,
      openTrades: s?.openTrades ?? 0,
      realizedPnl: round2(s?.realizedPnl ?? 0),
      wins: s?.wins ?? 0,
      pips: round1(pipsBy.get(aid)?.pips ?? 0),
      lotPips: round1(pipsBy.get(aid)?.lotPips ?? 0),
      bonus: st?.active ?? null,
      withdrawLimitUsd: st?.withdrawLimitUsd ?? null,
    };
  }));

  // ── Bonus check: each bonus with the lots / pips counted in its own window ──
  // getBonusStatus above may have just completed bonuses, so read them again
  const freshBonuses = await db.collection("bonuses").find({ accountId: { $in: accountIds } }).sort({ createdAt: -1 }).toArray();
  const bonusesOut = await Promise.all(freshBonuses.map(async (b) => {
    const mode = pipModeOf(b);
    const window = await bonusTrades(db, b.accountId, b.createdAt, bonusEnd(b));
    const { lots, pips } = sumTurnover(window, mode);
    const requiredLots = b.requiredLots ?? 0;
    const requiredPips = b.requiredPips ?? 0;
    return {
      id: b._id.toString(),
      accountId: b.accountId as string,
      accountNumber: b.accountNumber ?? accNumber(b.accountId),
      depositUsd: b.depositUsd ?? 0,
      bonusUsd: b.bonusUsd ?? 0,
      maxWithdrawUsd: b.maxWithdrawUsd ?? 0,
      status: b.status as "active" | "completed" | "forfeited",
      createdAt: b.createdAt,
      endedAt: bonusEnd(b),
      requiredLots,
      requiredPips,
      pipMode: mode,
      countedLots: lots,
      countedPips: pips,
      tradeCount: window.length,
      lotsMet: lots >= requiredLots,
      pipsMet: requiredPips <= 0 || pips >= requiredPips,
    };
  }));

  // What the withdrawal check says right now, per live account that ever had a bonus
  const withdrawCheck = accountsOut
    .filter((a) => !a.isDemo && freshBonuses.some((b) => b.accountId === a.id))
    .map((a) => {
      const st = gateBy.get(a.id);
      return {
        accountId: a.id,
        accountNumber: a.accountNumber,
        canWithdraw: !st?.active,
        active: st?.active ?? null,
        withdrawLimitUsd: st?.withdrawLimitUsd ?? null,
      };
    });

  // ── Deposit / withdrawal totals (completed only) ──
  const money = await db.collection("transactions").aggregate([
    { $match: { userId, status: "completed", type: { $in: ["deposit", "withdrawal"] } } },
    { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]).toArray();
  const moneyBy = new Map(money.map((m) => [m._id as string, m]));

  const [trades, totalTrades] = await Promise.all([
    db.collection("trades").find(tradeFilter).sort({ openTime: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).toArray(),
    db.collection("trades").countDocuments(tradeFilter),
  ]);

  return NextResponse.json({
    accounts: accountsOut,
    bonuses: bonusesOut,
    withdrawCheck,
    funding: {
      deposits: round2(moneyBy.get("deposit")?.total ?? 0),
      depositCount: moneyBy.get("deposit")?.count ?? 0,
      withdrawals: round2(Math.abs(moneyBy.get("withdrawal")?.total ?? 0)),
      withdrawalCount: moneyBy.get("withdrawal")?.count ?? 0,
    },
    trades: trades.map(toRow),
    totalTrades,
    pages: Math.max(1, Math.ceil(totalTrades / PAGE_SIZE)),
    page,
  });
}

/** Admin sets the stop-out level on one of this user's accounts (same range the user can choose). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const accountId = body?.accountId;
  if (!ObjectId.isValid(id) || typeof accountId !== "string" || !ObjectId.isValid(accountId)) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  const level = Number(body?.stopOutLevel);
  if (!Number.isInteger(level) || level < STOP_OUT_MIN || level > STOP_OUT_MAX) {
    return NextResponse.json({ error: `Stop-out ต้องเป็นจำนวนเต็ม ${STOP_OUT_MIN}–${STOP_OUT_MAX}` }, { status: 400 });
  }

  const db = await getDb();
  const result = await db.collection("accounts").updateOne(
    { _id: new ObjectId(accountId), userId: new ObjectId(id) },
    { $set: { stopOutLevel: level, stopOutSetBy: { adminEmail: admin.email, at: new Date() } } },
  );
  if (result.matchedCount === 0) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  return NextResponse.json({ ok: true, stopOutLevel: level });
}
