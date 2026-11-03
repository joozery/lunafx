import "server-only";
import { ObjectId, type Db } from "mongodb";
import type { Quote } from "@/lib/quote";
import { pendingTriggered, type PendingKind } from "@/lib/risk";
import { openTrade } from "@/lib/trading";
import { copyOpen } from "@/lib/copyTrading";

/**
 * Pending orders (Buy/Sell Limit, Buy/Sell Stop) live in `pendingOrders` until the market
 * reaches their price. No margin is held while they wait; it is reserved when they fill,
 * through the same openTrade path as a market order. One that can't fill (e.g. not enough
 * free margin by then) is rejected rather than retried forever.
 *
 * status: pending → filling → filled | rejected, or pending → cancelled by the user.
 */
export const PENDING_COLLECTION = "pendingOrders";

export interface PendingOrderDoc {
  _id: ObjectId;
  userId: ObjectId;
  accountId: string;
  symbol: string;
  side: "buy" | "sell";
  kind: PendingKind;
  entryPrice: number;
  volume: number;
  sl: number | null;
  tp: number | null;
  status: "pending" | "filling" | "filled" | "rejected" | "cancelled";
  createdAt: Date;
  tradeId?: ObjectId;
  filledPrice?: number;
  filledAt?: Date;
  rejectReason?: string;
}

export type FillOutcome = { orderId: string; result: "filled" | "rejected"; tradeId?: string; reason?: string };

/** Fill every pending order whose price has been reached. Called by the risk engine each tick. */
export async function fillPendingOrders(db: Db, quoteFor: (symbol: string) => Promise<Quote | null>): Promise<FillOutcome[]> {
  const col = db.collection<PendingOrderDoc>(PENDING_COLLECTION);
  const pending = await col.find({ status: "pending" }).toArray();
  const outcomes: FillOutcome[] = [];

  for (const order of pending) {
    const quote = await quoteFor(order.symbol);
    if (!quote || !pendingTriggered(order.kind, order.entryPrice, quote)) continue;

    // Claim it so a cancel or an overlapping tick can't fill it twice
    const claimed = await col.findOneAndUpdate({ _id: order._id, status: "pending" }, { $set: { status: "filling" } });
    if (!claimed) continue;

    const reject = async (reason: string) => {
      await col.updateOne({ _id: order._id }, { $set: { status: "rejected", rejectReason: reason, filledAt: new Date() } });
      outcomes.push({ orderId: order._id.toString(), result: "rejected", reason });
    };

    try {
      const account = ObjectId.isValid(order.accountId)
        ? await db.collection("accounts").findOne({ _id: new ObjectId(order.accountId), userId: order.userId })
        : null;
      if (!account || account.status === "suspended") {
        await reject("ไม่พบบัญชีเทรด หรือบัญชีถูกระงับ");
        continue;
      }

      const result = await openTrade(db, {
        account, symbol: order.symbol, type: order.side, volume: order.volume, quote, sl: order.sl, tp: order.tp,
      });
      if (!result.ok) {
        await reject(result.error);
        continue;
      }

      await col.updateOne(
        { _id: order._id },
        { $set: { status: "filled", tradeId: result.tradeId, filledPrice: result.openPrice, filledAt: new Date() } },
      );
      outcomes.push({ orderId: order._id.toString(), result: "filled", tradeId: result.tradeId.toString() });
      void copyOpen(db, result.tradeId).catch((e) => console.error("[copy] open (pending):", e));
    } catch (e) {
      console.error("[pending] fill failed:", e);
      await reject("เปิดออเดอร์ไม่สำเร็จ").catch(() => {});
    }
  }

  return outcomes;
}
