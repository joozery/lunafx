import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { getReferralSetting, REFERRAL_SETTING_KEY } from "@/lib/referral";

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getDb();
  return NextResponse.json({ success: true, setting: await getReferralSetting(db) });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const defaultPercent = Number(body.defaultPercent);
  if (!Number.isFinite(defaultPercent) || defaultPercent < 0 || defaultPercent > 100) {
    return NextResponse.json({ error: "เปอร์เซ็นต์ต้องอยู่ระหว่าง 0 – 100" }, { status: 400 });
  }

  const bustPercent = Number(body.bustPercent ?? 10);
  if (!Number.isFinite(bustPercent) || bustPercent < 0 || bustPercent > 100) {
    return NextResponse.json({ error: "เปอร์เซ็นต์ต้องอยู่ระหว่าง 0 – 100" }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("settings").updateOne(
    { key: REFERRAL_SETTING_KEY },
    { $set: { key: REFERRAL_SETTING_KEY, value: { enabled: Boolean(body.enabled), defaultPercent: Math.round(defaultPercent * 100) / 100, bustPercent: Math.round(bustPercent * 100) / 100 }, updatedAt: new Date() } },
    { upsert: true },
  );
  return NextResponse.json({ success: true });
}
