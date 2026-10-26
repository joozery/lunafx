// Pure risk rules (no I/O) so they can be unit-tested; /api/internal/risk applies them.

/** Positions are force-closed when equity / used margin falls to this percentage. */
export const STOP_OUT_LEVEL = 50;

export type CloseReason = "manual" | "sl" | "tp" | "stop_out";

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
