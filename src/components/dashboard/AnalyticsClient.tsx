"use client";

import { useState } from "react";
import { type Locale } from "@/dictionaries";

interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  flag: string;
  event: string;
  impact: "High" | "Medium" | "Low";
  actual: string;
  forecast: string;
  previous: string;
  surprise?: "bullish" | "bearish" | "neutral";
}

interface MarketSentiment {
  symbol: string;
  name: string;
  longPercent: number;
  shortPercent: number;
  price: string;
  change: string;
  isPositive: boolean;
}

interface TradingSignal {
  symbol: string;
  type: "BUY" | "SELL";
  timeframe: string;
  entry: string;
  tp: string;
  sl: string;
  status: "ACTIVE" | "REACHED_TP";
  confidence: number;
}

export function AnalyticsClient({ lang }: { lang: string }) {
  const isth = (lang as Locale) === "th";

  // Tab State
  const [activeTab, setActiveTab] = useState<"calendar" | "sentiment" | "signals" | "news">("calendar");
  const [impactFilter, setImpactFilter] = useState<"ALL" | "High" | "Medium">("ALL");
  const [currencyFilter, setCurrencyFilter] = useState<string>("ALL");

  const economicEvents: EconomicEvent[] = [
    {
      id: "e1",
      time: "19:30",
      currency: "USD",
      flag: "🇺🇸",
      event: "Non-Farm Payrolls (NFP - Aug)",
      impact: "High",
      actual: "272K",
      forecast: "185K",
      previous: "165K",
      surprise: "bullish",
    },
    {
      id: "e2",
      time: "19:30",
      currency: "USD",
      flag: "🇺🇸",
      event: "Unemployment Rate",
      impact: "High",
      actual: "4.0%",
      forecast: "3.9%",
      previous: "3.9%",
      surprise: "bearish",
    },
    {
      id: "e3",
      time: "15:00",
      currency: "EUR",
      flag: "🇪🇺",
      event: "ECB Interest Rate Decision",
      impact: "High",
      actual: "3.75%",
      forecast: "3.75%",
      previous: "4.00%",
      surprise: "neutral",
    },
    {
      id: "e4",
      time: "13:00",
      currency: "GBP",
      flag: "🇬🇧",
      event: "GDP (MoM)",
      impact: "Medium",
      actual: "0.4%",
      forecast: "0.2%",
      previous: "0.1%",
      surprise: "bullish",
    },
    {
      id: "e5",
      time: "21:00",
      currency: "USD",
      flag: "🇺🇸",
      event: "FOMC Meeting Minutes",
      impact: "High",
      actual: "-",
      forecast: "-",
      previous: "-",
    },
    {
      id: "e6",
      time: "07:30",
      currency: "AUD",
      flag: "🇦🇺",
      event: "Employment Change",
      impact: "Medium",
      actual: "39.7K",
      forecast: "25.0K",
      previous: "38.5K",
      surprise: "bullish",
    },
  ];

  const sentiments: MarketSentiment[] = [
    { symbol: "XAU/USD", name: "Spot Gold", longPercent: 68, shortPercent: 32, price: "$2,642.50", change: "+1.24%", isPositive: true },
    { symbol: "EUR/USD", name: "Euro / US Dollar", longPercent: 42, shortPercent: 58, price: "1.0845", change: "-0.32%", isPositive: false },
    { symbol: "GBP/USD", name: "British Pound", longPercent: 55, shortPercent: 45, price: "1.2980", change: "+0.15%", isPositive: true },
    { symbol: "BTC/USD", name: "Bitcoin", longPercent: 74, shortPercent: 26, price: "$64,250", change: "+3.45%", isPositive: true },
    { symbol: "US30", name: "Dow Jones 30", longPercent: 38, shortPercent: 62, price: "40,820", change: "-0.54%", isPositive: false },
  ];

  const signals: TradingSignal[] = [
    { symbol: "XAU/USD", type: "BUY", timeframe: "H4", entry: "2,638.00", tp: "2,655.00", sl: "2,628.00", status: "ACTIVE", confidence: 88 },
    { symbol: "EUR/USD", type: "SELL", timeframe: "H1", entry: "1.0860", tp: "1.0810", sl: "1.0890", status: "ACTIVE", confidence: 75 },
    { symbol: "GBP/USD", type: "BUY", timeframe: "D1", entry: "1.2940", tp: "1.3050", sl: "1.2880", status: "REACHED_TP", confidence: 92 },
  ];

  const newsItems = [
    {
      time: "10 mins ago",
      title: "Gold hits new session high above $2,640 as US Treasury yields drop",
      category: "Commodities",
      readTime: "2 min read",
    },
    {
      time: "45 mins ago",
      title: "ECB signals cautious approach to further rate cuts amidst sticky services inflation",
      category: "Forex",
      readTime: "3 min read",
    },
    {
      time: "2 hours ago",
      title: "Bitcoin breaks $64,000 resistance as institutional ETF inflows rebound",
      category: "Crypto",
      readTime: "4 min read",
    },
  ];

  const filteredEvents = economicEvents.filter((ev) => {
    const matchImpact = impactFilter === "ALL" || ev.impact === impactFilter;
    const matchCurr = currencyFilter === "ALL" || ev.currency === currencyFilter;
    return matchImpact && matchCurr;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      {/* 1. HEADER HERO BAR (WHITE & CHAMPAGNE GOLD) */}
      <div className="bg-gradient-to-r from-white via-[#faf8f5] to-[#f5efe4] border border-[#e8d5b7]/70 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {isth ? "การวิเคราะห์และข่าวสารตลาด (Market Intelligence & Analytics)" : "Market Analytics & Intelligence"}
              </h1>
              <span className="text-[10px] font-semibold text-[#b89766] bg-[#f7f1e5] border border-[#e6cda3]/60 px-2 py-0.5 rounded uppercase tracking-wide">
                Real-Time Data
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isth
                ? "ข้อมูลปฏิทินเศรษฐกิจ อารมณ์ตลาด (Market Sentiment) และสัญญาณการเทรดสดสำหรับวิเคราะห์ก่อนส่งคำสั่ง"
                : "Economic indicators, retail trader positioning, and technical signals for multi-asset trading"}
            </p>
          </div>

          {/* Quick Sentiment Status Pills */}
          <div className="flex items-center gap-3 bg-white border border-[#e8d5b7]/50 rounded-xl px-4 py-2 shadow-2xs font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">{isth ? "สเปรดทองคำเฉลี่ย" : "XAUUSD Spread"}</span>
              <span className="font-bold text-[#b89766]">0.18 Pips</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">{isth ? "ข่าวสำคัญวันนี้" : "High Impact Events"}</span>
              <span className="font-bold text-rose-600">3 Events</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">{isth ? "สถานะตลาด" : "Market Status"}</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-[#e8d5b7]/40">
          <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "calendar" ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isth ? "ปฏิทินเศรษฐกิจ" : "Economic Calendar"}
            </button>
            <button
              onClick={() => setActiveTab("sentiment")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "sentiment" ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isth ? "อารมณ์ตลาด (Retail Sentiment)" : "Market Sentiment"}
            </button>
            <button
              onClick={() => setActiveTab("signals")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "signals" ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isth ? "สัญญาณการเทรด (Signals)" : "Trading Signals"}
            </button>
            <button
              onClick={() => setActiveTab("news")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "news" ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isth ? "ข่าววิเคราะห์ตลาด" : "Market News"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB: ECONOMIC CALENDAR */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400 text-[11px]">{isth ? "ผลกระทบ:" : "Impact:"}</span>
              {(["ALL", "High", "Medium"] as const).map((imp) => (
                <button
                  key={imp}
                  onClick={() => setImpactFilter(imp)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    impactFilter === imp ? "bg-[#f5efe4] text-[#b89766] border border-[#e8d5b7]" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {imp === "ALL" ? (isth ? "ทั้งหมด" : "All Impact") : imp}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-400 text-[11px]">{isth ? "สกุลเงิน:" : "Currency:"}</span>
              {["ALL", "USD", "EUR", "GBP", "AUD"].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrencyFilter(curr)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    currencyFilter === curr ? "bg-[#f5efe4] text-[#b89766] border border-[#e8d5b7]" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Table */}
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] border-b border-slate-200">
                    <th className="p-3 font-semibold">{isth ? "เวลา (GMT+7)" : "Time"}</th>
                    <th className="p-3 font-semibold">{isth ? "สกุลเงิน" : "Currency"}</th>
                    <th className="p-3 font-semibold">{isth ? "เหตุการณ์เศรษฐกิจ" : "Economic Event"}</th>
                    <th className="p-3 font-semibold">{isth ? "ผลกระทบ" : "Impact"}</th>
                    <th className="p-3 font-semibold">{isth ? "ตัวเลขจริง" : "Actual"}</th>
                    <th className="p-4 font-semibold">{isth ? "คาดการณ์" : "Forecast"}</th>
                    <th className="p-3 font-semibold">{isth ? "ครั้งก่อน" : "Previous"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{ev.time}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          <span>{ev.flag}</span>
                          <span>{ev.currency}</span>
                        </span>
                      </td>
                      <td className="p-3 font-sans font-semibold text-slate-900">{ev.event}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ev.impact === "High"
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}
                        >
                          {ev.impact}
                        </span>
                      </td>
                      <td className="p-3 font-bold">
                        <span
                          className={
                            ev.surprise === "bullish"
                              ? "text-emerald-600"
                              : ev.surprise === "bearish"
                              ? "text-rose-600"
                              : "text-slate-800"
                          }
                        >
                          {ev.actual}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{ev.forecast}</td>
                      <td className="p-3 text-slate-500">{ev.previous}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* High Impact Alert Banner */}
            <div className="bg-[#fcf8f2] border-t border-[#e8d5b7]/50 p-3.5 flex items-start gap-2.5 text-xs text-[#8c6b3a]">
              <span className="font-bold">⚠️ Notice:</span>
              <p>
                {isth
                  ? "ช่วงเวลาการประกาศข่าวที่มีผลกระทบสูง (High Impact) สเปรดตลาดอาจขยายกว้างชั่วคราว โปรดบริหารจัดการความเสี่ยงและ Stop Loss อย่างระมัดระวัง"
                  : "Spreads may widen during High Impact economic releases. Ensure proper position sizing and stop-loss placement."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB: MARKET SENTIMENT */}
      {activeTab === "sentiment" && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{isth ? "อารมณ์ตลาดจากผู้เทรดย่อย (Retail Client Positioning)" : "Retail Trader Positioning"}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isth ? "สัดส่วนเปอร์เซ็นต์คำสั่งซื้อขาย Long (ฝั่งซื้อ) vs Short (ฝั่งขาย) ปัจจุบัน" : "Real-time ratio of open Long vs Short client positions"}
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {sentiments.map((s) => (
              <div key={s.symbol} className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{s.symbol}</span>
                    <span className="text-slate-400 font-sans text-[11px]">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{s.price}</span>
                    <span className={`font-bold ${s.isPositive ? "text-emerald-600" : "text-rose-600"}`}>{s.change}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="h-3.5 w-full bg-rose-500 rounded-md overflow-hidden flex text-[9px] font-mono font-bold text-white leading-none">
                    <div style={{ width: `${s.longPercent}%` }} className="bg-emerald-500 h-full flex items-center justify-start pl-2">
                      {s.longPercent}% LONG
                    </div>
                    <div className="flex-1 h-full flex items-center justify-end pr-2">
                      {s.shortPercent}% SHORT
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB: TRADING SIGNALS */}
      {activeTab === "signals" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {signals.map((sig, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">{sig.symbol}</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    sig.type === "BUY" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
                  }`}
                >
                  {sig.type} ({sig.timeframe})
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">{isth ? "ราคาเข้า:" : "Entry:"}</span>
                  <span className="font-bold">{sig.entry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">{isth ? "เป้าหมายกำไร (TP):" : "Target (TP):"}</span>
                  <span className="font-bold text-emerald-600">{sig.tp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">{isth ? "ตัดขาดทุน (SL):" : "Stop Loss (SL):"}</span>
                  <span className="font-bold text-rose-600">{sig.sl}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-sans">{isth ? "ความเชื่อมั่น:" : "Confidence:"}</span>
                <span className="font-bold text-[#b89766]">{sig.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. TAB: MARKET NEWS */}
      {activeTab === "news" && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">{isth ? "บทวิเคราะห์ข่าวสารล่าสุด" : "Latest Market Commentary"}</h3>

          <div className="divide-y divide-slate-100">
            {newsItems.map((news, idx) => (
              <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="font-bold text-[#b89766] bg-[#f9f6f0] px-2 py-0.5 rounded">{news.category}</span>
                    <span>•</span>
                    <span>{news.time}</span>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900 hover:text-[#b89766] transition-colors cursor-pointer">
                    {news.title}
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">{news.readTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
