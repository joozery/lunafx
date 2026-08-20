import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const transactions = await db
    .collection("transactions")
    .find({ userId: new ObjectId(session.userId) })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      ...t,
      _id: t._id.toString(),
      userId: t.userId?.toString(),
    })),
  });
}
