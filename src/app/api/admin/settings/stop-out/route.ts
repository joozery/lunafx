import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { STOP_OUT_MAX, STOP_OUT_MIN } from "@/lib/risk";
import { STOP_OUT_SETTING_KEY, getDefaultStopOutLevel } from "@/lib/stopOut";

/** The system stop-out default, plus how many accounts use it vs. their own value. */
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await getDb();
  const accounts = db.collection("accounts");
  const [level, total, custom] = await Promise.all([
    getDefaultStopOutLevel(db),
    accounts.countDocuments({ isDemo: { $ne: true } }),
    accounts.countDocuments({ isDemo: { $ne: true }, stopOutLevel: { $ne: null } }),
  ]);
  return NextResponse.json({ success: true, level, liveAccounts: total, customAccounts: custom });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const level = Number(body?.level);
  if (!Number.isInteger(level) || level < STOP_OUT_MIN || level > STOP_OUT_MAX) {
    return NextResponse.json({ error: `ค่าต้องเป็นจำนวนเต็ม ${STOP_OUT_MIN}–${STOP_OUT_MAX}` }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("settings").updateOne(
    { key: STOP_OUT_SETTING_KEY },
    { $set: { key: STOP_OUT_SETTING_KEY, value: { level }, updatedAt: new Date(), updatedBy: admin.email } },
    { upsert: true },
  );
  return NextResponse.json({ success: true, level });
}
