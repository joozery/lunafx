import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { clearLineSettingCache, getLineSetting, sendTestMessage, thaiTime, LINE_SETTING_KEY } from "@/lib/lineNotify";

const mask = (s: string) => (s ? `••••${s.slice(-4)}` : "");

/** Secrets never go back to the browser: only whether they are set and their last 4 characters. */
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const s = await getLineSetting(true);
  const db = await getDb();
  const sources = await db.collection("lineSources").find().sort({ lastSeenAt: -1 }).limit(20).toArray();
  return NextResponse.json({
    setting: {
      enabled: s.enabled,
      targets: s.targets,
      events: s.events,
      tokenHint: mask(s.channelAccessToken),
      secretHint: mask(s.channelSecret),
    },
    sources: sources.map((x) => ({ id: x.sourceId, type: x.type, name: x.name ?? null, lastSeenAt: x.lastSeenAt })),
  });
}

/** Save settings (blank token/secret = keep the current one), or { action: "test" } to send a test message. */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();

  if (body.action === "test") {
    try {
      const results = await sendTestMessage(`✅ ทดสอบแจ้งเตือนจาก Lunaforex Admin\nส่งโดย: ${admin.firstName ?? "admin"}\nเวลา: ${thaiTime()}`);
      const failed = results.filter((r) => r.error);
      return failed.length
        ? NextResponse.json({ error: `ส่งไม่สำเร็จ ${failed.length}/${results.length}: ${failed[0].error}` }, { status: 400 })
        : NextResponse.json({ success: true, sent: results.length });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "ส่งไม่สำเร็จ" }, { status: 400 });
    }
  }

  const targets: string[] = Array.isArray(body.targets)
    ? [...new Set<string>(body.targets.map((t: unknown) => String(t).trim()).filter(Boolean))]
    : [];
  if (targets.some((t) => !/^[UCR][0-9a-f]{32}$/.test(t))) {
    return NextResponse.json({ error: "ID ผู้รับต้องขึ้นต้นด้วย U (ผู้ใช้) หรือ C (กลุ่ม) ตามด้วยตัวอักษร 32 ตัว" }, { status: 400 });
  }

  const current = await getLineSetting(true);
  const token = String(body.channelAccessToken ?? "").trim();
  const secret = String(body.channelSecret ?? "").trim();

  const db = await getDb();
  await db.collection("settings").updateOne(
    { key: LINE_SETTING_KEY },
    {
      $set: {
        key: LINE_SETTING_KEY,
        value: {
          enabled: Boolean(body.enabled),
          channelAccessToken: token || current.channelAccessToken,
          channelSecret: secret || current.channelSecret,
          targets,
          events: {
            signup: Boolean(body.events?.signup),
            deposit: Boolean(body.events?.deposit),
            withdraw: Boolean(body.events?.withdraw),
            copy: Boolean(body.events?.copy),
          },
        },
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  clearLineSettingCache();
  return NextResponse.json({ success: true });
}
