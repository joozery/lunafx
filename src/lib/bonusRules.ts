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
}

export const DEFAULT_BONUS_SETTING: BonusSetting = {
  enabled: false,
  minDepositUsd: 20,
  bonusType: "fixed",
  bonusValue: 30,
  maxBonusUsd: 0,
  lotsPerBonusUsd: 0.1,
  maxWithdrawUsd: 0,
  firstDepositOnly: true,
};

export interface BonusStatus {
  active: { bonusUsd: number; requiredLots: number; tradedLots: number; remainingLots: number } | null;
  withdrawLimitUsd: number | null; // null = no cap
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
  };
  const fields = [s.minDepositUsd, s.bonusValue, s.maxBonusUsd, s.lotsPerBonusUsd, s.maxWithdrawUsd];
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
  };
}
