import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { getBonusSetting, getBonusStatus } from "@/lib/bonus";

/** Current deposit-bonus offer, plus turnover / withdrawal status when ?accountNumber= is given. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const s = await getBonusSetting(db);
  const offer = s.enabled
    ? {
        minDepositUsd: s.minDepositUsd,
        bonusType: s.bonusType,
        bonusValue: s.bonusValue,
        maxBonusUsd: s.maxBonusUsd,
        lotsPerBonusUsd: s.lotsPerBonusUsd,
        maxWithdrawUsd: s.maxWithdrawUsd,
        firstDepositOnly: s.firstDepositOnly,
      }
    : null;

  const accountNumber = req.nextUrl.searchParams.get("accountNumber");
  if (!accountNumber) return NextResponse.json({ offer, status: null });

  const account = await db.collection("accounts").findOne({ accountNumber, userId: new ObjectId(session.userId) });
  if (!account) return NextResponse.json({ offer, status: null });

  return NextResponse.json({ offer, status: await getBonusStatus(db, account) });
}
