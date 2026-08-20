import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fromAccount, toAccount, amount } = body;

    if (!fromAccount || !toAccount) {
      return NextResponse.json({ error: "Source and destination accounts are required" }, { status: 400 });
    }
    if (fromAccount === toAccount) {
      return NextResponse.json({ error: "Source and destination accounts must be different" }, { status: 400 });
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const transactionId = `TRF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const db = await getDb();
    await db.collection("transactions").insertOne({
      userId: new ObjectId(session.userId),
      type: "transfer",
      amount: parseFloat(amount),
      fromAccount,
      toAccount,
      status: "pending",
      transactionId,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, transactionId });
  } catch (error) {
    console.error("[transfer]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
