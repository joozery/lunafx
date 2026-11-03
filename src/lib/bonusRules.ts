// Pure deposit-bonus rules (no I/O) so they can be unit-tested; src/lib/bonus.ts applies them.

export interface BonusSetting {
  enabled: boolean;
  minDepositUsd: number;        // deposit must be at least this to qualify
  bonusType: "fixed" | "percent";
  bonusValue: number;           // USD for "fixed", % of the deposit for "percent"
  maxBonusUsd: number;          // cap per deposit (0 = no cap)
  lotsPerBonusUsd: number;      // turnover: lots to trade per $1 of bonus before withdrawing
  maxWithdrawUsd: number;       // max withdrawal once turnover is met (0 = no limit); later deposits add to it
  firstDepositOnly: boolean;    // only the first approved deposit of an account qualifies
  requiredPips: number;         // pips to trade per bonus before withdrawing (0 = no pip condition)
  pipMode: PipMode;             // how a trade's pips are counted toward requiredPips
}

/**
 * "distance": pips the price moved between open and close, whatever the lot size.
 * "lot_weighted": that distance multiplied by the lot size (15 pips on 2 lots = 30).
 * Both count losing trades too (absolute distance).
 */
export type PipMode = "distance" | "lot_weighted";

export const DEFAULT_BONUS_SETTING: BonusSetting = {
  enabled: false,
  minDepositUsd: 20,
  bonusType: "fixed",
  bonusValue: 30,
  maxBonusUsd: 0,
  lotsPerBonusUsd: 0.1,
  maxWithdrawUsd: 0,
  firstDepositOnly: true,
  requiredPips: 0,
  pipMode: "distance",
};

/** Pip size per symbol; matches the step the WebTrader uses for SL/TP. */
export const PIP_SIZE: Record<string, number> = {
  XAUUSD: 0.01, XAGUSD: 0.001,
  EURUSD: 0.0001, GBPUSD: 0.0001, USDCHF: 0.0001, AUDUSD: 0.0001, USDCAD: 0.0001, NZDUSD: 0.0001,
  EURGBP: 0.0001, EURAUD: 0.0001, EURCHF: 0.0001, GBPCHF: 0.0001,
  USDJPY: 0.01, EURJPY: 0.01, GBPJPY: 0.01, AUDJPY: 0.01, NZDJPY: 0.01, CADJPY: 0.01, CHFJPY: 0.01,
  BTCUSD: 1, ETHUSD: 0.01, USOIL: 0.01, US30: 1,
};

export function pipSize(symbol: string): number {
  return PIP_SIZE[symbol] ?? (symbol.endsWith("JPY") ? 0.01 : 0.0001);
}

/** Pips moved by a closed trade (always >= 0), rounded to 0.1 pip. */
export function tradePips(t: { symbol: string; openPrice: number; closePrice?: number | null }): number {
  if (t.closePrice == null || !Number.isFinite(t.closePrice) || !Number.isFinite(t.openPrice)) return 0;
  return Math.round((Math.abs(t.closePrice - t.openPrice) / pipSize(t.symbol)) * 10) / 10;
}

/** Pips a closed trade counts toward the bonus pip condition under `mode`. */
export function countedPips(t: { symbol: string; openPrice: number; closePrice?: number | null; volume: number }, mode: PipMode): number {
  const p = tradePips(t);
  return Math.round((mode === "lot_weighted" ? p * (t.volume || 0) : p) * 10) / 10;
}

export interface BonusStatus {
  active: {
    bonusUsd: number;
    requiredLots: number; tradedLots: number; remainingLots: number;
    requiredPips: number; tradedPips: number; remainingPips: number; // requiredPips 0 = no pip condition
    pipMode: PipMode;
  } | null;
  withdrawLimitUsd: number | null; // null = no cap
  balanceUsd: number;
  bonusHeldUsd: number;            // active bonus that has to stay in the account
  withdrawableUsd: number;         // what may be withdrawn right now (balance − held bonus, within any cap)
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Bonus in USD for a deposit, 0 when the deposit does not qualify. */
export function calcBonus(s: BonusSetting, depositUsd: number): number {
  if (!s.enabled || !(depositUsd > 0) || depositUsd < s.minDepositUsd) return 0;
  let bonus = s.bonusType === "percent" ? (depositUsd * s.bonusValue) / 100 : s.bonusValue;
  if (s.maxBonusUsd > 0) bonus = Math.min(bonus, s.maxBonusUsd);
  return Math.max(0, round2(bonus));
}

export function requiredLots(s: BonusSetting, bonusUsd: number): number {
  return round2(bonusUsd * s.lotsPerBonusUsd);
}

/** Remaining withdrawal allowance under a max-withdraw cap. */
export function withdrawAllowance(maxWithdrawUsd: number, depositsSinceUsd: number, withdrawnSinceUsd: number): number {
  return Math.max(0, round2(maxWithdrawUsd + depositsSinceUsd - withdrawnSinceUsd));
}

/**
 * What an account may withdraw. An active bonus doesn't block withdrawals: the customer takes out
 * their own money and profit while the bonus (or what is left of it) stays in the account.
 */
export function withdrawBreakdown(balanceUsd: number, activeBonusUsd: number, capUsd: number | null) {
  const balance = Math.max(0, Number(balanceUsd) || 0);
  const bonusHeldUsd = round2(Math.min(balance, Math.max(0, activeBonusUsd)));
  let withdrawableUsd = round2(balance - bonusHeldUsd);
  if (capUsd != null) withdrawableUsd = Math.min(withdrawableUsd, round2(Math.max(0, capUsd)));
  return { balanceUsd: round2(balance), bonusHeldUsd, withdrawableUsd: Math.max(0, withdrawableUsd) };
}

/**
 * A new deposit bonus replaces an active one instead of stacking. The old bonus comes back out
 * of the account, but never more than the account held before this deposit was credited.
 */
export function replacedBonusDeduction(balanceAfterDepositUsd: number, depositUsd: number, oldBonusUsd: number): number {
  const before = Math.max(0, (Number(balanceAfterDepositUsd) || 0) - (Number(depositUsd) || 0));
  return round2(Math.min(before, Math.max(0, oldBonusUsd)));
}

/** Validates and normalises an admin-submitted setting; returns an error message or the setting. */
export function parseBonusSetting(body: Record<string, unknown>): BonusSetting | string {
  const num = (k: string) => Number(body[k]);
  const s: BonusSetting = {
    enabled: Boolean(body.enabled),
    minDepositUsd: num("minDepositUsd"),
    bonusType: body.bonusType === "percent" ? "percent" : "fixed",
    bonusValue: num("bonusValue"),
    maxBonusUsd: num("maxBonusUsd"),
    lotsPerBonusUsd: num("lotsPerBonusUsd"),
    maxWithdrawUsd: num("maxWithdrawUsd"),
    firstDepositOnly: Boolean(body.firstDepositOnly),
    requiredPips: num("requiredPips") || 0,
    pipMode: body.pipMode === "lot_weighted" ? "lot_weighted" : "distance",
  };
  const fields = [s.minDepositUsd, s.bonusValue, s.maxBonusUsd, s.lotsPerBonusUsd, s.maxWithdrawUsd, s.requiredPips];
  if (fields.some((n) => !Number.isFinite(n) || n < 0)) return "กรุณากรอกตัวเลขที่ไม่ติดลบให้ครบทุกช่อง";
  if (s.bonusValue <= 0) return "จำนวนโบนัสต้องมากกว่า 0";
  if (s.bonusType === "percent" && s.bonusValue > 1000) return "โบนัสแบบเปอร์เซ็นต์ต้องไม่เกิน 1000%";
  return {
    ...s,
    minDepositUsd: round2(s.minDepositUsd),
    bonusValue: round2(s.bonusValue),
    maxBonusUsd: round2(s.maxBonusUsd),
    lotsPerBonusUsd: Math.round(s.lotsPerBonusUsd * 1000) / 1000,
    maxWithdrawUsd: round2(s.maxWithdrawUsd),
    requiredPips: Math.round(s.requiredPips * 10) / 10,
  };
}
