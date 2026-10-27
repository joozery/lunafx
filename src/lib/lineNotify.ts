import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb } from "@/lib/mongodb";

/**
 * Admin notifications through the LINE Messaging API (LINE Notify was discontinued in 2025).
 * Configured in Admin → "แจ้งเตือน LINE" (settings key "lineNotify"); the env vars
 * LINE_CHANNEL_ACCESS_TOKEN / LINE_NOTIFY_TO still work as a fallback.
 * Never throws: a failed notification must not break signup or deposits.
 */

export const LINE_SETTING_KEY = "lineNotify";

export type LineEvent = "signup" | "deposit" | "withdraw" | "copy" | "referral";

export interface LineSetting {
  enabled: boolean;
  channelAccessToken: string;
  channelSecret: string; // verifies webhook calls (used to discover group IDs)
  targets: string[];     // groupId / userId to push to
  events: Record<LineEvent, boolean>;
}

export const DEFAULT_LINE_SETTING: LineSetting = {
  enabled: false,
  channelAccessToken: "",
  channelSecret: "",
  targets: [],
  events: { signup: true, deposit: true, withdraw: true, copy: true, referral: true },
};

const CACHE_MS = 30_000;
let cache: { at: number; value: LineSetting } | null = null;

export async function getLineSetting(fresh = false): Promise<LineSetting> {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  let value: LineSetting = { ...DEFAULT_LINE_SETTING, events: { ...DEFAULT_LINE_SETTING.events } };
  try {
    const db = await getDb();
    const doc = await db.collection("settings").findOne({ key: LINE_SETTING_KEY });
    if (doc?.value) value = { ...value, ...doc.value, events: { ...value.events, ...(doc.value.events ?? {}) } };
  } catch {}

  // env fallback for installs configured before the admin page existed
  const envToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  const envTargets = (process.env.LINE_NOTIFY_TO ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  if (!value.channelAccessToken && envToken && envTargets.length) {
    value = { ...value, enabled: true, channelAccessToken: envToken, targets: envTargets };
  }
  cache = { at: Date.now(), value };
  return value;
}

export function clearLineSettingCache() {
  cache = null;
}

async function push(token: string, to: string, text: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, messages: [{ type: "text", text: text.slice(0, 5000) }] }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return null;
    const err = `HTTP ${res.status} ${(await res.text()).slice(0, 200)}`;
    console.warn(`[line] push to ${to.slice(0, 6)}… failed: ${err}`);
    return err;
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.warn("[line] push failed:", err);
    return err;
  }
}

/** Send `text` to every configured target if notifications for `event` are switched on. */
export async function notifyAdmins(text: string, event: LineEvent): Promise<void> {
  const s = await getLineSetting();
  if (!s.enabled || !s.events[event] || !s.channelAccessToken || s.targets.length === 0) return;
  await Promise.all(s.targets.map((to) => push(s.channelAccessToken, to, text)));
}

/** Used by the admin "send test" button; returns an error per failed target. */
export async function sendTestMessage(text: string): Promise<{ to: string; error: string | null }[]> {
  const s = await getLineSetting(true);
  if (!s.channelAccessToken) throw new Error("ยังไม่ได้ใส่ Channel Access Token");
  if (s.targets.length === 0) throw new Error("ยังไม่ได้ใส่ ID ผู้รับ");
  return Promise.all(s.targets.map(async (to) => ({ to, error: await push(s.channelAccessToken, to, text) })));
}

export function verifyLineSignature(channelSecret: string, body: string, signature: string | null): boolean {
  if (!channelSecret || !signature) return false;
  const expected = Buffer.from(createHmac("sha256", channelSecret).update(body).digest("base64"));
  const got = Buffer.from(signature);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export async function replyLine(token: string, replyToken: string, text: string) {
  try {
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {}
}

export const thaiTime = () => new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" });
