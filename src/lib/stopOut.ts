import "server-only";
import type { Db } from "mongodb";
import { accountStopOutLevel } from "@/lib/risk";

/**
 * System-wide stop-out default, set by the admin. It applies to every account that has no
 * stopOutLevel of its own; an account the user or an admin set keeps its own value.
 */
export const STOP_OUT_SETTING_KEY = "stopOutDefault";

/** Used until an admin saves a default. */
export const STOP_OUT_DEFAULT_FALLBACK = 0;

export async function getDefaultStopOutLevel(db: Db): Promise<number> {
  const doc = await db.collection("settings").findOne({ key: STOP_OUT_SETTING_KEY });
  return accountStopOutLevel(doc?.value?.level, STOP_OUT_DEFAULT_FALLBACK);
}
