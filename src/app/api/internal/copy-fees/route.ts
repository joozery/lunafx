import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getDb } from "@/lib/mongodb";
import { settleDueFees } from "@/lib/copyTrading";
import { internalToken } from "@/lib/trading";

/** Called hourly by server.js: settles copy-trading performance fees that are due (weekly per copy). */
export async function POST(req: NextRequest) {
  const expected = internalToken("internal-copy-fees");
  const got = req.headers.get("x-internal-token") ?? "";
  if (!expected || got.length !== expected.length || !timingSafeEqual(Buffer.from(got), Buffer.from(expected))) {
    return new NextResponse(null, { status: 404 });
  }
  const db = await getDb();
  return NextResponse.json({ ok: true, ...(await settleDueFees(db)) });
}
