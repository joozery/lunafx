import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { PNL_FACTOR, calcTradePnl, marginRequired, parseLeverage } from "@/lib/pnl";
import { getServerQuote } from "@/lib/quote";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const status = searchParams.get("status") ?? "open";

  const db = await getDb();
  const query: Record<string, unknown> = {
    userId: new ObjectId(session.userId),
    status,
  };
  if (accountId) query.accountId = accountId;

  const docs = await db
    .collection("trades")
    .find(query)
    .sort({ openTime: -1 })
    .limit(100)
    .toArray();

  const trades = docs.map((d) => ({
    id: d._id.toString(),
    accountId: d.accountId,
    symbol: d.symbol,
    type: d.type,
    volume: d.volume,
    openPrice: d.openPrice,
    sl: d.sl ?? null,
    tp: d.tp ?? null,
    margin: d.margin ?? 0,
    status: d.status,
    openTime: d.openTime,
    closeTime: d.closeTime ?? null,
    closePrice: d.closePrice ?? null,
    pnl: d.pnl ?? null,
  }));

  return NextResponse.json({ ok: true, trades });
}

const MIN_LOT = 0.01;
const MAX_LOT = 50;
const NO_PRICE = "ยังไม่มีราคาสด (ตลาดอาจปิดอยู่) กรุณาลองใหม่อีกครั้ง";

const round2 = (n: number) => Math.round(n * 100) / 100;

function optionalPrice(v: unknown): number | null | undefined {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined; // undefined = invalid
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { accountId, symbol, type, volume } = body ?? {};

  if (typeof accountId !== "string" || !ObjectId.isValid(accountId)) {
    return NextResponse.json({ ok: false, error: "invalid account" }, { status: 400 });
  }
  if (typeof symbol !== "string" || !Object.hasOwn(PNL_FACTOR, symbol)) {
    return NextResponse.json({ ok: false, error: "unknown symbol" }, { status: 400 });
  }
  if (type !== "buy" && type !== "sell") {
    return NextResponse.json({ ok: false, error: "invalid type" }, { status: 400 });
  }
  const vol = round2(Number(volume));
  if (!Number.isFinite(vol) || vol < MIN_LOT || vol > MAX_LOT) {
    return NextResponse.json({ ok: false, error: `volume must be ${MIN_LOT}–${MAX_LOT} lot` }, { status: 400 });
  }
  const sl = optionalPrice(body?.sl);
  const tp = optionalPrice(body?.tp);
  if (sl === undefined || tp === undefined) {
    return NextResponse.json({ ok: false, error: "invalid SL/TP" }, { status: 400 });
  }

  // Fill at the server's own price: buy at ask, sell at bid. Any price from the browser is ignored.
  const quote = await getServerQuote(symbol);
  if (!quote) return NextResponse.json({ ok: false, error: NO_PRICE }, { status: 503 });
  const openPrice = type === "buy" ? quote.ask : quote.bid;

  const db = await getDb();
  const userId = new ObjectId(session.userId);
  const accounts = db.collection("accounts");

  const account = await accounts.findOne({ _id: new ObjectId(accountId), userId });
  if (!account || account.status === "suspended") {
    return NextResponse.json({ ok: false, error: "account not found" }, { status: 404 });
  }

  // Reserve margin atomically; fails when free margin is insufficient. Balance itself only moves on close.
  const margin = marginRequired(symbol, vol, openPrice, parseLeverage(account.leverage));
  const reserved = await accounts.findOneAndUpdate(
    { _id: account._id, userId, freeMargin: { $gte: margin } },
    { $inc: { freeMargin: -margin } },
  );
  if (!reserved) {
    return NextResponse.json(
      { ok: false, error: `มาร์จิ้นไม่เพียงพอ (ต้องใช้ $${margin.toFixed(2)})` },
      { status: 400 },
    );
  }

  try {
    const { insertedId } = await db.collection("trades").insertOne({
      userId,
      accountId,
      symbol,
      type,
      volume: vol,
      openPrice,
      margin,
      sl,
      tp,
      status: "open",
      openTime: new Date(),
    });
    return NextResponse.json({ ok: true, tradeId: insertedId.toString(), openPrice, margin });
  } catch {
    await accounts.updateOne({ _id: account._id }, { $inc: { freeMargin: margin } }); // give the margin back
    return NextResponse.json({ ok: false, error: "failed to open order" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const tradeId = body?.tradeId;
  if (typeof tradeId !== "string" || !ObjectId.isValid(tradeId)) {
    return NextResponse.json({ ok: false, error: "invalid trade" }, { status: 400 });
  }

  const db = await getDb();
  const userId = new ObjectId(session.userId);
  const trades = db.collection("trades");

  const trade = await trades.findOne({ _id: new ObjectId(tradeId), userId, status: "open" });
  if (!trade) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  // Close at the server's own price: buy closes at bid, sell at ask. Any price from the browser is ignored.
  const quote = await getServerQuote(trade.symbol);
  if (!quote) return NextResponse.json({ ok: false, error: NO_PRICE }, { status: 503 });
  const closePrice = trade.type === "buy" ? quote.bid : quote.ask;
  const pnl = round2(calcTradePnl(trade.type, trade.symbol, trade.openPrice, closePrice, trade.volume));

  // Claim the trade first so a double click / retry can never credit the account twice
  const claimed = await trades.findOneAndUpdate(
    { _id: trade._id, status: "open" },
    { $set: { status: "closed", closePrice, closeTime: new Date(), pnl } },
  );
  if (!claimed) return NextResponse.json({ ok: false, error: "already closed" }, { status: 409 });

  // Realise the result on the account: balance/equity take the P&L, free margin also gets the reserved margin back
  try {
    if (ObjectId.isValid(trade.accountId)) {
      await db.collection("accounts").updateOne(
        { _id: new ObjectId(trade.accountId), userId },
        { $inc: { balance: pnl, equity: pnl, freeMargin: pnl + (trade.margin ?? 0) } },
      );
    }
  } catch {
    await trades.updateOne(
      { _id: trade._id },
      { $set: { status: "open" }, $unset: { closePrice: "", closeTime: "", pnl: "" } },
    );
    return NextResponse.json({ ok: false, error: "failed to update account" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pnl, closePrice });
}
