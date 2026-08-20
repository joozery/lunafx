"use client";

import Link from "next/link";
import { 
  Server, 
  CreditCard, 
  TrendingUp, 
  Sliders
} from "lucide-react";

export interface TradingAccount {
  id: string;
  accountNumber: string;
  platform: "MT4" | "MT5";
  type: "Standard" | "ECN Pro" | "Demo" | "VIP Zero";
  server: string;
  currency: string;
  balance: number;
  equity: number;
  freeMargin: number;
  leverage: string;
  isDemo: boolean;
  status: "active" | "suspended" | "archived";
}

export function TradingAccountCard({ 
  account, 
  lang 
}: { 
  account: TradingAccount; 
  lang: string 
}) {
  const isth = lang === "th";

  return (
    <div className="group relative bg-white border border-gray-200/90 hover:border-[#c6a87c]/60 rounded-xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between">
      {/* Subtle Glow background on hover */}
      <div className="absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br from-[#c6a87c]/10 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {/* Platform Badge Icon */}
          <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-black text-[11px] leading-none shadow-2xs border ${
            account.isDemo 
              ? "bg-slate-100 text-slate-700 border-slate-200" 
              : "bg-gradient-to-br from-amber-500 to-[#c6a87c] text-white border-amber-400/40"
          }`}>
            <span>{account.platform}</span>
            <span className="text-[8px] font-normal opacity-90">{account.isDemo ? "DEMO" : "LIVE"}</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-gray-900 text-sm group-hover:text-[#c6a87c] transition-colors">
                #{account.accountNumber}
              </span>
              <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-full border ${
                account.isDemo
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {account.type}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
              <Server className="w-3 h-3 text-gray-400" />
              <span>{account.server}</span>
              <span>·</span>
              <span>{account.leverage}</span>
            </div>
          </div>
        </div>

        {/* Action Menu button */}
        <button 
          className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors"
          title="Account Settings"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Financial Details Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5 py-2.5 border-y border-gray-100 my-1.5">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            {isth ? "ยอดเงิน (Balance)" : "Balance"}
          </p>
          <p className="text-base font-bold text-gray-900 font-mono tracking-tight mt-0.5">
            ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            {isth ? "มูลค่าสุทธิ (Equity)" : "Equity"}
          </p>
          <p className="text-base font-bold text-emerald-600 font-mono tracking-tight mt-0.5">
            ${account.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Bottom Actions Row */}
      <div className="relative z-10 pt-2 flex items-center justify-between gap-2">
        <Link
          href={`/${lang}/dashboard/funds?account=${account.accountNumber}`}
          className="flex-1 bg-[#c6a87c] hover:bg-[#b0936b] text-white font-semibold py-1.5 px-2.5 rounded-lg text-[11px] text-center transition-all shadow-2xs flex items-center justify-center gap-1"
        >
          <CreditCard className="w-3 h-3" />
          <span>{isth ? "ฝากเงิน" : "Deposit"}</span>
        </Link>

        <Link
          href={`/${lang}/dashboard/platforms`}
          className="flex-1 bg-white hover:bg-slate-50 text-gray-700 hover:text-gray-900 border border-gray-300 font-semibold py-1.5 px-2.5 rounded-lg text-[11px] text-center transition-all shadow-2xs flex items-center justify-center gap-1"
        >
          <TrendingUp className="w-3 h-3 text-gray-500" />
          <span>{isth ? "เปิดเทรด" : "Trade"}</span>
        </Link>
      </div>
    </div>
  );
}
