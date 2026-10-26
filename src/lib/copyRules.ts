// Pure copy-trading rules (no I/O) so they can be unit-tested; src/lib/copyTrading.ts applies them.

export const COPY_MIN_LOT = 0.01;
export const COPY_MAX_LOT = 100;

export type CopyMode = "ratio" | "fixed" | "multiplier";

export interface CopySizing {
  mode: CopyMode;
  allocation: number;  // USD the follower dedicates to this master (ratio mode)
  fixedLot?: number;   // fixed mode
  multiplier?: number; // multiplier mode
}

/**
 * Follower lot size for a master order, or 0 when it rounds below the minimum lot.
 * ratio: master lots × (follower allocation ÷ master balance) — the usual default.
 */
export function calcCopyVolume(masterVolume: number, masterBalance: number, s: CopySizing): number {
  let v: number;
  if (s.mode === "fixed") v = s.fixedLot ?? 0;
  else if (s.mode === "multiplier") v = masterVolume * (s.multiplier ?? 1);
  else v = masterBalance > 0 ? (masterVolume * s.allocation) / masterBalance : 0;

  // Round DOWN so a follower never carries more exposure than its share; the epsilon absorbs
  // float noise (0.1 computed as 0.09999…). Below the minimum lot the order is skipped.
  v = Math.floor(v * 100 + 1e-6) / 100;
  if (v < COPY_MIN_LOT) return 0;
  return Math.min(v, COPY_MAX_LOT);
}

/** True once the follower's copy result (realised + floating) has lost maxLossPercent of the allocation. */
export function copyLossBreached(allocation: number, maxLossPercent: number, realizedPnl: number, floatingPnl: number): boolean {
  if (!(maxLossPercent > 0) || !(allocation > 0)) return false;
  return realizedPnl + floatingPnl <= -(allocation * maxLossPercent) / 100;
}

export interface ClosedTradeLite { pnl: number; closeTime: Date | string }

export interface MasterStats {
  trades: number;
  winRate: number;     // %
  totalPnl: number;
  roiTotal: number;    // % on the capital base
  roi30d: number;      // %
  maxDrawdown: number; // % peak-to-trough of the balance curve
  riskScore: number;   // 1–10, from max drawdown
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Track record from the master's closed trades. `base` is the capital the results are
 * measured against (net deposits into the master account).
 */
export function masterStats(trades: ClosedTradeLite[], base: number, now = Date.now()): MasterStats {
  const sorted = [...trades].sort((a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime());
  const wins = sorted.filter((t) => t.pnl > 0).length;
  const totalPnl = sorted.reduce((s, t) => s + t.pnl, 0);
  const since30 = now - 30 * 86_400_000;
  const pnl30 = sorted.filter((t) => new Date(t.closeTime).getTime() >= since30).reduce((s, t) => s + t.pnl, 0);

  let balance = base, peak = base, maxDd = 0;
  for (const t of sorted) {
    balance += t.pnl;
    if (balance > peak) peak = balance;
    if (peak > 0) maxDd = Math.max(maxDd, ((peak - balance) / peak) * 100);
  }

  return {
    trades: sorted.length,
    winRate: sorted.length ? r2((wins / sorted.length) * 100) : 0,
    totalPnl: r2(totalPnl),
    roiTotal: base > 0 ? r2((totalPnl / base) * 100) : 0,
    roi30d: base > 0 ? r2((pnl30 / base) * 100) : 0,
    maxDrawdown: r2(maxDd),
    riskScore: riskScoreFromDrawdown(maxDd),
  };
}

/** 1 (calm) … 10 (wild): every 5% of max drawdown adds a point. */
export function riskScoreFromDrawdown(maxDrawdown: number): number {
  return Math.min(10, Math.max(1, Math.ceil(maxDrawdown / 5)));
}
