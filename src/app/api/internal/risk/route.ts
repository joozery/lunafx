import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { calcTradePnl } from "@/lib/pnl";
import { getConversionMids, getServerQuote, type Quote } from "@/lib/quote";
import { slTpHit, stopOutOrder, type RiskPosition } from "@/lib/risk";
import { closeTrade, internalToken } from "@/lib/trading";
import { enforceCopyLossLimits } from "@/lib/copyTrading";

/**
 * Called by server.js every few seconds. Closes positions whose SL/TP was hit,
 * then runs stop-out on accounts whose margin level fell to STOP_OUT_LEVEL.
 */
export async function POST(req: NextRequest) {
  const expected = internalToken("internal-risk");
  const got = req.headers.get("x-internal-token") ?? "";
  if (!expected || got.length !== expected.length || !timingSafeEqual(Buffer.from(got), Buffer.from(expected))) {
    return new NextResponse(null, { status: 404 });
  }

  const db = await getDb();
  const open = await db.collection("trades").find({ status: "open" }).toArray();
  if (open.length === 0) return NextResponse.json({ ok: true, closed: [] });

  // One quote per symbol; a symbol without a tradable price is skipped rather than valued at a stale price
  const quotes = new Map<string, Quote | null>();
  for (const symbol of new Set(open.map((t) => t.symbol as string))) {
    quotes.set(symbol, await getServerQuote(symbol));
  }

  const mids = await getConversionMids([...quotes.keys()]);
  const closed: { tradeId: string; reason: string; pnl: number }[] = [];

  // 1) SL / TP
  const stillOpen = [];
  for (const t of open) {
    const q = quotes.get(t.symbol);
    const hit = q ? slTpHit(t.type, t.sl, t.tp, q) : null;
    if (q && hit) {
      const r = await closeTrade(db, t, q, hit);
      if (r.ok) closed.push({ tradeId: t._id.toString(), reason: hit, pnl: r.pnl });
    } else {
      stillOpen.push(t);
    }
  }

  // 2) Stop-out, per account
  const byAccount = new Map<string, typeof stillOpen>();
  for (const t of stillOpen) {
    const list = byAccount.get(t.accountId) ?? [];
    list.push(t);
    byAccount.set(t.accountId, list);
  }

  for (const [accountId, trades] of byAccount) {
    if (!ObjectId.isValid(accountId)) continue;
    if (trades.some((t) => !quotes.get(t.symbol))) continue; // can't value the account reliably

    const account = await db.collection("accounts").findOne({ _id: new ObjectId(accountId) });
    if (!account) continue;

    const positions: RiskPosition[] = trades.map((t) => {
      const q = quotes.get(t.symbol)!;
      const price = t.type === "buy" ? q.bid : q.ask;
      return { id: t._id.toString(), margin: t.margin ?? 0, pnl: calcTradePnl(t.type, t.symbol, t.openPrice, price, t.volume, mids) };
    });

    for (const id of stopOutOrder(account.balance ?? 0, positions)) {
      const t = trades.find((x) => x._id.toString() === id)!;
      const r = await closeTrade(db, t, quotes.get(t.symbol)!, "stop_out");
      if (r.ok) closed.push({ tradeId: id, reason: "stop_out", pnl: r.pnl });
    }
  }

  // 3) Copy trading: stop followers whose copy result hit their loss limit
  for (const id of await enforceCopyLossLimits(db, quotes, mids)) {
    closed.push({ tradeId: `subscription:${id}`, reason: "copy_max_loss", pnl: 0 });
  }

  return NextResponse.json({ ok: true, closed });
}
