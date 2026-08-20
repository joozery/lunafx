"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface PairRate {
  symbol: string;
  name: string;
  category: "forex" | "crypto" | "commodities";
  bid: number;
  ask: number;
  spread: number;
  change24h: number;
  digits: number;
}

const INITIAL_PAIRS: PairRate[] = [
  {
    symbol: "XAU/USD",
    name: "Gold / US Dollar",
    category: "commodities",
    bid: 2746.50,
    ask: 2746.70,
    spread: 0.20,
    change24h: 1.42,
    digits: 2,
  },
  {
    symbol: "EUR/USD",
    name: "Euro / US Dollar",
    category: "forex",
    bid: 1.08505,
    ask: 1.08513,
    spread: 0.8,
    change24h: -0.15,
    digits: 5,
  },
  {
    symbol: "GBP/USD",
    name: "Great Britain Pound / USD",
    category: "forex",
    bid: 1.29910,
    ask: 1.29922,
    spread: 1.2,
    change24h: 0.53,
    digits: 5,
  },
  {
    symbol: "BTC/USD",
    name: "Bitcoin / US Dollar",
    category: "crypto",
    bid: 95049.84,
    ask: 95064.34,
    spread: 14.5,
    change24h: 4.07,
    digits: 2,
  },
  {
    symbol: "USD/JPY",
    name: "US Dollar / Japanese Yen",
    category: "forex",
    bid: 154.499,
    ask: 154.511,
    spread: 1.2,
    change24h: -0.61,
    digits: 3,
  },
];

export function MarketWatchWidget({ lang }: { lang: string }) {
  const isth = lang === "th";
  const [mounted, setMounted] = useState(false);
  const [pairs, setPairs] = useState<PairRate[]>(INITIAL_PAIRS);
  const [activeTab, setActiveTab] = useState<"all" | "forex" | "commodities" | "crypto">("all");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Handle client-side mount & simulate real-time price updates smoothly
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setPairs((prevPairs) =>
        prevPairs.map((pair) => {
          const delta = (Math.random() - 0.49) * (pair.bid * 0.0006);
          const newBid = parseFloat((pair.bid + delta).toFixed(pair.digits));
          const newAsk = parseFloat((newBid + pair.spread * (10 ** -pair.digits)).toFixed(pair.digits));
          const newChange = parseFloat((pair.change24h + (delta / pair.bid) * 100).toFixed(2));
          return {
            ...pair,
            bid: newBid,
            ask: newAsk,
            change24h: newChange,
          };
        })
      );
      setLastUpdate(new Date());
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const filteredPairs = activeTab === "all" ? pairs : pairs.filter((p) => p.category === activeTab);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3">
      
      {/* Widget Header - Clean Vertical Hierarchy */}
      <div className="space-y-2.5 pb-2.5 border-b border-slate-100">
        
        {/* Title + Live Indicator Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              {isth ? "สภาวะตลาดสด (Live Market)" : "Live Market Overview"}
            </h3>
          </div>

          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <RefreshCw className="w-2.5 h-2.5 animate-spin text-slate-400" />
            {mounted ? lastUpdate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "--:--:--"}
          </span>
        </div>

        {/* Category Filter Tabs Row - Full Width */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg text-xs font-medium w-full">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1 rounded-md text-center text-[11px] transition-all ${
              activeTab === "all"
                ? "bg-white text-slate-900 font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {isth ? "ทั้งหมด" : "All"}
          </button>

          <button
            onClick={() => setActiveTab("forex")}
            className={`flex-1 py-1 rounded-md text-center text-[11px] transition-all ${
              activeTab === "forex"
                ? "bg-white text-slate-900 font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Forex
          </button>

          <button
            onClick={() => setActiveTab("commodities")}
            className={`flex-1 py-1 rounded-md text-center text-[11px] transition-all ${
              activeTab === "commodities"
                ? "bg-white text-slate-900 font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Commodities
          </button>

          <button
            onClick={() => setActiveTab("crypto")}
            className={`flex-1 py-1 rounded-md text-center text-[11px] transition-all ${
              activeTab === "crypto"
                ? "bg-white text-slate-900 font-bold shadow-2xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Crypto
          </button>
        </div>
      </div>

      {/* Pairs List - Perfectly Formatted for Sidebar Width */}
      <div className="space-y-2">
        {filteredPairs.map((pair) => {
          const isPositive = pair.change24h >= 0;
          return (
            <div
              key={pair.symbol}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50/90 border border-slate-100 transition-all group"
            >
              {/* Left: Asset Icon & Name */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-bold text-[10px] flex items-center justify-center border border-slate-200/60 shadow-2xs group-hover:border-[#c6a87c]/40 group-hover:text-[#c6a87c] transition-colors">
                  {pair.symbol.split("/")[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#c6a87c] transition-colors">
                      {pair.symbol}
                    </span>
                    <span className="text-[9px] uppercase font-mono text-slate-400">
                      Spread: {pair.spread}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-none mt-0.5">{pair.name}</p>
                </div>
              </div>

              {/* Right: Live Price & 24h Change % */}
              <div className="text-right">
                <p className="font-bold text-xs font-mono text-slate-900 tracking-tight">
                  ${pair.bid.toLocaleString(undefined, { minimumFractionDigits: pair.digits })}
                </p>
                <div
                  className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                    isPositive ? "text-emerald-600" : "text-rose-500"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  <span>{isPositive ? "+" : ""}{pair.change24h}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
