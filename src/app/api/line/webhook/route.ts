import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getLineSetting, replyLine, verifyLineSignature } from "@/lib/lineNotify";

/**
 * LINE webhook — only used to discover where to send notifications. When the bot is added
 * to a group or someone messages it, the group/user ID is recorded for the admin page, and
 * typing "id" in the chat makes the bot reply with that ID.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const s = await getLineSetting(true);
  if (!verifyLineSignature(s.channelSecret, body, req.headers.get("x-line-signature"))) {
    return new NextResponse(null, { status: 401 });
  }

  const { events = [] } = JSON.parse(body || "{}") as { events?: { type: string; replyToken?: string; source?: { type: string; groupId?: string; roomId?: string; userId?: string }; message?: { type: string; text?: string } }[] };
  const db = await getDb();

  for (const ev of events) {
    const src = ev.source;
    const sourceId = src?.groupId ?? src?.roomId ?? src?.userId;
    if (!src || !sourceId) continue;

    await db.collection("lineSources").updateOne(
      { sourceId },
      { $set: { sourceId, type: src.type, lastSeenAt: new Date() }, $setOnInsert: { firstSeenAt: new Date() } },
      { upsert: true },
    );

    const asksForId = ev.type === "message" && ev.message?.type === "text" && /^\s*(id|ไอดี)\s*$/i.test(ev.message.text ?? "");
    if (ev.replyToken && s.channelAccessToken && (ev.type === "join" || asksForId)) {
      const label = src.type === "group" ? "กลุ่มนี้" : src.type === "room" ? "ห้องนี้" : "คุณ";
      await replyLine(s.channelAccessToken, ev.replyToken, `ID ของ${label}:\n${sourceId}\n\nนำไปใส่ในหน้า Admin → แจ้งเตือน LINE`);
    }
  }
  return NextResponse.json({ ok: true });
}
