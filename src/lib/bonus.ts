import "server-only";
import type { Db, Document, WithId } from "mongodb";
import {
  calcBonus, requiredLots, withdrawAllowance, countedPips, withdrawBreakdown, replacedBonusDeduction,
  DEFAULT_BONUS_SETTING, type BonusSetting, type BonusStatus, type PipMode,
} from "@/lib/bonusRules";

export const BONUS_SETTING_KEY = "depositBonus";

export async function getBonusSetting(db: Db): Promise<BonusSetting> {
  const doc = await db.collection("settings").findOne({ key: BONUS_SETTING_KEY });
  return { ...DEFAULT_BONUS_SETTING, ...(doc?.value ?? {}) };
}

/** Where a bonus's turnover is counted from: its grant, or the last withdrawal that restarted it. */
export const bonusCountFrom = (b: Document): Date => b.countFrom ?? b.createdAt;

/**
 * Credit the deposit bonus for an approved deposit transaction. Idempotent per deposit:
 * the bonus record is inserted first (unique per depositTxnId), so retries never pay twice.
 * A bonus still active on the account is replaced, not stacked: it is taken back out and the
 * new one starts its own turnover from this deposit.
 */
export async function grantDepositBonus(db: Db, depositTxn: WithId<Document>): Promise<number> {
  if (depositTxn.type !== "deposit" || !depositTxn.accountNumber || !(depositTxn.amount > 0)) return 0;

  const setting = await getBonusSetting(db);
  const bonusUsd = calcBonus(setting, depositTxn.amount);
  if (bonusUsd <= 0) return 0;

  const account = await db.collection("accounts").findOne({ accountNumber: depositTxn.accountNumber, isDemo: { $ne: true } });
  if (!account) return 0;

  if (setting.firstDepositOnly) {
    const earlier = await db.collection("transactions").countDocuments({
      type: "deposit", status: "completed", accountNumber: depositTxn.accountNumber, _id: { $ne: depositTxn._id },
    });
    if (earlier > 0) return 0;
  }

  const bonuses = db.collection("bonuses");
  const claimed = await bonuses.updateOne(
    { depositTxnId: depositTxn._id },
    {
      $setOnInsert: {
        depositTxnId: depositTxn._id,
        userId: account.userId,
        accountId: account._id.toString(),
        accountNumber: account.accountNumber,
        depositUsd: depositTxn.amount,
        bonusUsd,
        requiredLots: requiredLots(setting, bonusUsd),
        maxWithdrawUsd: setting.maxWithdrawUsd,
        requiredPips: setting.requiredPips,
        pipMode: setting.pipMode,
        status: "active",
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
  if (claimed.upsertedCount === 0) return 0; // already granted for this deposit
  const newBonusId = claimed.upsertedId!;

  // Replace (don't stack) any bonus still active on this account
  const old = await bonuses.find({ accountId: account._id.toString(), status: "active", _id: { $ne: newBonusId } }).toArray();
  let deducted = 0;
  if (old.length > 0) {
    const replaced = await bonuses.updateMany(
      { _id: { $in: old.map((b) => b._id) }, status: "active" },
      { $set: { status: "replaced", replacedAt: new Date(), replacedByBonusId: newBonusId } },
    );
    if (replaced.modifiedCount > 0) {
      const oldUsd = old.reduce((s, b) => s + (b.bonusUsd ?? 0), 0);
      deducted = replacedBonusDeduction(Number(account.balance) || 0, depositTxn.amount, oldUsd);
    }
  }

  const net = Math.round((bonusUsd - deducted) * 100) / 100;
  await db.collection("accounts").updateOne(
    { _id: account._id },
    { $inc: { balance: net, equity: net, freeMargin: net } },
  );
  if (deducted > 0) {
    await db.collection("transactions").insertOne({
      userId: account.userId,
      type: "bonus",
      method: "bonus_replaced",
      accountNumber: account.accountNumber,
      amount: -deducted,
      status: "completed",
      transactionId: `BRM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      adminNotes: `หักโบนัสเดิมคืน (แทนที่ด้วยโบนัสรอบฝากใหม่ ${depositTxn.transactionId ?? depositTxn._id})`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  await db.collection("transactions").insertOne({
    userId: account.userId,
    type: "bonus",
    method: "deposit_bonus",
    accountNumber: account.accountNumber,
    amount: bonusUsd,
    status: "completed",
    transactionId: `BON-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    adminNotes: `โบนัสเงินฝาก (จากยอดฝาก ${depositTxn.transactionId ?? depositTxn._id})`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return bonusUsd;
}

/** Closed trades on an account that count toward a bonus granted at `since` (opened after it). */
export async function bonusTrades(db: Db, accountId: string, since: Date, until?: Date | null) {
  const match: Document = { accountId, status: "closed", openTime: { $gte: since } };
  if (until) match.closeTime = { $lte: until };
  return db.collection("trades")
    .find(match, { projection: { symbol: 1, type: 1, volume: 1, openPrice: 1, closePrice: 1, pnl: 1, openTime: 1, closeTime: 1 } })
    .sort({ openTime: 1 })
    .toArray();
}

/** Lots and pips a set of closed trades adds up to. */
export function sumTurnover(trades: Document[], pipMode: PipMode) {
  let lots = 0, pips = 0;
  for (const t of trades) {
    lots += t.volume ?? 0;
    pips += countedPips(t as { symbol: string; openPrice: number; closePrice: number; volume: number }, pipMode);
  }
  return { lots: Math.round(lots * 100) / 100, pips: Math.round(pips * 10) / 10 };
}

/**
 * Turnover progress for an account. Lots and pips count from closed trades opened after the
 * oldest active bonus was granted, or after the last withdrawal that restarted it; once both
 * reach the combined requirement, all active bonuses complete. Also says how much may be
 * withdrawn: everything except the active bonus, within any cap from a completed bonus.
 */
export async function getBonusStatus(db: Db, account: WithId<Document>): Promise<BonusStatus> {
  const accountId = account._id.toString();
  const bonuses = db.collection("bonuses");

  const active = await bonuses.find({ accountId, status: "active" }).sort({ createdAt: 1 }).toArray();
  if (active.length > 0) {
    const since: Date = active.map(bonusCountFrom).reduce((a, b) => (a < b ? a : b));
    const pipMode: PipMode = active[0].pipMode === "lot_weighted" ? "lot_weighted" : "distance";
    const { lots: tradedLots, pips: tradedPips } = sumTurnover(await bonusTrades(db, accountId, since), pipMode);
    const required = Math.round(active.reduce((s, b) => s + (b.requiredLots ?? 0), 0) * 100) / 100;
    const requiredPips = Math.round(active.reduce((s, b) => s + (b.requiredPips ?? 0), 0) * 10) / 10;

    if (tradedLots < required || tradedPips < requiredPips) {
      const bonusUsd = Math.round(active.reduce((s, b) => s + b.bonusUsd, 0) * 100) / 100;
      return {
        ...withdrawBreakdown(account.balance, bonusUsd, null),
        active: {
          bonusUsd,
          requiredLots: required,
          tradedLots,
          remainingLots: Math.max(0, Math.round((required - tradedLots) * 100) / 100),
          requiredPips,
          tradedPips,
          remainingPips: Math.max(0, Math.round((requiredPips - tradedPips) * 10) / 10),
          pipMode,
        },
        withdrawLimitUsd: null,
      };
    }
    await bonuses.updateMany(
      { _id: { $in: active.map((b) => b._id) }, status: "active" },
      { $set: { status: "completed", completedAt: new Date(), completedLots: tradedLots, completedPips: tradedPips } },
    );
  }

  // Cap from the most recent completed bonus that has one
  const capped = await bonuses.findOne(
    { accountId, status: "completed", maxWithdrawUsd: { $gt: 0 } },
    { sort: { createdAt: -1 } },
  );
  if (!capped) return { ...withdrawBreakdown(account.balance, 0, null), active: null, withdrawLimitUsd: null };

  const sumSince = async (match: Document) => {
    const [r] = await db.collection("transactions").aggregate([
      { $match: { accountNumber: account.accountNumber, createdAt: { $gt: capped.createdAt }, ...match } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray();
    return r?.total ?? 0;
  };
  const deposits  = await sumSince({ type: "deposit", status: "completed", _id: { $ne: capped.depositTxnId } });
  const withdrawn = await sumSince({ type: "withdrawal", status: { $in: ["pending", "completed"] } });

  const withdrawLimitUsd = withdrawAllowance(capped.maxWithdrawUsd, deposits, withdrawn);
  return { ...withdrawBreakdown(account.balance, 0, withdrawLimitUsd), active: null, withdrawLimitUsd };
}

/** An account that lost everything can't still owe turnover on a bonus it no longer has. */
export async function forfeitBonusesIfBusted(db: Db, accountIdStr: string) {
  await db.collection("bonuses").updateMany(
    { accountId: accountIdStr, status: "active" },
    { $set: { status: "forfeited", forfeitedAt: new Date() } },
  );
}

/* ── Withdrawal checks shown to admins ── */

/** Bonus picture of an account as the withdrawal check sees it, in a form admins can display. */
export interface BonusWithdrawSummary {
  hasBonus: boolean;            // account has ever received a deposit bonus
  active: BonusStatus["active"]; // turnover still owed (bonus stays in the account) or null
  withdrawLimitUsd: number | null; // remaining cap once turnover is met; null = no cap
  balanceUsd: number;
  bonusHeldUsd: number;          // active bonus kept back from withdrawals
  withdrawableUsd: number;       // balance − held bonus, within any cap
}

export async function bonusWithdrawSummary(db: Db, account: WithId<Document>): Promise<BonusWithdrawSummary> {
  const hasBonus = (await db.collection("bonuses").countDocuments({ accountId: account._id.toString() }, { limit: 1 })) > 0;
  if (!hasBonus) return { hasBonus, active: null, withdrawLimitUsd: null, ...withdrawBreakdown(account.balance, 0, null) };
  const st = await getBonusStatus(db, account);
  return {
    hasBonus, active: st.active, withdrawLimitUsd: st.withdrawLimitUsd,
    balanceUsd: st.balanceUsd, bonusHeldUsd: st.bonusHeldUsd, withdrawableUsd: st.withdrawableUsd,
  };
}

/** A withdrawal while a bonus is active restarts that bonus's turnover from now. */
export async function restartBonusTurnover(db: Db, accountIdStr: string, withdrawalTxnId: string) {
  await db.collection("bonuses").updateMany(
    { accountId: accountIdStr, status: "active" },
    { $set: { countFrom: new Date(), lastRestartTxnId: withdrawalTxnId }, $inc: { restarts: 1 } },
  );
}

export const WITHDRAW_ATTEMPTS = "withdrawAttempts";
const ATTEMPT_NOTIFY_COOLDOWN_MS = 10 * 60 * 1000;

/**
 * Record a withdrawal the bonus rules refused, so admins can see who tried and how far off they
 * were. Returns whether admins should be notified (at most once per account per cooldown, so a
 * customer clicking repeatedly doesn't flood the LINE group).
 */
export async function recordBlockedWithdrawal(
  db: Db,
  input: {
    userId: Document; accountNumber: string; amountUsd: number; amountThb: number;
    reason: "bonus_active" | "over_cap"; message: string; bonus: BonusWithdrawSummary;
  },
): Promise<{ notify: boolean }> {
  const col = db.collection(WITHDRAW_ATTEMPTS);
  const recent = await col.findOne({
    accountNumber: input.accountNumber,
    createdAt: { $gt: new Date(Date.now() - ATTEMPT_NOTIFY_COOLDOWN_MS) },
  });
  await col.insertOne({ ...input, createdAt: new Date() });
  return { notify: !recent };
}
