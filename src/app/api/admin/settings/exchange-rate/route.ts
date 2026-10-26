import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import {
  getExchangeRate, getExchangeSetting, isValidMarkup, isValidRate, EXCHANGE_RATE_KEY,
} from "@/lib/exchangeRate";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await getDb();
  const [setting, rate] = await Promise.all([getExchangeSetting(db), getExchangeRate(db)]);
  return NextResponse.json({ success: true, setting, rate });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const mode = body.mode === "live" ? "live" : "fixed";
  const depositRate    = Number(body.depositRate);
  const withdrawRate   = Number(body.withdrawRate);
  const depositMarkup  = Number(body.depositMarkup);
  const withdrawMarkup = Number(body.withdrawMarkup);

  if (!isValidRate(depositRate) || !isValidRate(withdrawRate)) {
    return NextResponse.json({ error: "อัตราแลกเปลี่ยนต้องเป็นตัวเลขระหว่าง 1 – 1000 บาท" }, { status: 400 });
  }
  if (!isValidMarkup(depositMarkup) || !isValidMarkup(withdrawMarkup)) {
    return NextResponse.json({ error: "ส่วนต่างต้องอยู่ระหว่าง 0 – 50 บาท" }, { status: 400 });
  }

  const r2 = (n: number) => Math.round(n * 100) / 100;
  const db = await getDb();
  await db.collection("settings").updateOne(
    { key: EXCHANGE_RATE_KEY },
    {
      $set: {
        key: EXCHANGE_RATE_KEY,
        value: { mode, depositRate: r2(depositRate), withdrawRate: r2(withdrawRate), depositMarkup: r2(depositMarkup), withdrawMarkup: r2(withdrawMarkup) },
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
