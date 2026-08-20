import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const userIdObj = new ObjectId(session.userId);

    const accounts = await db
      .collection("accounts")
      .find({ userId: userIdObj })
      .sort({ createdAt: -1 })
      .toArray();

    const formatted = accounts.map((a) => ({
      id: a._id.toString(),
      accountNumber: a.accountNumber || a._id.toString().slice(-7),
      platform: a.platform || "MT5",
      type: a.type || "Standard",
      server: a.server || "LunaForex-Real01",
      currency: a.currency || "USD",
      balance: Number(a.balance) || 0,
      equity: Number(a.equity) || Number(a.balance) || 0,
      freeMargin: Number(a.freeMargin) || Number(a.balance) || 0,
      leverage: a.leverage || "1:500",
      isDemo: Boolean(a.isDemo),
      status: a.status || "active",
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ accounts: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { platform, type, leverage, isDemo } = body;

    const validPlatform = platform === "MT4" ? "MT4" : "MT5";
    const validLeverage = leverage || "1:500";
    const validIsDemo = Boolean(isDemo);
    const validAccountType = type || (validIsDemo ? "Demo" : "Standard");

    // Generate random 7-digit account number (e.g., 8830129)
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const prefix = validIsDemo ? "99" : "88";
    const accountNumber = `${prefix}${randomDigits}`;

    const db = await getDb();
    const userIdObj = new ObjectId(session.userId);

    const initialBalance = validIsDemo ? 10000 : 0;

    const newAccount = {
      userId: userIdObj,
      accountNumber,
      platform: validPlatform,
      type: validAccountType,
      server: validIsDemo ? "LunaForex-Demo01" : "LunaForex-Real01",
      currency: "USD",
      balance: initialBalance,
      equity: initialBalance,
      freeMargin: initialBalance,
      leverage: validLeverage,
      isDemo: validIsDemo,
      status: "active",
      createdAt: new Date(),
    };

    const result = await db.collection("accounts").insertOne(newAccount);

    return NextResponse.json({
      success: true,
      account: {
        id: result.insertedId.toString(),
        ...newAccount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
