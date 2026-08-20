import Link from "next/link";
import { AlertCircle, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { StatusPill } from "./StatusPill";

export type RecentTransaction = {
  _id: string;
  type?: string;
  transactionId?: string;
  amount?: number;
  status?: string;
  createdAt?: string | Date;
};

const TYPE_LABELS: Record<string, string> = {
  deposit:    "ฝากเงิน",
  withdrawal: "ถอนเงิน",
  transfer:   "โอนเงิน",
};

function formatDate(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentTransactionsTable({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900">ธุรกรรมล่าสุด</h3>
        </div>
        <Link
          href="/admin/transactions"
          className="text-xs font-semibold text-[#c6a87c] hover:text-[#a38458] transition-colors"
        >
          ดูทั้งหมด →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-gray-300">
          <AlertCircle className="w-5 h-5" />
          <p className="text-xs text-gray-400">ยังไม่มีข้อมูล</p>
        </div>
      ) : (
        <div>
          {transactions.map((t) => {
            const isDeposit    = t.type === "deposit";
            const isWithdrawal = t.type === "withdrawal";

            const iconBg = isDeposit
              ? "bg-emerald-50 text-emerald-600"
              : isWithdrawal
              ? "bg-red-50 text-red-500"
              : "bg-blue-50 text-blue-500";

            const amountColor = isDeposit
              ? "text-emerald-600"
              : isWithdrawal
              ? "text-red-500"
              : "text-blue-500";

            const amountSign = isDeposit ? "+" : isWithdrawal ? "−" : "";

            return (
              <div
                key={t._id}
                className="flex items-center gap-3.5 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                  {isDeposit    ? <ArrowDownLeft  className="w-4 h-4" /> :
                   isWithdrawal ? <ArrowUpRight   className="w-4 h-4" /> :
                                  <ArrowLeftRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {TYPE_LABELS[t.type ?? ""] ?? t.type}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {t.transactionId} · {formatDate(t.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className={`text-sm font-bold tabular-nums ${amountColor}`}>
                    {amountSign}${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <StatusPill status={t.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
