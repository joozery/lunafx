import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
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
    status: d.status,
    openTime: d.openTime,
    closeTime: d.closeTime ?? null,
    closePrice: d.closePrice ?? null,
    pnl: d.pnl ?? null,
  }));

  return NextResponse.json({ ok: true, trades });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json();
  const { accountId, symbol, type, volume, openPrice, sl, tp } = body;

  if (!accountId || !symbol || !type || volume == null || !openPrice) {
    return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
  }

  const db = await getDb();
  const { insertedId } = await db.collection("trades").insertOne({
    userId: new ObjectId(session.userId),
    accountId,
    symbol,
    type,
    volume: Number(volume),
    openPrice: Number(openPrice),
    sl: sl != null ? Number(sl) : null,
    tp: tp != null ? Number(tp) : null,
    status: "open",
    openTime: new Date(),
  });

  return NextResponse.json({ ok: true, tradeId: insertedId.toString() });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { tradeId, closePrice } = await req.json();
  if (!tradeId || closePrice == null) {
    return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
  }

  const db = await getDb();
  const trade = await db.collection("trades").findOne({
    _id: new ObjectId(tradeId),
    userId: new ObjectId(session.userId),
    status: "open",
  });

  if (!trade) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const dir = trade.type === "buy" ? 1 : -1;
  const pnl = dir * (Number(closePrice) - trade.openPrice) * trade.volume;

  await db.collection("trades").updateOne(
    { _id: new ObjectId(tradeId) },
    {
      $set: {
        status: "closed",
        closePrice: Number(closePrice),
        closeTime: new Date(),
        pnl,
      },
    }
  );

  return NextResponse.json({ ok: true, pnl });
}
