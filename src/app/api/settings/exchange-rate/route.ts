import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getExchangeRate, DEFAULT_EXCHANGE_SETTING } from "@/lib/exchangeRate";

export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json({ success: true, rate: await getExchangeRate(db) });
  } catch {
    const { depositRate, withdrawRate } = DEFAULT_EXCHANGE_SETTING;
    return NextResponse.json({ success: false, rate: { depositRate, withdrawRate, mode: "fixed", marketRate: null, updatedAt: null } }, { status: 200 });
  }
}
