import { hasLocale, type Locale } from "@/dictionaries";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { History, Download, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from "lucide-react";

function formatDate(date: Date, lang: string) {
  return new Date(date).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const METHOD_LABELS: Record<string, string> = {
  card: "Credit / Debit Card",
  bank: "Bank Transfer",
  wallet: "E-Wallet",
  crypto: "Cryptocurrency",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border border-yellow-100",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  failed: "bg-red-50 text-red-700 border border-red-100",
};

export default async function HistoryPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const isth = (lang as Locale) === "th";

  const session = await getSession();
  if (!session) redirect(`/${lang}/login`);

  const db = await getDb();
  type Transaction = {
    _id: string;
    userId: string;
    type: "deposit" | "withdrawal" | "transfer";
    amount: number;
    method?: string;
    fromAccount?: string;
    toAccount?: string;
    status: "pending" | "completed" | "failed";
    transactionId: string;
    createdAt: string;
  };

  const rawTxns = await db
    .collection("transactions")
    .find({ userId: new ObjectId(session.userId) })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const transactions: Transaction[] = rawTxns.map((t) => ({
    ...t,
    _id: t._id.toString(),
    userId: t.userId.toString(),
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
  })) as Transaction[];

  const funds = transactions.filter((t) => t.type === "deposit" || t.type === "withdrawal");
  const transfers = transactions.filter((t) => t.type === "transfer");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isth ? "ประวัติธุรกรรม" : "Transaction History"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isth ? "ดูประวัติการทำธุรกรรม ฝาก ถอน และโอนเงินของคุณ" : "View your deposit, withdrawal, and transfer history."}
          </p>
        </div>
        <button className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2.5 rounded-lg text-sm border border-gray-300 transition-colors flex items-center gap-2 shadow-sm">
          <Download className="w-4 h-4 text-gray-500" />
          {isth ? "ส่งออก CSV" : "Export CSV"}
        </button>
      </div>

      {/* Funds Tab */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-semibold text-gray-900">{isth ? "การฝาก / ถอน" : "Deposits & Withdrawals"}</h3>
        </div>

        {funds.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center py-20">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
              <History className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">{isth ? "ไม่พบประวัติ" : "No Records Found"}</p>
            <p className="text-sm text-gray-500 max-w-xs">
              {isth ? "รายการฝาก/ถอนเงินของคุณจะแสดงที่นี่" : "Your deposit and withdrawal records will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {funds.map((t) => (
              <div key={t._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.type === "deposit" ? "bg-emerald-50" : "bg-red-50"}`}>
                    {t.type === "deposit"
                      ? <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                      : <ArrowUpFromLine className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t.type === "deposit" ? (isth ? "ฝากเงิน" : "Deposit") : (isth ? "ถอนเงิน" : "Withdrawal")}
                      {t.method && <span className="ml-2 text-xs font-normal text-gray-400">· {METHOD_LABELS[t.method] ?? t.method}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.transactionId} · {formatDate(new Date(t.createdAt), lang)}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`text-sm font-bold ${t.type === "deposit" ? "text-emerald-600" : "text-red-500"}`}>
                    {t.type === "deposit" ? "+" : "−"}${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLE[t.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {isth
                      ? t.status === "pending" ? "รอดำเนินการ" : t.status === "completed" ? "สำเร็จ" : "ล้มเหลว"
                      : t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transfers Tab */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-semibold text-gray-900">{isth ? "โอนเงินระหว่างบัญชี" : "Internal Transfers"}</h3>
        </div>

        {transfers.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center py-16">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
              <ArrowLeftRight className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">{isth ? "ไม่พบประวัติการโอน" : "No Transfer Records"}</p>
            <p className="text-sm text-gray-500 max-w-xs">
              {isth ? "ประวัติการโอนเงินระหว่างบัญชีจะแสดงที่นี่" : "Your internal transfer records will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transfers.map((t) => (
              <div key={t._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                    <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {isth ? "โอนเงินระหว่างบัญชี" : "Internal Transfer"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.transactionId} · {formatDate(new Date(t.createdAt), lang)}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-sm font-bold text-gray-900">
                    ${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLE[t.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {isth
                      ? t.status === "pending" ? "รอดำเนินการ" : t.status === "completed" ? "สำเร็จ" : "ล้มเหลว"
                      : t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
