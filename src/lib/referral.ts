import "server-only";
import { randomBytes } from "crypto";
import { ObjectId, type Db, type Document, type WithId } from "mongodb";
import { notifyAdmins, thaiTime } from "@/lib/lineNotify";

export const REFERRAL_SETTING_KEY = "referral";
export const REFERRAL_COOKIE = "luna_ref";

export interface ReferralSetting {
  enabled: boolean;
  defaultPercent: number; // % of each approved deposit made by a referred user
  bustPercent: number; // % of a referred user's net deposits, paid when their account is wiped out
}

export const DEFAULT_REFERRAL_SETTING: ReferralSetting = { enabled: false, defaultPercent: 5, bustPercent: 10 };

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function getReferralSetting(db: Db): Promise<ReferralSetting> {
  const doc = await db.collection("settings").findOne({ key: REFERRAL_SETTING_KEY });
  return { ...DEFAULT_REFERRAL_SETTING, ...(doc?.value ?? {}) };
}

export function normalizeCode(code: unknown): string | null {
  const c = String(code ?? "").trim().toUpperCase();
  return /^[A-Z0-9]{4,16}$/.test(c) ? c : null;
}

/** The user's referral code, created on first use (no ambiguous 0/O/1/I characters). */
export async function ensureReferralCode(db: Db, userId: ObjectId): Promise<string> {
  const users = db.collection("users");
  const user = await users.findOne({ _id: userId }, { projection: { referralCode: 1 } });
  if (user?.referralCode) return user.referralCode;

  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = Array.from(randomBytes(7), (b) => alphabet[b % alphabet.length]).join("");
    if (await users.findOne({ referralCode: code }, { projection: { _id: 1 } })) continue;
    const r = await users.findOneAndUpdate(
      { _id: userId, referralCode: { $exists: false } },
      { $set: { referralCode: code } },
      { returnDocument: "after", projection: { referralCode: 1 } },
    );
    if (r?.referralCode) return r.referralCode;
    // someone else set it concurrently
    const again = await users.findOne({ _id: userId }, { projection: { referralCode: 1 } });
    if (again?.referralCode) return again.referralCode;
  }
  throw new Error("could not allocate referral code");
}

/** Referrer for a code given at sign-up, or null when unknown. */
export async function findReferrer(db: Db, code: unknown): Promise<ObjectId | null> {
  const c = normalizeCode(code);
  if (!c) return null;
  const u = await db.collection("users").findOne({ referralCode: c }, { projection: { _id: 1 } });
  return u?._id ?? null;
}

/**
 * Record a pending commission for an approved deposit made by a referred user.
 * Idempotent per deposit; an admin approves it before anything is paid.
 */
export async function recordReferralCommission(db: Db, depositTxn: WithId<Document>): Promise<void> {
  if (depositTxn.type !== "deposit" || !(depositTxn.amount > 0) || !depositTxn.userId) return;

  const setting = await getReferralSetting(db);
  if (!setting.enabled) return;

  const depositor = await db.collection("users").findOne({ _id: depositTxn.userId }, { projection: { referredBy: 1, firstName: 1, lastName: 1 } });
  if (!depositor?.referredBy) return;

  // Only real-money deposits count
  const account = await db.collection("accounts").findOne({ accountNumber: depositTxn.accountNumber }, { projection: { isDemo: 1 } });
  if (!account || account.isDemo) return;

  const referrer = await db.collection("users").findOne({ _id: depositor.referredBy }, { projection: { referralPercent: 1, firstName: 1, lastName: 1, email: 1 } });
  if (!referrer) return;

  const percent = typeof referrer.referralPercent === "number" ? referrer.referralPercent : setting.defaultPercent;
  const amountUsd = round2((depositTxn.amount * percent) / 100);
  if (amountUsd <= 0) return;

  const result = await db.collection("referralCommissions").updateOne(
    { depositTxnId: depositTxn._id },
    {
      $setOnInsert: {
        depositTxnId: depositTxn._id,
        referrerId: referrer._id,
        referredUserId: depositTxn.userId,
        depositUsd: depositTxn.amount,
        percent,
        amountUsd,
        status: "pending",
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  if (result.upsertedCount > 0) {
    void notifyAdmins(
      `🤝 ค่าแนะนำเพื่อนรออนุมัติ\nผู้แนะนำ: ${referrer.firstName ?? ""} ${referrer.lastName ?? ""} (${referrer.email})\n` +
      `เพื่อนที่ฝาก: ${depositor.firstName ?? ""} ${depositor.lastName ?? ""}\nยอดฝาก: $${depositTxn.amount} × ${percent}% = $${amountUsd}\n` +
      `อนุมัติที่: หลังบ้าน → ระบบแนะนำเพื่อน\nเวลา: ${thaiTime()}`,
      "referral",
    );
  }
}

/**
 * A referred user's real account was wiped out: record a pending commission of bustPercent on the
 * net deposits made since the previous wipe-out. Idempotent per account and period.
 */
export async function recordBustCommission(db: Db, accountId: ObjectId): Promise<void> {
  const setting = await getReferralSetting(db);
  if (!setting.enabled || !(setting.bustPercent > 0)) return;

  const account = await db.collection("accounts").findOne({ _id: accountId }, { projection: { userId: 1, accountNumber: 1, isDemo: 1 } });
  if (!account || account.isDemo) return;

  const owner = await db.collection("users").findOne({ _id: account.userId }, { projection: { referredBy: 1, firstName: 1, lastName: 1 } });
  if (!owner?.referredBy) return;
  const referrer = await db.collection("users").findOne({ _id: owner.referredBy }, { projection: { firstName: 1, lastName: 1, email: 1 } });
  if (!referrer) return;

  const commissions = db.collection("referralCommissions");
  const last = await commissions.findOne({ kind: "bust", accountId }, { sort: { createdAt: -1 }, projection: { createdAt: 1 } });
  const since = last?.createdAt ?? new Date(0);

  const sum = async (match: Document) => {
    const [r] = await db.collection("transactions").aggregate([
      { $match: { accountNumber: account.accountNumber, createdAt: { $gt: since }, ...match } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).toArray();
    return r?.total ?? 0;
  };
  const deposits = await sum({ type: "deposit", status: "completed" });
  const withdrawn = await sum({ type: "withdrawal", status: { $in: ["pending", "completed"] } });
  const netUsd = round2(deposits - withdrawn);
  const amountUsd = round2((netUsd * setting.bustPercent) / 100);
  if (amountUsd <= 0) return;

  const result = await commissions.updateOne(
    { kind: "bust", accountId, since: since.getTime() },
    {
      $setOnInsert: {
        kind: "bust",
        accountId,
        since: since.getTime(),
        referrerId: referrer._id,
        referredUserId: account.userId,
        depositUsd: netUsd,
        percent: setting.bustPercent,
        amountUsd,
        status: "pending",
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  if (result.upsertedCount > 0) {
    void notifyAdmins(
      `💥 พอร์ตเพื่อนแตก — ค่าคอมรออนุมัติ\nผู้แนะนำ: ${referrer.firstName ?? ""} ${referrer.lastName ?? ""} (${referrer.email})\n` +
      `เพื่อนที่พอร์ตแตก: ${owner.firstName ?? ""} ${owner.lastName ?? ""} #${account.accountNumber}\nยอดฝากสุทธิ: $${netUsd} × ${setting.bustPercent}% = $${amountUsd}\n` +
      `อนุมัติที่: หลังบ้าน → ระบบแนะนำเพื่อน\nเวลา: ${thaiTime()}`,
      "referral",
    );
  }
}

/** Pay an approved commission into the referrer's oldest live trading account. */
export async function payReferralCommission(db: Db, commissionId: ObjectId): Promise<{ ok: true } | { ok: false; error: string }> {
  const commissions = db.collection("referralCommissions");
  const c = await commissions.findOne({ _id: commissionId });
  if (!c) return { ok: false, error: "ไม่พบรายการ" };
  if (c.status !== "pending") return { ok: false, error: "รายการนี้ดำเนินการไปแล้ว" };

  const account = await db.collection("accounts").findOne(
    { userId: c.referrerId, isDemo: { $ne: true }, status: { $ne: "suspended" } },
    { sort: { createdAt: 1 } },
  );
  if (!account) return { ok: false, error: "ผู้แนะนำยังไม่มีบัญชีเทรดจริงสำหรับรับค่าคอม" };

  // Claim first so a double click can never pay twice
  const claimed = await commissions.findOneAndUpdate(
    { _id: commissionId, status: "pending" },
    { $set: { status: "paid", paidAt: new Date(), accountNumber: account.accountNumber } },
  );
  if (!claimed) return { ok: false, error: "รายการนี้ดำเนินการไปแล้ว" };

  await db.collection("accounts").updateOne(
    { _id: account._id },
    { $inc: { balance: c.amountUsd, equity: c.amountUsd, freeMargin: c.amountUsd } },
  );
  await db.collection("transactions").insertOne({
    userId: c.referrerId,
    type: "commission",
    method: "referral",
    accountNumber: account.accountNumber,
    amount: c.amountUsd,
    status: "completed",
    transactionId: `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    adminNotes: c.kind === "bust"
      ? `ค่าคอม ${c.percent}% จากพอร์ตเพื่อนแตก (ยอดฝากสุทธิ $${c.depositUsd})`
      : `ค่าแนะนำ ${c.percent}% จากยอดฝาก $${c.depositUsd}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { ok: true };
}
