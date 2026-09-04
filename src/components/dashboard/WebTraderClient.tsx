"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import {
  TrendingUp, TrendingDown, ChevronDown,
  Activity, AlertCircle, ArrowLeft,
  BarChart2, Clock,
} from "lucide-react";

/* ── Symbols ── */
const SYMBOLS = [
  { id: "XAUUSD", label: "XAU/USD", name: "ทองคำ",          pip: 0.01,   digits: 2, tv: "TVC:GOLD",        pnlFactor: 100    },
  { id: "EURUSD", label: "EUR/USD", name: "ยูโร/ดอลลาร์",    pip: 0.0001, digits: 5, tv: "FX:EURUSD",       pnlFactor: 100000 },
  { id: "GBPUSD", label: "GBP/USD", name: "ปอนด์/ดอลลาร์",   pip: 0.0001, digits: 5, tv: "FX:GBPUSD",       pnlFactor: 100000 },
  { id: "USDJPY", label: "USD/JPY", name: "ดอลลาร์/เยน",     pip: 0.01,   digits: 3, tv: "FX:USDJPY",       pnlFactor: 650    },
  { id: "USDCHF", label: "USD/CHF", name: "ดอลลาร์/ฟรังก์",  pip: 0.0001, digits: 5, tv: "FX:USDCHF",       pnlFactor: 110000 },
  { id: "AUDUSD", label: "AUD/USD", name: "ออสเตรเลีย",      pip: 0.0001, digits: 5, tv: "FX:AUDUSD",       pnlFactor: 100000 },
  { id: "USDCAD", label: "USD/CAD", name: "ดอลลาร์/แคนาดา",  pip: 0.0001, digits: 5, tv: "FX:USDCAD",       pnlFactor: 75000  },
  { id: "NZDUSD", label: "NZD/USD", name: "นิวซีแลนด์",      pip: 0.0001, digits: 5, tv: "FX:NZDUSD",       pnlFactor: 100000 },
  { id: "BTCUSD", label: "BTC/USD", name: "บิตคอยน์",        pip: 1,      digits: 2, tv: "BITSTAMP:BTCUSD", pnlFactor: 1      },
  { id: "ETHUSD", label: "ETH/USD", name: "อีเธอเรียม",      pip: 0.01,   digits: 2, tv: "BITSTAMP:ETHUSD", pnlFactor: 1      },
  { id: "USOIL",  label: "WTI Oil", name: "น้ำมัน WTI",      pip: 0.01,   digits: 2, tv: "NYMEX:CL1!",      pnlFactor: 1000   },
  { id: "US30",   label: "US30",    name: "ดาวโจนส์",        pip: 1,      digits: 2, tv: "FOREXCOM:DJI",    pnlFactor: 1      },
];

const TIMEFRAMES = [
  { label: "1m",  value: "1"   },
  { label: "5m",  value: "5"   },
  { label: "15m", value: "15"  },
  { label: "30m", value: "30"  },
  { label: "1H",  value: "60"  },
  { label: "4H",  value: "240" },
  { label: "1D",  value: "D"   },
  { label: "1W",  value: "W"   },
];

/* ── Types ── */
interface Account {
  id: string; accountNumber: string; platform: string;
  type: string; balance: number; equity: number;
  freeMargin: number; leverage: string; isDemo: boolean;
}

interface Trade {
  id: string; accountId: string; symbol: string;
  type: "buy" | "sell"; volume: number; openPrice: number;
  sl: number | null; tp: number | null; status: string;
  openTime: string; closeTime?: string | null;
  closePrice?: number | null; pnl?: number | null;
}

type PriceEntry = { bid: number; ask: number; mid: number; change: number; changePct: number };
type Prices = Record<string, PriceEntry>;

function fmtN(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function symOf(id: string) {
  return SYMBOLS.find((s) => s.id === id) ?? SYMBOLS[0];
}

function calcPnl(trade: Trade, prices: Prices): number {
  const sym = symOf(trade.symbol);
  const current = prices[trade.symbol]?.mid ?? trade.openPrice;
  const dir = trade.type === "buy" ? 1 : -1;
  return dir * (current - trade.openPrice) * trade.volume * sym.pnlFactor;
}

/* ══════════════════════════════════════════════ */
export function WebTraderClient({ lang }: { lang: string }) {
  const isth = lang === "th";

  /* ── Chart state ── */
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState("5");
  const [chartKey, setChartKey] = useState(0);

  /* ── Order form state ── */
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [volume, setVolume] = useState("0.01");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [placing, setPlacing] = useState(false);

  /* ── Account state ── */
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAccDrop, setShowAccDrop] = useState(false);

  /* ── Prices state (poll every 5s) ── */
  const [prices, setPrices] = useState<Prices>({});

  /* ── Positions state ── */
  const [openPositions, setOpenPositions] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<"positions" | "history">("positions");
  const [closing, setClosing] = useState<string | null>(null);

  /* ── Fetch accounts ── */
  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        const all: Account[] = d.accounts ?? [];
        setAccounts(all);
        if (all.length > 0) setSelectedAccount(all[0]);
      });
  }, []);

  /* ── Socket.IO — subscribe to live prices (WebSocket only, no polling) ── */
  useEffect(() => {
    const socket = io({ path: "/socket.io", transports: ["websocket"] });

    socket.on("prices", (data: Prices) => {
      setPrices(data);
    });

    return () => { socket.disconnect(); };
  }, []);

  /* ── Fetch open positions + history ── */
  const fetchPositions = useCallback(async () => {
    if (!selectedAccount) return;
    const [openRes, histRes] = await Promise.all([
      fetch(`/api/trades?accountId=${selectedAccount.id}&status=open`),
      fetch(`/api/trades?accountId=${selectedAccount.id}&status=closed`),
    ]);
    const [od, hd] = await Promise.all([openRes.json(), histRes.json()]);
    setOpenPositions(od.trades ?? []);
    setTradeHistory(hd.trades ?? []);
  }, [selectedAccount]);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  /* ── Chart helpers ── */
  const handleSymbolChange = (sym: typeof SYMBOLS[0]) => {
    setSelectedSymbol(sym);
    setChartKey((k) => k + 1);
  };
  const handleTimeframe = (tf: string) => {
    setTimeframe(tf);
    setChartKey((k) => k + 1);
  };

  /* ── Place order ── */
  const handleOrder = async () => {
    if (!selectedAccount || placing) return;
    const vol = parseFloat(volume);
    if (isNaN(vol) || vol <= 0) return;

    // Use Socket.IO price if available; fallback to HTTP once
    let sp = prices[selectedSymbol.id];
    if (!sp) {
      try {
        const r = await fetch("/api/prices");
        const d = await r.json();
        if (d.ok && d.prices[selectedSymbol.id]) {
          sp = d.prices[selectedSymbol.id];
          setPrices((prev) => ({ ...prev, ...d.prices }));
        }
      } catch {}
    }

    const openPrice = sp
      ? (orderType === "buy" ? sp.ask : sp.bid)
      : 0;

    setPlacing(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          symbol: selectedSymbol.id,
          type: orderType,
          volume: vol,
          openPrice,
          sl: sl ? parseFloat(sl) : null,
          tp: tp ? parseFloat(tp) : null,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        const priceStr = openPrice
          ? ` @ ${openPrice.toFixed(selectedSymbol.digits)}`
          : "";
        setOrderSuccess(
          `${orderType === "buy" ? "▲ BUY" : "▼ SELL"} ${volume} lot ${selectedSymbol.label}${priceStr}`
        );
        setTimeout(() => setOrderSuccess(""), 5000);
        setSl(""); setTp("");
        await fetchPositions();
      }
    } finally {
      setPlacing(false);
    }
  };

  /* ── Close position ── */
  const handleClose = async (pos: Trade) => {
    const closePrice = prices[pos.symbol]?.mid;
    if (!closePrice || closing) return;
    setClosing(pos.id);
    try {
      const res = await fetch("/api/trades", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId: pos.id, closePrice }),
      });
      const d = await res.json();
      if (d.ok) await fetchPositions();
    } finally {
      setClosing(null);
    }
  };

  const tvUrl =
    `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart_${chartKey}` +
    `&symbol=${encodeURIComponent(selectedSymbol.tv)}&interval=${timeframe}` +
    `&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=0&saveimage=0` +
    `&toolbarbg=0f172a&studies=%5B%5D&theme=dark&style=1` +
    `&timezone=Asia%2FBangkok&withdateranges=1&locale=${isth ? "th_TH" : "en"}&hide_volume=0`;

  const selPrice = prices[selectedSymbol.id];
  const hasPrices = !!selPrice;

  /* ─────────────────────────────────────── RENDER ── */
  return (
    <div className="flex flex-col w-full h-full overflow-hidden bg-[#0b1120] text-slate-200">

      {/* ══ TOP BAR ══ */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-[#0f172a] shrink-0">
        <Link
          href={`/${lang}/dashboard`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all text-xs font-bold shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#c6a87c]/20 to-transparent border border-[#c6a87c]/30 rounded-lg shrink-0">
          <BarChart2 className="w-4 h-4 text-[#c6a87c]" />
          <span className="text-xs font-black text-[#e6cda3] tracking-wider font-mono">LUNA WEBTRADER</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar ml-2">
          {SYMBOLS.slice(0, 8).map((s) => (
            <button
              key={s.id}
              onClick={() => handleSymbolChange(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedSymbol.id === s.id
                  ? "bg-[#c6a87c] text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto shrink-0">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => handleTimeframe(tf.value)}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                timeframe === tf.value ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ MAIN BODY ══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT: Market Watch ══ */}
        <div className="w-48 shrink-0 border-r border-slate-800 bg-[#0f172a] flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Watch</span>
            {Object.keys(prices).length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Live" />
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {SYMBOLS.map((s) => {
              const p = prices[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => handleSymbolChange(s)}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/60 transition-colors border-b border-slate-800/40 ${
                    selectedSymbol.id === s.id ? "bg-slate-800 border-l-2 border-l-[#c6a87c]" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${selectedSymbol.id === s.id ? "text-[#e6cda3]" : "text-slate-300"}`}>
                      {s.label}
                    </p>
                    <p className="text-[9px] text-slate-600 truncate">{s.name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-1">
                    {p ? (
                      <>
                        <p className="text-[11px] font-mono font-bold text-slate-200 leading-tight">
                          {p.bid.toFixed(s.digits)}
                        </p>
                        <p className={`text-[9px] font-bold leading-tight ${p.changePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {p.changePct >= 0 ? "+" : ""}{p.changePct.toFixed(2)}%
                        </p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-700 font-mono">···</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ CENTER: Chart + Bottom Panel ══ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <iframe
            key={chartKey}
            id={`tv_chart_${chartKey}`}
            src={tvUrl}
            className="w-full flex-1 border-0"
            allowFullScreen
          />

          {/* ── BOTTOM: Positions / History ── */}
          <div className="h-44 border-t border-slate-800 bg-[#0f172a] flex flex-col shrink-0">
            <div className="flex items-center gap-1 px-3 pt-2 border-b border-slate-800 shrink-0">
              {(["positions", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-t transition-all ${
                    activeTab === tab
                      ? "text-[#e6cda3] border-b-2 border-[#c6a87c]"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab === "positions"
                    ? (isth ? "สถานะเปิดอยู่" : "Open Positions")
                    : (isth ? "ประวัติการเทรด" : "Trade History")}
                  {tab === "positions" && openPositions.length > 0 && (
                    <span className="ml-1.5 bg-[#c6a87c] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                      {openPositions.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto">
              {activeTab === "positions" && (
                openPositions.length === 0 ? (
                  <div className="flex items-center justify-center h-full gap-2 text-slate-600 text-xs">
                    <Activity className="w-4 h-4" />
                    <span>{isth ? "ยังไม่มีสถานะเปิดอยู่" : "No open positions"}</span>
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#0f172a]">
                      <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-600">
                        {["Symbol", "Type", "Volume", "Open", "Current", "P&L", ""].map((h, i) => (
                          <th key={i} className="px-3 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {openPositions.map((pos) => {
                        const sym = symOf(pos.symbol);
                        const cur = prices[pos.symbol]?.mid;
                        const pnl = calcPnl(pos, prices);
                        return (
                          <tr key={pos.id} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                            <td className="px-3 py-1.5 font-bold text-slate-200 whitespace-nowrap">{pos.symbol}</td>
                            <td className={`px-3 py-1.5 font-bold ${pos.type === "buy" ? "text-emerald-400" : "text-rose-400"}`}>
                              {pos.type.toUpperCase()}
                            </td>
                            <td className="px-3 py-1.5 font-mono text-slate-400">{pos.volume}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-400">{fmtN(pos.openPrice, sym.digits)}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-300">
                              {cur ? fmtN(cur, sym.digits) : <span className="text-slate-700">···</span>}
                            </td>
                            <td className={`px-3 py-1.5 font-bold font-mono ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {pnl >= 0 ? "+" : ""}${fmtN(pnl)}
                            </td>
                            <td className="px-3 py-1.5">
                              <button
                                onClick={() => handleClose(pos)}
                                disabled={!cur || closing === pos.id}
                                className="px-2 py-0.5 text-[10px] font-bold bg-slate-700 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {closing === pos.id ? "···" : "Close"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              )}

              {activeTab === "history" && (
                tradeHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-full gap-2 text-slate-600 text-xs">
                    <Activity className="w-4 h-4" />
                    <span>{isth ? "ยังไม่มีประวัติการเทรด" : "No trade history"}</span>
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#0f172a]">
                      <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-600">
                        {["Symbol", "Type", "Volume", "Open", "Close", "P&L", "Date"].map((h, i) => (
                          <th key={i} className="px-3 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tradeHistory.map((t) => {
                        const sym = symOf(t.symbol);
                        return (
                          <tr key={t.id} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                            <td className="px-3 py-1.5 font-bold text-slate-400">{t.symbol}</td>
                            <td className={`px-3 py-1.5 font-bold ${t.type === "buy" ? "text-emerald-400/70" : "text-rose-400/70"}`}>
                              {t.type.toUpperCase()}
                            </td>
                            <td className="px-3 py-1.5 font-mono text-slate-500">{t.volume}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-500">{fmtN(t.openPrice, sym.digits)}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-500">
                              {t.closePrice != null ? fmtN(t.closePrice, sym.digits) : "—"}
                            </td>
                            <td className={`px-3 py-1.5 font-bold font-mono ${(t.pnl ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {(t.pnl ?? 0) >= 0 ? "+" : ""}${fmtN(t.pnl ?? 0)}
                            </td>
                            <td className="px-3 py-1.5 text-[10px] text-slate-600 whitespace-nowrap">
                              {t.closeTime
                                ? new Date(t.closeTime).toLocaleString("th-TH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        </div>

        {/* ══ RIGHT: Account + Order Form ══ */}
        <div className="w-64 shrink-0 border-l border-slate-800 bg-[#0f172a] flex flex-col overflow-y-auto">

          {/* Account selector */}
          <div className="p-3 border-b border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">บัญชีเทรด</p>
            <div className="relative">
              <button
                onClick={() => setShowAccDrop((v) => !v)}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 flex items-center justify-between text-xs transition-all"
              >
                {selectedAccount ? (
                  <span className="font-bold text-slate-200 font-mono">#{selectedAccount.accountNumber}</span>
                ) : (
                  <span className="text-slate-500">เลือกบัญชี...</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showAccDrop ? "rotate-180" : ""}`} />
              </button>
              {showAccDrop && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg z-50 overflow-hidden shadow-xl">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => { setSelectedAccount(acc); setShowAccDrop(false); }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-slate-700 transition-colors"
                    >
                      <span className="font-bold text-slate-200 font-mono">#{acc.accountNumber}</span>
                      <span className="text-slate-500 ml-2">{acc.isDemo ? "Demo" : "Real"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Account summary */}
          {selectedAccount && (
            <div className="p-3 border-b border-slate-800 space-y-1.5">
              {[
                { label: isth ? "ยอดคงเหลือ" : "Balance",    value: `$${fmtN(selectedAccount.balance)}`,    color: "text-slate-200"  },
                { label: isth ? "ทุน" : "Equity",             value: `$${fmtN(selectedAccount.equity)}`,     color: "text-emerald-400" },
                { label: isth ? "มาร์จิ้นว่าง" : "Free Margin", value: `$${fmtN(selectedAccount.freeMargin)}`, color: "text-[#c6a87c]" },
                { label: "Leverage",                           value: selectedAccount.leverage,                color: "text-slate-400"  },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">{label}</span>
                  <span className={`text-[11px] font-bold font-mono ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Live Bid / Ask */}
          <div className="px-3 py-2 border-b border-slate-800 bg-slate-800/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-[#e6cda3]">{selectedSymbol.label}</span>
              <span className="text-[9px] text-slate-500 font-mono">pip {selectedSymbol.pip}</span>
            </div>
            {hasPrices ? (
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-1.5 text-center">
                  <p className="text-[9px] text-rose-400 font-bold mb-0.5">SELL / BID</p>
                  <p className="text-xs font-mono font-bold text-rose-300 leading-tight">
                    {selPrice.bid.toFixed(selectedSymbol.digits)}
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1.5 text-center">
                  <p className="text-[9px] text-emerald-400 font-bold mb-0.5">BUY / ASK</p>
                  <p className="text-xs font-mono font-bold text-emerald-300 leading-tight">
                    {selPrice.ask.toFixed(selectedSymbol.digits)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-1 text-[10px] text-slate-600 animate-pulse">กำลังโหลดราคา...</div>
            )}
            {hasPrices && (
              <p className={`text-[9px] text-center mt-1 font-bold ${selPrice.changePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {selPrice.changePct >= 0 ? "▲" : "▼"} {Math.abs(selPrice.changePct).toFixed(2)}% วันนี้
              </p>
            )}
          </div>

          {/* Order form */}
          <div className="p-3 space-y-3 flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ส่งคำสั่ง</p>

            {/* BUY / SELL toggle */}
            <div className="grid grid-cols-2 gap-1.5">
              {(["buy", "sell"] as const).map((side) => (
                <button
                  key={side}
                  onClick={() => setOrderType(side)}
                  className={`py-3 rounded-xl text-xs font-black transition-all ${
                    orderType === side
                      ? side === "buy"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                      : "bg-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {side === "buy"
                    ? <><TrendingUp className="w-4 h-4 mx-auto mb-0.5" />BUY</>
                    : <><TrendingDown className="w-4 h-4 mx-auto mb-0.5" />SELL</>
                  }
                </button>
              ))}
            </div>

            {/* Volume */}
            <div>
              <label className="text-[10px] text-slate-500 font-bold block mb-1">Volume (Lots)</label>
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setVolume((v) => String(Math.max(0.01, parseFloat(v) - 0.01).toFixed(2)))}
                  className="px-2.5 py-2 text-slate-400 hover:text-white text-sm font-bold hover:bg-slate-700 transition-colors"
                >−</button>
                <input
                  type="number" step="0.01" min="0.01" value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="flex-1 bg-transparent text-center text-xs font-bold font-mono text-slate-200 outline-none py-2"
                />
                <button
                  onClick={() => setVolume((v) => String((parseFloat(v) + 0.01).toFixed(2)))}
                  className="px-2.5 py-2 text-slate-400 hover:text-white text-sm font-bold hover:bg-slate-700 transition-colors"
                >+</button>
              </div>
              <div className="flex gap-1 mt-1.5">
                {["0.01", "0.10", "0.50", "1.00"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVolume(v)}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${
                      volume === v ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* SL / TP */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Stop Loss</label>
                <input
                  type="number" step={selectedSymbol.pip} value={sl} onChange={(e) => setSl(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-rose-400 placeholder:text-slate-600 outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Take Profit</label>
                <input
                  type="number" step={selectedSymbol.pip} value={tp} onChange={(e) => setTp(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-emerald-400 placeholder:text-slate-600 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleOrder}
              disabled={!selectedAccount || placing}
              className={`w-full py-3 rounded-xl text-xs font-black transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                orderType === "buy"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white shadow-emerald-500/20"
                  : "bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-white shadow-rose-500/20"
              }`}
            >
              {placing ? "กำลังส่ง..." : (
                <span>
                  {orderType === "buy" ? "▲ BUY" : "▼ SELL"} {volume} lot
                  {hasPrices && selPrice && (
                    <span className="opacity-80 ml-1 text-[10px]">
                      @ {(orderType === "buy" ? selPrice.ask : selPrice.bid).toFixed(selectedSymbol.digits)}
                    </span>
                  )}
                </span>
              )}
            </button>

            {orderSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-start gap-2">
                <span className="shrink-0">✓</span>
                <span className="break-all">{orderSuccess}</span>
              </div>
            )}

            {!selectedAccount && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{isth ? "กรุณาเลือกบัญชีเทรด" : "Select a trading account"}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 text-center">
            <p className="text-[9px] text-slate-700 font-mono leading-relaxed">
              Luna WebTrader Beta — Simulated orders<br />
              Chart: TradingView real-time data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
