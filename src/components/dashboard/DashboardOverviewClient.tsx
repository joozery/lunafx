"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ShieldCheck, 
  ArrowDownToLine, 
  Plus, 
  TrendingUp, 
  Wallet, 
  DollarSign, 
  Activity, 
  Award, 
  Download, 
  HeadphonesIcon, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Globe,
  MoreVertical,
  Shield,
  Building2
} from "lucide-react";
import { TradingAccountCard, TradingAccount } from "./TradingAccountCard";
import { MarketWatchWidget } from "./MarketWatchWidget";
import { RecentActivityTable, TransactionItem } from "./RecentActivityTable";

interface DashboardOverviewClientProps {
  lang: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    status?: string;
    accountType?: string;
    createdAt?: string;
  };
  initialAccounts?: TradingAccount[];
  initialTransactions?: TransactionItem[];
}

export function DashboardOverviewClient({
  lang,
  user,
  initialAccounts = [],
  initialTransactions = []
}: DashboardOverviewClientProps) {
  const isth = lang === "th";
  const fullName = `${user.firstName} ${user.lastName}`;

  // User real accounts passed from MongoDB (no mock accounts)
  const [tradingAccounts, setTradingAccounts] = useState<TradingAccount[]>(initialAccounts);
  const [accountTab, setAccountTab] = useState<"live" | "demo">("live");

  // Calculate totals from live accounts
  const liveAccounts = tradingAccounts.filter((a) => !a.isDemo);
  const demoAccounts = tradingAccounts.filter((a) => a.isDemo);
  const activeTabAccounts = accountTab === "live" ? liveAccounts : demoAccounts;

  const totalBalance = liveAccounts.reduce((acc, cur) => acc + cur.balance, 0);
  const totalEquity = liveAccounts.reduce((acc, cur) => acc + cur.equity, 0);
  const freeMarginSum = liveAccounts.reduce((acc, cur) => acc + cur.freeMargin, 0);
  const floatingPnL = totalEquity - totalBalance;
  const thbRate = 35.25;
  const thbBalance = totalBalance * thbRate;

  // Real user transactions passed from MongoDB (no mock transactions)
  const displayTransactions: TransactionItem[] = initialTransactions;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">

      {/* 1. COMPACT HERO BANNER WITH CUSTOM COVER IMAGE */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 p-5 sm:p-6 text-white shadow-xl bg-slate-950">
        {/* Background Cover Image */}
        <Image
          src="/coveruser/cover.png"
          alt="Dashboard Cover"
          fill
          className="object-cover object-center pointer-events-none"
          priority
        />
        {/* Dark Gradient Overlay for optimal readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-900/60 pointer-events-none" />

        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#c6a87c]/25 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* User Info & Badges */}
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                {isth ? "ยืนยันตัวตนแล้ว (KYC)" : "KYC Verified"}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#c6a87c]/20 text-[#e6c99c] border border-[#c6a87c]/40">
                <Award className="w-3 h-3 text-[#c6a87c]" />
                {isth ? "VIP Standard" : "VIP Standard"}
              </span>

              <span className="text-[11px] text-slate-400 font-mono">
                ID: #{user.id.slice(-8).toUpperCase()}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isth ? `ยินดีต้อนรับกลับมา, ${fullName}` : `Welcome back, ${fullName}`}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isth
                ? "ศูนย์ควบคุมการเทรด จัดการบัญชีเทรด ฝาก-ถอนเงินฉับไว และดูสภาวะตลาด Real-Time"
                : "Your central trading portal. Manage accounts, instant deposits & withdrawals, and live market quotes."}
            </p>

            {/* Currency exchange rate indicator */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-slate-300">
              <Globe className="w-3 h-3 text-[#c6a87c]" />
              <span>1 USD ≈ {thbRate.toFixed(2)} THB</span>
              <span className="text-emerald-400 font-semibold">+0.12%</span>
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 self-stretch lg:self-auto min-w-[260px]">
            <Link
              href={`/${lang}/dashboard/funds`}
              className="flex-1 lg:flex-initial bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:from-[#d6b88b] hover:to-[#aa8a58] text-white font-bold px-5.5 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-[#c6a87c]/30 border border-[#f0d8b3]/40 flex items-center justify-center gap-1.5 group"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform text-amber-100" />
              <span>{isth ? "ฝากเงินทันที" : "Instant Deposit"}</span>
            </Link>

            <Link
              href={`/${lang}/dashboard/accounts`}
              className="flex-1 lg:flex-initial bg-white/10 hover:bg-white/20 text-white font-semibold px-4.5 py-2.5 rounded-xl text-xs border border-white/20 hover:border-[#c6a87c]/60 backdrop-blur-md transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#e6c99c]" />
              <span>{isth ? "เปิดบัญชีใหม่" : "New Account"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. REFINED METRICS CARDS GRID - Luxury White & Champagne Gold Gradient Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Balance Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fffdfa] via-[#fdfbf7] to-[#f4e6ce] border border-[#c6a87c]/60 shadow-sm p-4.5 transition-all duration-300 hover:shadow-md hover:border-[#c6a87c] group">
          {/* Top & Bottom Gold Flare Lights */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-28 h-[2px] bg-gradient-to-r from-transparent via-[#c6a87c] to-transparent blur-[0.5px] pointer-events-none" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#c6a87c]/30 rounded-full blur-md pointer-events-none" />

          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-28 h-[2px] bg-gradient-to-r from-transparent via-[#c6a87c] to-transparent blur-[0.5px] pointer-events-none" />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#c6a87c]/30 rounded-full blur-md pointer-events-none" />

          {/* Grid Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0e4d0_1px,transparent_1px),linear-gradient(to_bottom,#f0e4d0_1px,transparent_1px)] bg-[size:14px_14px] opacity-35 pointer-events-none" />

          {/* Golden Chart Wave Line SVG */}
          <svg className="absolute bottom-0 right-0 w-full h-24 text-[#c6a87c]/40 pointer-events-none stroke-current fill-none overflow-visible" viewBox="0 0 300 80">
            <path d="M0,75 Q40,70 70,72 T140,58 T210,48 T270,25 T300,8" strokeWidth="2" strokeLinecap="round" />
            <path d="M0,75 Q40,70 70,72 T140,58 T210,48 T270,25 T300,8 L300,80 L0,80 Z" fill="url(#goldGradientLight1)" opacity="0.2" />
            <defs>
              <linearGradient id="goldGradientLight1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c6a87c" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#c6a87c" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative z-10 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c6a87c] to-[#997a49] text-white flex items-center justify-center shadow-xs border border-[#e6cb9c]/50">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium leading-none">
                  {isth ? "ยอดเงินรวม" : "TOTAL BALANCE"}
                </p>
                <p className="text-[11px] font-extrabold text-[#94723e] tracking-wider uppercase font-mono mt-0.5">
                  BALANCE
                </p>
              </div>
            </div>

            <div className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </div>
          </div>

          <h3 className="relative z-10 text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>

          <p className="relative z-10 text-[11px] text-[#8a6a3b] mt-1 font-mono font-bold">
            ≈ ฿{thbBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} THB
          </p>

          <div className="relative z-10 mt-3 pt-2.5 border-t border-[#e6cb9c]/60 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-3 h-3" />
              </div>
              <div className="flex flex-col">
                <span className="text-emerald-700 font-bold text-[11px]">+0.00%</span>
                <span className="text-[9px] text-slate-500 leading-none">{isth ? "เดือนนี้" : "this month"}</span>
              </div>
            </div>
            <span className="text-[#8a6a3b] bg-white/80 border border-[#c6a87c]/40 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold shadow-2xs">
              Sync
            </span>
          </div>
        </div>

        {/* Card 2: Total Equity Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fffdfa] via-[#fdfbf7] to-[#eaf7f1] border border-emerald-300/80 shadow-sm p-4.5 transition-all duration-300 hover:border-emerald-400 group">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0f2eb_1px,transparent_1px),linear-gradient(to_bottom,#e0f2eb_1px,transparent_1px)] bg-[size:14px_14px] opacity-30 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs border border-emerald-400/50">
                <DollarSign className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium leading-none">
                  {isth ? "มูลค่าสุทธิ" : "TOTAL EQUITY"}
                </p>
                <p className="text-[11px] font-extrabold text-emerald-800 tracking-wider uppercase font-mono mt-0.5">
                  EQUITY
                </p>
              </div>
            </div>

            <div className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </div>
          </div>

          <h3 className="relative z-10 text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight">
            ${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>

          <p className="relative z-10 text-[11px] text-slate-600 mt-1 font-mono">
            P&L: <span className={floatingPnL >= 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
              {floatingPnL >= 0 ? `+$${floatingPnL.toFixed(2)}` : `-$${Math.abs(floatingPnL).toFixed(2)}`}
            </span>
          </p>

          <div className="relative z-10 mt-3 pt-2.5 border-t border-emerald-200/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <Shield className="w-3 h-3 text-emerald-700" />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 leading-none">{isth ? "สถานะพอร์ต" : "Health"}</p>
                <p className="text-emerald-700 font-bold text-[11px] leading-tight">{isth ? "ดีมาก (Strong)" : "Strong"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Free Margin Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fffdfa] via-[#fdfbf7] to-[#f4e6ce] border border-[#c6a87c]/60 shadow-sm p-4.5 transition-all duration-300 hover:border-[#c6a87c] group">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0e4d0_1px,transparent_1px),linear-gradient(to_bottom,#f0e4d0_1px,transparent_1px)] bg-[size:14px_14px] opacity-30 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isth ? "หลักประกันคงเหลือ" : "Free Margin"}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#c6a87c]/20 border border-[#c6a87c]/40 text-[#a38458] flex items-center justify-center shadow-2xs">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <h3 className="relative z-10 text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            ${freeMarginSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>

          <div className="relative z-10 mt-2">
            <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden border border-amber-200">
              <div className="bg-[#c6a87c] h-full rounded-full shadow-2xs" style={{ width: freeMarginSum > 0 ? "100%" : "0%" }} />
            </div>
          </div>

          <div className="relative z-10 mt-3 pt-2.5 border-t border-[#e6cb9c]/60 flex items-center justify-between text-[11px] text-slate-600 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#c6a87c]" />
              <span>{isth ? "ใช้งาน 0.0%" : "Used 0.0%"}</span>
            </span>
            <span className="text-slate-800 font-semibold">{isth ? "คงเหลือ 100.0%" : "Free 100.0%"}</span>
          </div>
        </div>

        {/* Card 4: Leverage & Accounts */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fffdfa] via-[#fdfbf7] to-[#f4e6ce] border border-[#c6a87c]/60 shadow-sm p-4.5 transition-all duration-300 hover:border-[#c6a87c] group">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0e4d0_1px,transparent_1px),linear-gradient(to_bottom,#f0e4d0_1px,transparent_1px)] bg-[size:14px_14px] opacity-30 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isth ? "เลเวอเรจ & บัญชี" : "Leverage & Accounts"}
            </span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-2xs">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <h3 className="relative z-10 text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            1:1000
          </h3>

          <p className="relative z-10 text-[11px] text-purple-700 font-bold mt-1">
            {isth
              ? `${liveAccounts.length} บัญชีจริง (${demoAccounts.length} Demo)`
              : `${liveAccounts.length} Live (${demoAccounts.length} Demo)`}
          </p>

          <div className="relative z-10 mt-3 pt-2.5 border-t border-[#e6cb9c]/60 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-[#c6a87c]" />
              <span>{isth ? "ประเภทสเปรด" : "Spread"}</span>
            </span>
            <span className="text-[#94723e] font-extrabold">{isth ? "เริ่ม 0.0 Pips" : "From 0.0 Pips"}</span>
          </div>
        </div>

      </div>

      {/* 3. MAIN WORKSPACE GRID: 2 COLUMNS (LEFT 2/3, RIGHT 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TRADING ACCOUNTS SECTION */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {isth ? "บัญชีเทรดของคุณ" : "Trading Accounts"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isth ? "จัดการและฝากเงินเข้าบัญชี MetaTrader 4 / MetaTrader 5" : "Manage and fund your MetaTrader 4 & 5 accounts"}
                </p>
              </div>

              {/* Live / Demo Switcher */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setAccountTab("live")}
                    className={`px-3 py-1 rounded-md transition-all ${
                      accountTab === "live"
                        ? "bg-white text-gray-900 shadow-2xs font-bold"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {isth ? "บัญชีจริง" : "Live"} ({liveAccounts.length})
                  </button>
                  <button
                    onClick={() => setAccountTab("demo")}
                    className={`px-3 py-1 rounded-md transition-all ${
                      accountTab === "demo"
                        ? "bg-white text-gray-900 shadow-2xs font-bold"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {isth ? "ทดลอง (Demo)" : "Demo"} ({demoAccounts.length})
                  </button>
                </div>

                <Link
                  href={`/${lang}/dashboard/accounts`}
                  className="bg-[#c6a87c] hover:bg-[#b0936b] text-white p-1.5 rounded-lg transition-all shadow-2xs"
                  title={isth ? "เปิดบัญชีเทรดใหม่" : "Open new account"}
                >
                  <Plus className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Account Cards Grid or Empty State */}
            {activeTabAccounts.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-2xs">
                  <TrendingUp className="w-6 h-6 text-[#c6a87c]" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  {isth
                    ? accountTab === "live" ? "ยังไม่มีบัญชีเทรดจริง" : "ยังไม่มีบัญชีทดลอง (Demo)"
                    : accountTab === "live" ? "No Live Trading Accounts" : "No Demo Accounts"}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4">
                  {isth
                    ? "เปิดบัญชีเทรดเพื่อเริ่มต้นการเข้าถึงตลาดการเงินระดับโลกกับ Lunaforex"
                    : "Open a trading account to access global markets with Lunaforex."}
                </p>
                <Link
                  href={`/${lang}/dashboard/accounts`}
                  className="bg-[#c6a87c] hover:bg-[#b0936b] text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isth ? "เปิดบัญชีเทรดเลย" : "Open Trading Account"}</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {activeTabAccounts.map((account) => (
                  <TradingAccountCard key={account.id} account={account} lang={lang} />
                ))}

                {/* Add New Account Card */}
                <Link
                  href={`/${lang}/dashboard/accounts`}
                  className="border-2 border-dashed border-gray-200 hover:border-[#c6a87c] bg-slate-50/50 hover:bg-[#fef9f2]/40 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 group min-h-[170px]"
                >
                  <div className="w-10 h-10 rounded-full bg-white group-hover:bg-[#c6a87c] text-gray-400 group-hover:text-white border border-gray-200 group-hover:border-[#c6a87c] flex items-center justify-center mb-2 shadow-2xs transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <p className="font-bold text-xs text-gray-900 group-hover:text-[#c6a87c] transition-colors">
                    {isth ? "เปิดบัญชีเทรดใหม่" : "Create New Trading Account"}
                  </p>
                  <p className="text-[11px] text-gray-400 max-w-xs mt-0.5">
                    {isth ? "รองรับ MT4, MT5 สเปรดต่ำ เลเวอเรจสูงสุด 1:1000" : "Supports MT4 & MT5 with tight spreads"}
                  </p>
                </Link>
              </div>
            )}
          </div>

          {/* RECENT ACTIVITY TABLE */}
          <RecentActivityTable transactions={displayTransactions} lang={lang} />

        </div>

        {/* RIGHT COLUMN (1/3): WIDGETS & SIDEBAR TOOLS */}
        <div className="space-y-6">
          
          {/* MARKET WATCH WIDGET */}
          <MarketWatchWidget lang={lang} />

          {/* PROMOTION / DEPOSIT BONUS BANNER WITH CUSTOM IMAGE */}
          <div className="relative overflow-hidden rounded-xl border border-amber-500/30 p-5 text-white shadow-md bg-amber-950">
            {/* Background Image */}
            <Image
              src="/promotion.png"
              alt="Promotion Cover"
              fill
              className="object-cover object-center pointer-events-none"
            />
            {/* Subtle Gradient overlay for crisp readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-black/40 pointer-events-none" />

            <div className="relative z-10 space-y-2.5">
              <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                {isth ? "โปรโมชั่นต้อนรับ" : "Welcome Bonus"}
              </div>

              <h4 className="text-base font-extrabold leading-snug">
                {isth ? "รับโบนัสเงินฝาก 100% สูงสุด $500" : "100% Deposit Bonus Up To $500"}
              </h4>

              <p className="text-[11px] text-amber-100 leading-relaxed">
                {isth
                  ? "เพิ่มกำลังซื้อสำหรับการเทรดของคุณ รับโบนัสทันทีทุกยอดฝากเงินครั้งแรก"
                  : "Boost your trading margin instantly on your first deposit with Lunaforex."}
              </p>

              <Link
                href={`/${lang}/dashboard/promotions`}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-amber-50 text-amber-950 font-bold px-3.5 py-2 rounded-lg text-xs transition-all shadow-sm mt-0.5"
              >
                <span>{isth ? "รับโบนัสเลย" : "Claim Bonus Now"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* DOWNLOAD PLATFORMS WIDGET */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                {isth ? "ดาวน์โหลดแพลตฟอร์ม" : "Trading Platforms"}
              </h4>
              <Download className="w-3.5 h-3.5 text-gray-400" />
            </div>

            <div className="space-y-2">
              {[
                { name: "MetaTrader 5 (MT5)", type: "Desktop / Windows & Mac", isHot: true, href: `/${lang}/dashboard/platforms` },
                { name: "MetaTrader 4 (MT4)", type: "Desktop & Mobile App", isHot: false, href: `/${lang}/dashboard/platforms` },
                { name: "Luna WebTrader", type: "Trade directly in Browser", isHot: false, href: `/${lang}/dashboard/platforms` },
              ].map((plat, idx) => (
                <Link
                  key={idx}
                  href={plat.href}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-gray-100 text-gray-700 group-hover:bg-[#c6a87c] group-hover:text-white flex items-center justify-center font-bold text-[11px] transition-colors">
                      {plat.name.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-900 group-hover:text-[#c6a87c] transition-colors">
                          {plat.name}
                        </span>
                        {plat.isHot && (
                          <span className="text-[8px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">HOT</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">{plat.type}</p>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-800 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* 24/7 SUPPORT & LIVE ASSISTANCE - DEEP BLACK STYLING */}
          <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 space-y-3 relative overflow-hidden shadow-md">
            {/* Subtle glow background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c6a87c]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-[#c6a87c] border border-slate-800 shadow-2xs">
                <HeadphonesIcon className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs sm:text-sm text-white">
                  {isth ? "ช่วยเหลือตลอด 24/7" : "24/7 Live Support"}
                </h5>
                <p className="text-[10px] text-slate-400">
                  {isth ? "ทีมงานผู้เชี่ยวชาญพร้อมดูแลคุณ" : "Multilingual expert assistance"}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed relative z-10">
              {isth
                ? "มีข้อสงสัยเกี่ยวกับการฝาก-ถอน หรือการใช้แพลตฟอร์ม? แชทสดกับเจ้าหน้าที่ภาษาไทยได้ทันที"
                : "Questions about funding, account settings, or platforms? Chat with our team now."}
            </p>

            <Link
              href={`/${lang}/dashboard/support`}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700/80 transition-all shadow-xs relative z-10 group"
            >
              <span>{isth ? "เริ่มแชทสด" : "Start Live Chat"}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
