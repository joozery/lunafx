import "server-only";
import type { Db, Document, WithId } from "mongodb";
import {
  calcBonus, requiredLots, withdrawAllowance,
  DEFAULT_BONUS_SETTING, type BonusSetting, type BonusStatus,
} from "@/lib/bonusRules";

export const BONUS_SETTING_KEY = "depositBonus";

export async function getBonusSetting(db: Db): Promise<BonusSetting> {
  const doc = await db.collection("settings").findOne({ key: BONUS_SETTING_KEY });
  return { ...DEFAULT_BONUS_SETTING, ...(doc?.value ?? {}) };
}

/**
 * Credit the deposit bonus for an approved deposit transaction. Idempotent per deposit:
 * the bonus record is inserted first (unique per depositTxnId), so retries never pay twice.
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
        status: "active",
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
  if (claimed.upsertedCount === 0) return 0; // already granted for this deposit

  await db.collection("accounts").updateOne(
    { _id: account._id },
    { $inc: { balance: bonusUsd, equity: bonusUsd, freeMargin: bonusUsd } },
  );
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

/**
 * Turnover progress for an account. Lots count from closed trades opened after the oldest
 * active bonus; once they reach the combined requirement, all active bonuses complete.
 */
export async function getBonusStatus(db: Db, account: WithId<Document>): Promise<BonusStatus> {
  const accountId = account._id.toString();
  const bonuses = db.collection("bonuses");

  const active = await bonuses.find({ accountId, status: "active" }).sort({ createdAt: 1 }).toArray();
  if (active.length > 0) {
    const since: Date = active[0].createdAt;
    const [agg] = await db.collection("trades").aggregate([
      { $match: { accountId, status: "closed", openTime: { $gte: since } } },
      { $group: { _id: null, lots: { $sum: "$volume" } } },
    ]).toArray();
    const tradedLots = Math.round((agg?.lots ?? 0) * 100) / 100;
    const required = Math.round(active.reduce((s, b) => s + (b.requiredLots ?? 0), 0) * 100) / 100;

    if (tradedLots < required) {
      return {
        active: {
          bonusUsd: active.reduce((s, b) => s + b.bonusUsd, 0),
          requiredLots: required,
          tradedLots,
          remainingLots: Math.round((required - tradedLots) * 100) / 100,
        },
        withdrawLimitUsd: null,
      };
    }
    await bonuses.updateMany(
      { _id: { $in: active.map((b) => b._id) }, status: "active" },
      { $set: { status: "completed", completedAt: new Date() } },
    );
  }

  // Cap from the most recent completed bonus that has one
  const capped = await bonuses.findOne(
    { accountId, status: "completed", maxWithdrawUsd: { $gt: 0 } },
    { sort: { createdAt: -1 } },
  );
  if (!capped) return { active: null, withdrawLimitUsd: null };

  const sumSince = async (match: Document) => {
    const [r] = await db.collection("transactions").aggregate([
      { $match: { accountNumber: account.accountNumber, createdAt: { $gt: capped.createdAt }, ...match } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray();
    return r?.total ?? 0;
  };
  const deposits  = await sumSince({ type: "deposit", status: "completed", _id: { $ne: capped.depositTxnId } });
  const withdrawn = await sumSince({ type: "withdrawal", status: { $in: ["pending", "completed"] } });

  return { active: null, withdrawLimitUsd: withdrawAllowance(capped.maxWithdrawUsd, deposits, withdrawn) };
}

/** An account that lost everything can't still owe turnover on a bonus it no longer has. */
export async function forfeitBonusesIfBusted(db: Db, accountIdStr: string) {
  await db.collection("bonuses").updateMany(
    { accountId: accountIdStr, status: "active" },
    { $set: { status: "forfeited", forfeitedAt: new Date() } },
  );
}
