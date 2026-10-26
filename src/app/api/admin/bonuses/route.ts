import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getBonusStatus } from "@/lib/bonus";

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = await getDb();
  const docs = await db.collection("bonuses").find().sort({ createdAt: -1 }).limit(100).toArray();

  // Turnover progress for accounts that still have an active bonus
  const progress = new Map<string, number>();
  for (const accountId of new Set(docs.filter((b) => b.status === "active").map((b) => b.accountId as string))) {
    if (!ObjectId.isValid(accountId)) continue;
    const account = await db.collection("accounts").findOne({ _id: new ObjectId(accountId) });
    if (!account) continue;
    const st = await getBonusStatus(db, account);
    if (st.active) progress.set(accountId, st.active.tradedLots);
  }
  return NextResponse.json({
    bonuses: docs.map((b) => ({
      id: b._id.toString(),
      accountNumber: b.accountNumber,
      depositUsd: b.depositUsd,
      bonusUsd: b.bonusUsd,
      requiredLots: b.requiredLots,
      tradedLots: b.status === "active" ? progress.get(b.accountId) ?? 0 : null,
      maxWithdrawUsd: b.maxWithdrawUsd ?? 0,
      status: b.status,
      createdAt: b.createdAt,
      completedAt: b.completedAt ?? null,
    })),
  });
}
