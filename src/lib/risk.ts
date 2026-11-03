// Pure risk rules (no I/O) so they can be unit-tested; /api/internal/risk applies them.

/** Positions are force-closed when equity / used margin falls to this percentage. */
export const STOP_OUT_LEVEL = 50;

/**
 * Users choose their own stop-out level, 0–100%. Below the 50% default the broker accepts
 * that a fast market can push equity negative before the risk engine closes positions;
 * negative-balance protection then writes that loss off on the broker's side.
 */
export const STOP_OUT_MIN = 0;
export const STOP_OUT_MAX = 100;

/** Account's effective stop-out level: missing or out-of-range values fall back into [MIN, MAX]. */
export function accountStopOutLevel(value: unknown): number {
  const n = Number(value);
  if (value == null || !Number.isFinite(n)) return STOP_OUT_LEVEL;
  return Math.min(STOP_OUT_MAX, Math.max(STOP_OUT_MIN, Math.round(n)));
}

export type CloseReason = "manual" | "sl" | "tp" | "stop_out" | "master_close" | "copy_stop";

/** SL/TP check at the price the position would close at: buy closes at bid, sell at ask. */
export function slTpHit(
  type: string,
  sl: number | null | undefined,
  tp: number | null | undefined,
  quote: { bid: number; ask: number },
): "sl" | "tp" | null {
  if (type === "buy") {
    if (sl != null && quote.bid <= sl) return "sl";
    if (tp != null && quote.bid >= tp) return "tp";
  } else {
    if (sl != null && quote.ask >= sl) return "sl";
    if (tp != null && quote.ask <= tp) return "tp";
  }
  return null;
}

export interface RiskPosition {
  id: string;
  margin: number;
  pnl: number; // floating P&L at the current close price
}

export function marginLevel(balance: number, positions: RiskPosition[]): number | null {
  const used = positions.reduce((s, p) => s + p.margin, 0);
  if (used <= 0) return null;
  const equity = balance + positions.reduce((s, p) => s + p.pnl, 0);
  return (equity / used) * 100;
}

/**
 * Positions to close, largest loss first, until the margin level is back above the
 * stop-out level (or nothing is left open).
 */
export function stopOutOrder(balance: number, positions: RiskPosition[], level = STOP_OUT_LEVEL): string[] {
  const remaining = [...positions].sort((a, b) => a.pnl - b.pnl);
  const toClose: string[] = [];
  let bal = balance;
  while (remaining.length > 0) {
    const ml = marginLevel(bal, remaining);
    if (ml === null || ml > level) break;
    const worst = remaining.shift()!;
    bal += worst.pnl;
    toClose.push(worst.id);
  }
  return toClose;
}

/* ── Pending orders ── */

export type PendingKind = "buy_limit" | "buy_stop" | "sell_limit" | "sell_stop";

/**
 * Which pending order a price makes, judged against the price the side trades at
 * (buy at ask, sell at bid): below the market a buy waits as a limit, above it as a stop.
 * Returns null when the price equals the market — that is just a market order.
 */
export function pendingKind(side: "buy" | "sell", entry: number, quote: { bid: number; ask: number }): PendingKind | null {
  if (side === "buy") {
    if (entry < quote.ask) return "buy_limit";
    if (entry > quote.ask) return "buy_stop";
  } else {
    if (entry > quote.bid) return "sell_limit";
    if (entry < quote.bid) return "sell_stop";
  }
  return null;
}

/** Whether the market has reached a pending order's price. */
export function pendingTriggered(kind: PendingKind, entry: number, quote: { bid: number; ask: number }): boolean {
  switch (kind) {
    case "buy_limit": return quote.ask <= entry;
    case "buy_stop": return quote.ask >= entry;
    case "sell_limit": return quote.bid >= entry;
    case "sell_stop": return quote.bid <= entry;
  }
}

/** SL/TP must sit on the right side of the entry price, or the position would close as soon as it fills. */
export function slTpValidForEntry(side: "buy" | "sell", sl: number | null, tp: number | null, entry: number): boolean {
  if (side === "buy") return (sl == null || sl < entry) && (tp == null || tp > entry);
  return (sl == null || sl > entry) && (tp == null || tp < entry);
}
