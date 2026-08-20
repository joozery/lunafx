"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  XCircle
} from "lucide-react";

export interface TransactionItem {
  id: string;
  type: "deposit" | "withdrawal" | "transfer";
  amount: number;
  currency: string;
  method?: string;
  fromAccount?: string;
  toAccount?: string;
  status: "completed" | "pending" | "failed";
  transactionId: string;
  createdAt: string;
}

const METHOD_NAMES: Record<string, string> = {
  promptpay: "Thai QR PromptPay",
  bank_transfer: "Local Bank Wire",
  crypto: "USDT TRC20 Crypto",
  card: "Credit / Debit Card",
  internal: "Internal Account Transfer",
};

export function RecentActivityTable({ 
  transactions, 
  lang 
}: { 
  transactions: TransactionItem[]; 
  lang: string 
}) {
  const isth = lang === "th";
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal" | "transfer">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  return (
    <div className="bg-white border border-gray-200/80 rounded-xl p-4 sm:p-5 shadow-2xs">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            {isth ? "ประวัติการทำธุรกรรมล่าสุด" : "Recent Activity"}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isth ? "รายการฝาก ถอน และโอนเงินล่าสุดของคุณ" : "Latest deposits, withdrawals, and internal transfers"}
          </p>
        </div>

        {/* Filter Controls & View All link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100/80 p-0.5 rounded-lg text-[11px] font-medium">
            {(["all", "deposit", "withdrawal", "transfer"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                  filter === f
                    ? "bg-white text-gray-900 font-bold shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {f === "all"
                  ? (isth ? "ทั้งหมด" : "All")
                  : f === "deposit"
                  ? (isth ? "ฝากเงิน" : "Deposits")
                  : f === "withdrawal"
                  ? (isth ? "ถอนเงิน" : "Withdrawals")
                  : (isth ? "โอนเงิน" : "Transfers")}
              </button>
            ))}
          </div>

          <Link
            href={`/${lang}/dashboard/history`}
            className="text-[11px] font-semibold text-[#c6a87c] hover:text-[#b0936b] flex items-center gap-0.5 transition-colors hidden sm:flex ml-1"
          >
            <span>{isth ? "ดูทั้งหมด" : "View History"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2 border border-slate-200">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold text-gray-800">
            {isth ? "ยังไม่มีรายการธุรกรรม" : "No recent activity"}
          </p>
          <p className="text-[11px] text-gray-400 max-w-xs mt-0.5">
            {isth
              ? "การทำรายการฝากเงินหรือถอนเงินจะแสดงขึ้นที่นี่อัตโนมัติ"
              : "Your financial activity will appear here as soon as you process a transaction."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 overflow-x-auto">
          {filtered.slice(0, 5).map((txn) => {
            const isDeposit = txn.type === "deposit";
            const isWithdrawal = txn.type === "withdrawal";
            const isTransfer = txn.type === "transfer";

            return (
              <div
                key={txn.id}
                className="flex items-center justify-between py-2.5 px-1 hover:bg-slate-50/80 rounded-lg transition-colors min-w-[450px] sm:min-w-0"
              >
                {/* Type Icon & Details */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-2xs ${
                      isDeposit
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                        : isWithdrawal
                        ? "bg-rose-50 text-rose-600 border-rose-200/60"
                        : "bg-blue-50 text-blue-600 border-blue-200/60"
                    }`}
                  >
                    {isDeposit && <ArrowDownToLine className="w-3.5 h-3.5" />}
                    {isWithdrawal && <ArrowUpFromLine className="w-3.5 h-3.5" />}
                    {isTransfer && <ArrowLeftRight className="w-3.5 h-3.5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-gray-900">
                        {isDeposit
                          ? isth ? "ฝากเงิน" : "Deposit"
                          : isWithdrawal
                          ? isth ? "ถอนเงิน" : "Withdrawal"
                          : isth ? "โอนเงินระหว่างบัญชี" : "Internal Transfer"}
                      </span>
                      {txn.method && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          · {METHOD_NAMES[txn.method] || txn.method}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {txn.transactionId} · {mounted ? new Date(txn.createdAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : ""}
                    </p>
                  </div>
                </div>

                {/* Amount & Status Badge */}
                <div className="text-right">
                  <p
                    className={`font-mono font-bold text-xs ${
                      isDeposit
                        ? "text-emerald-600"
                        : isWithdrawal
                        ? "text-rose-600"
                        : "text-gray-900"
                    }`}
                  >
                    {isDeposit ? "+" : isWithdrawal ? "-" : ""}
                    ${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>

                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {txn.status === "completed" && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded-full">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        {isth ? "สำเร็จ" : "Completed"}
                      </span>
                    )}
                    {txn.status === "pending" && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-full">
                        <Clock className="w-2.5 h-2.5 text-amber-600 animate-spin" />
                        {isth ? "รอดำเนินการ" : "Pending"}
                      </span>
                    )}
                    {txn.status === "failed" && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.2 rounded-full">
                        <XCircle className="w-2.5 h-2.5 text-rose-600" />
                        {isth ? "ล้มเหลว" : "Failed"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
