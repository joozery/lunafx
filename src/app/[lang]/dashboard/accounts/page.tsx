import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { hasLocale } from "@/dictionaries";
import { AccountsClient, AccountData } from "@/components/dashboard/AccountsClient";

export default async function TradingAccountsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const session = await getSession();
  if (!session) redirect(`/${lang}/login`);

  const db = await getDb();
  const userIdObj = new ObjectId(session.userId);

  const rawAccounts = await db
    .collection("accounts")
    .find({ userId: userIdObj })
    .sort({ createdAt: -1 })
    .toArray();

  const accounts: AccountData[] = rawAccounts.map((a) => ({
    id: a._id.toString(),
    accountNumber: a.accountNumber || a._id.toString().slice(-7),
    platform: (a.platform || "MT5") as "MT4" | "MT5",
    type: (a.type || "Standard") as "Standard" | "ECN Pro" | "VIP Zero" | "Demo",
    server: a.server || (a.isDemo ? "LunaForex-Demo01" : "LunaForex-Real01"),
    currency: a.currency || "USD",
    balance: Number(a.balance) || 0,
    equity: Number(a.equity) || Number(a.balance) || 0,
    freeMargin: Number(a.freeMargin) || Number(a.balance) || 0,
    leverage: a.leverage || "1:500",
    isDemo: Boolean(a.isDemo),
    status: (a.status || "active") as "active" | "suspended" | "archived",
  }));

  return <AccountsClient lang={lang} initialAccounts={accounts} />;
}
