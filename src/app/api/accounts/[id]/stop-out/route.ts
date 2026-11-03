import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { STOP_OUT_MAX, STOP_OUT_MIN } from "@/lib/risk";

/** Lets the account owner choose their stop-out level, within [STOP_OUT_MIN, STOP_OUT_MAX]. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const level = Number(body?.stopOutLevel);
  if (!Number.isInteger(level) || level < STOP_OUT_MIN || level > STOP_OUT_MAX) {
    return NextResponse.json(
      { error: `Stop-out level must be a whole number between ${STOP_OUT_MIN} and ${STOP_OUT_MAX}` },
      { status: 400 },
    );
  }

  const db = await getDb();
  const result = await db
    .collection("accounts")
    .updateOne({ _id: new ObjectId(id), userId: new ObjectId(session.userId) }, { $set: { stopOutLevel: level } });
  if (result.matchedCount === 0) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  return NextResponse.json({ ok: true, stopOutLevel: level });
}
