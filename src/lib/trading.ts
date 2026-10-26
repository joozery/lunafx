import "server-only";
import { createHash } from "crypto";
import { ObjectId, type Db, type Document, type WithId } from "mongodb";
import { calcTradePnl, marginRequired, parseLeverage } from "@/lib/pnl";
import { getConversionMids, type Quote } from "@/lib/quote";
import type { CloseReason } from "@/lib/risk";
import { forfeitBonusesIfBusted } from "@/lib/bonus";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Token server.js sends when it triggers internal jobs; must match server.js. */
export function internalToken(purpose: string): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret ? createHash("sha256").update(`${secret}:${purpose}`).digest("hex") : null;
}

export type OpenResult =
  | { ok: true; tradeId: ObjectId; openPrice: number; margin: number }
  | { ok: false; status: number; error: string };

export interface OpenTradeInput {
  account: WithId<Document>;
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  quote: Quote;
  sl: number | null;
  tp: number | null;
  /** set on a follower's position opened by copy trading */
  copy?: { masterId: ObjectId; subscriptionId: ObjectId; masterTradeId: ObjectId };
}

/**
 * Open a position at the server quote (buy at ask, sell at bid), reserving margin atomically.
 * Shared by manual orders and copy trading so both are filled and margined the same way.
 */
export async function openTrade(db: Db, input: OpenTradeInput): Promise<OpenResult> {
  const { account, symbol, type, volume, quote, sl, tp, copy } = input;
  const accounts = db.collection("accounts");
  const openPrice = type === "buy" ? quote.ask : quote.bid;
  const margin = marginRequired(symbol, volume, openPrice, parseLeverage(account.leverage), await getConversionMids([symbol]));

  const reserved = await accounts.findOneAndUpdate(
    { _id: account._id, freeMargin: { $gte: margin } },
    { $inc: { freeMargin: -margin } },
  );
  if (!reserved) return { ok: false, status: 400, error: `มาร์จิ้นไม่เพียงพอ (ต้องใช้ $${margin.toFixed(2)})` };

  try {
    const { insertedId } = await db.collection("trades").insertOne({
      userId: account.userId,
      accountId: account._id.toString(),
      symbol,
      type,
      volume,
      openPrice,
      margin,
      sl,
      tp,
      status: "open",
      openTime: new Date(),
      ...(copy ? { copy } : {}),
    });
    return { ok: true, tradeId: insertedId, openPrice, margin };
  } catch {
    await accounts.updateOne({ _id: account._id }, { $inc: { freeMargin: margin } }); // give the margin back
    return { ok: false, status: 500, error: "failed to open order" };
  }
}

export type CloseResult =
  | { ok: true; pnl: number; closePrice: number }
  | { ok: false; status: number; error: string };

/**
 * Close an open trade at the server quote and realise the P&L on its account.
 * Shared by manual closes, SL/TP and stop-out so every path books the result the same way.
 */
export async function closeTrade(db: Db, trade: WithId<Document>, quote: Quote, reason: CloseReason): Promise<CloseResult> {
  const trades = db.collection("trades");
  const closePrice = trade.type === "buy" ? quote.bid : quote.ask;
  const mids = await getConversionMids([trade.symbol]);
  const pnl = round2(calcTradePnl(trade.type, trade.symbol, trade.openPrice, closePrice, trade.volume, mids));

  // Claim the trade first so a double click / retry / concurrent risk check can never credit the account twice
  const claimed = await trades.findOneAndUpdate(
    { _id: trade._id, status: "open" },
    { $set: { status: "closed", closePrice, closeTime: new Date(), pnl, closeReason: reason } },
  );
  if (!claimed) return { ok: false, status: 409, error: "already closed" };

  // Realise the result on the account: balance/equity take the P&L, free margin also gets the reserved margin back
  try {
    if (ObjectId.isValid(trade.accountId)) {
      const accountId = new ObjectId(trade.accountId);
      await db.collection("accounts").updateOne(
        { _id: accountId, userId: trade.userId },
        { $inc: { balance: pnl, equity: pnl, freeMargin: pnl + (trade.margin ?? 0) } },
      );
      await applyNegativeBalanceProtection(db, accountId, trade.accountId);
    }
  } catch {
    await trades.updateOne(
      { _id: trade._id },
      { $set: { status: "open" }, $unset: { closePrice: "", closeTime: "", pnl: "", closeReason: "" } },
    );
    return { ok: false, status: 500, error: "failed to update account" };
  }

  // Copy trading: a follower's result counts toward its loss limit; a master's close closes its copies
  const copy = await import("@/lib/copyTrading");
  if (trade.copy?.subscriptionId) await copy.recordCopyResult(db, trade.copy.subscriptionId, pnl).catch((e) => console.error("[copy] result:", e));
  else if (reason !== "copy_stop") await copy.closeCopies(db, trade._id).catch((e) => console.error("[copy] close:", e));

  return { ok: true, pnl, closePrice };
}

/**
 * A client can never owe more than they deposited: once the last position is closed,
 * a negative balance is reset to zero and the write-off is recorded as a transaction.
 */
async function applyNegativeBalanceProtection(db: Db, accountId: ObjectId, accountIdStr: string) {
  const stillOpen = await db.collection("trades").countDocuments({ accountId: accountIdStr, status: "open" });
  if (stillOpen > 0) return;

  const before = await db.collection("accounts").findOneAndUpdate(
    { _id: accountId, balance: { $lt: 0 } },
    { $set: { balance: 0, equity: 0, freeMargin: 0 } },
  );
  if (!before) {
    const acc = await db.collection("accounts").findOne({ _id: accountId }, { projection: { balance: 1 } });
    if (acc && (acc.balance ?? 0) <= 0) await forfeitBonusesIfBusted(db, accountIdStr);
    return;
  }
  await forfeitBonusesIfBusted(db, accountIdStr);

  await db.collection("transactions").insertOne({
    userId: before.userId,
    type: "adjustment",
    method: "negative_balance_protection",
    accountNumber: before.accountNumber,
    amount: round2(-before.balance),
    status: "completed",
    transactionId: `ADJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    adminNotes: `Negative balance protection: ยอด ${round2(before.balance)} USD ถูกปรับเป็น 0`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}
