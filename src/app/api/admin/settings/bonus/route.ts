import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { getBonusSetting, BONUS_SETTING_KEY } from "@/lib/bonus";
import { parseBonusSetting } from "@/lib/bonusRules";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await getDb();
  return NextResponse.json({ success: true, setting: await getBonusSetting(db) });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = parseBonusSetting(await req.json());
  if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 });

  const db = await getDb();
  await db.collection("settings").updateOne(
    { key: BONUS_SETTING_KEY },
    { $set: { key: BONUS_SETTING_KEY, value: parsed, updatedAt: new Date() } },
    { upsert: true },
  );
  return NextResponse.json({ success: true });
}
