import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { hasLocale } from "@/dictionaries";
import { DashboardOverviewClient } from "@/components/dashboard/DashboardOverviewClient";

export default async function DashboardOverviewPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const session = await getSession();
  if (!session) redirect(`/${lang}/login`);

  const db = await getDb();
  const userIdObj = new ObjectId(session.userId);

  const user = await db.collection("users").findOne(
    { _id: userIdObj },
    { projection: { passwordHash: 0 } }
  );

  if (!user) redirect(`/${lang}/login`);

  // Fetch real user trading accounts from MongoDB
  const rawAccounts = await db
    .collection("accounts")
    .find({ userId: userIdObj })
    .toArray();

  const accounts = rawAccounts.map((a) => ({
    id: a._id.toString(),
    accountNumber: a.accountNumber || a._id.toString().slice(-7),
    platform: (a.platform || "MT5") as "MT4" | "MT5",
    type: (a.type || "Standard") as "Standard" | "ECN Pro" | "Demo" | "VIP Zero",
    server: a.server || "LunaForex-Real01",
    currency: "USD",
    balance: Number(a.balance) || 0,
    equity: Number(a.equity) || Number(a.balance) || 0,
    freeMargin: Number(a.freeMargin) || Number(a.balance) || 0,
    leverage: a.leverage || "1:500",
    isDemo: Boolean(a.isDemo),
    status: (a.status || "active") as "active" | "suspended" | "archived",
  }));

  // Fetch real user transactions from MongoDB
  const rawTxns = await db
    .collection("transactions")
    .find({ userId: userIdObj })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  const transactions = rawTxns.map((t) => ({
    id: t._id.toString(),
    type: t.type as "deposit" | "withdrawal" | "transfer",
    amount: Number(t.amount) || 0,
    currency: "USD",
    method: t.method,
    fromAccount: t.fromAccount,
    toAccount: t.toAccount,
    status: (t.status || "completed") as "completed" | "pending" | "failed",
    transactionId: t.transactionId || `TXN-${t._id.toString().slice(-6).toUpperCase()}`,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
  }));

  const cleanUser = {
    id: user._id.toString(),
    firstName: user.firstName || "Trader",
    lastName: user.lastName || "",
    email: user.email || "",
    status: user.status || "active",
    accountType: user.accountType || "Standard",
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
  };

  return (
    <DashboardOverviewClient
      lang={lang}
      user={cleanUser}
      initialAccounts={accounts}
      initialTransactions={transactions}
    />
  );
}
