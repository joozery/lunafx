import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { summarizeMaster } from "@/lib/copyTrading";

/** Approved masters with their real track record, featured first then best 30-day ROI. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const list = await db.collection("copyMasters").find({ status: "active" }).toArray();
  const masters = await Promise.all(list.map((m) => summarizeMaster(db, m)));
  masters.sort((a, b) => Number(b.featured) - Number(a.featured) || b.roi30d - a.roi30d);
  return NextResponse.json({ success: true, masters });
}
