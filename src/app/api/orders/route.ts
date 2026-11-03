import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { SYMBOL_SPECS, marginRequired, parseLeverage } from "@/lib/pnl";
import { getConversionMids, getServerQuote } from "@/lib/quote";
import { pendingKind, slTpValidForEntry } from "@/lib/risk";
import { PENDING_COLLECTION, type PendingOrderDoc } from "@/lib/pendingOrders";

const MIN_LOT = 0.01;
const MAX_LOT = 50;
const MAX_PENDING_PER_ACCOUNT = 50;
const NO_PRICE = "ยังไม่มีราคาสด (ตลาดอาจปิดอยู่) กรุณาลองใหม่อีกครั้ง";

const round2 = (n: number) => Math.round(n * 100) / 100;

function optionalPrice(v: unknown): number | null | undefined {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined; // undefined = invalid
}

function serialize(d: PendingOrderDoc) {
  return {
    id: d._id.toString(),
    accountId: d.accountId,
    symbol: d.symbol,
    side: d.side,
    kind: d.kind,
    entryPrice: d.entryPrice,
    volume: d.volume,
    sl: d.sl,
    tp: d.tp,
    status: d.status,
    createdAt: d.createdAt,
    rejectReason: d.rejectReason ?? null,
  };
}

/** The user's waiting pending orders (optionally for one account). */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const accountId = new URL(req.url).searchParams.get("accountId");
  const query: Record<string, unknown> = { userId: new ObjectId(session.userId), status: "pending" };
  if (accountId) query.accountId = accountId;

  const db = await getDb();
  const docs = await db.collection<PendingOrderDoc>(PENDING_COLLECTION).find(query).sort({ createdAt: -1 }).limit(100).toArray();
  return NextResponse.json({ ok: true, orders: docs.map(serialize) });
}

/** Place a pending order: buy/sell at a chosen price; limit or stop is worked out from where that price sits. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { accountId, symbol, side, volume } = body ?? {};

  if (typeof accountId !== "string" || !ObjectId.isValid(accountId)) {
    return NextResponse.json({ ok: false, error: "invalid account" }, { status: 400 });
  }
  if (typeof symbol !== "string" || !Object.hasOwn(SYMBOL_SPECS, symbol)) {
    return NextResponse.json({ ok: false, error: "unknown symbol" }, { status: 400 });
  }
  if (side !== "buy" && side !== "sell") {
    return NextResponse.json({ ok: false, error: "invalid side" }, { status: 400 });
  }
  const vol = round2(Number(volume));
  if (!Number.isFinite(vol) || vol < MIN_LOT || vol > MAX_LOT) {
    return NextResponse.json({ ok: false, error: `volume must be ${MIN_LOT}–${MAX_LOT} lot` }, { status: 400 });
  }
  const entry = optionalPrice(body?.entryPrice);
  if (!entry) return NextResponse.json({ ok: false, error: "กรุณาใส่ราคาที่ต้องการเข้าออเดอร์" }, { status: 400 });
  const sl = optionalPrice(body?.sl);
  const tp = optionalPrice(body?.tp);
  if (sl === undefined || tp === undefined) {
    return NextResponse.json({ ok: false, error: "invalid SL/TP" }, { status: 400 });
  }
  if (!slTpValidForEntry(side, sl, tp, entry)) {
    const msg = side === "buy"
      ? `คำสั่ง Buy: SL ต้องต่ำกว่า ${entry} และ TP ต้องสูงกว่า ${entry}`
      : `คำสั่ง Sell: SL ต้องสูงกว่า ${entry} และ TP ต้องต่ำกว่า ${entry}`;
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const quote = await getServerQuote(symbol);
  if (!quote) return NextResponse.json({ ok: false, error: NO_PRICE }, { status: 503 });
  const kind = pendingKind(side, entry, quote);
  if (!kind) return NextResponse.json({ ok: false, error: "ราคานี้เท่ากับราคาตลาด ให้เปิดออเดอร์แบบทันทีแทน" }, { status: 400 });

  const db = await getDb();
  const userId = new ObjectId(session.userId);
  const account = await db.collection("accounts").findOne({ _id: new ObjectId(accountId), userId });
  if (!account || account.status === "suspended") {
    return NextResponse.json({ ok: false, error: "account not found" }, { status: 404 });
  }

  const col = db.collection<PendingOrderDoc>(PENDING_COLLECTION);
  if ((await col.countDocuments({ accountId, status: "pending" })) >= MAX_PENDING_PER_ACCOUNT) {
    return NextResponse.json({ ok: false, error: `ตั้งคำสั่งรอได้สูงสุด ${MAX_PENDING_PER_ACCOUNT} รายการต่อบัญชี` }, { status: 400 });
  }

  // Margin is only reserved on fill, but refuse an order the account clearly can't afford today
  const margin = marginRequired(symbol, vol, entry, parseLeverage(account.leverage), await getConversionMids([symbol]));
  if ((Number(account.freeMargin) || 0) < margin) {
    return NextResponse.json({ ok: false, error: `มาร์จิ้นไม่เพียงพอ (ต้องใช้ประมาณ $${margin.toFixed(2)})` }, { status: 400 });
  }

  const doc = {
    _id: new ObjectId(),
    userId,
    accountId,
    symbol,
    side,
    kind,
    entryPrice: entry,
    volume: vol,
    sl,
    tp,
    status: "pending" as const,
    createdAt: new Date(),
  };
  await col.insertOne(doc);
  return NextResponse.json({ ok: true, order: serialize(doc) });
}

/** Cancel one of the user's waiting pending orders. */
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id || !ObjectId.isValid(id)) return NextResponse.json({ ok: false, error: "invalid order" }, { status: 400 });

  const db = await getDb();
  const result = await db.collection<PendingOrderDoc>(PENDING_COLLECTION).updateOne(
    { _id: new ObjectId(id), userId: new ObjectId(session.userId), status: "pending" },
    { $set: { status: "cancelled" } },
  );
  if (result.matchedCount === 0) {
    return NextResponse.json({ ok: false, error: "ไม่พบคำสั่ง หรือคำสั่งถูกเปิดไปแล้ว" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
