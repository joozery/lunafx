"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import { calcTradePnl } from "@/lib/pnl";
import { TradingViewChart } from "@/components/trading/TradingViewChart";
import { quoteStatus, type MarketQuote } from "@/lib/market-data";
import {
  TrendingUp, TrendingDown, ChevronDown,
  Activity, AlertCircle, ArrowLeft,
  BarChart2, Clock, List, Wallet,
} from "lucide-react";

/* ── Symbols ── */
const SYMBOLS = [
  { id: "XAUUSD", label: "XAU/USD", name: "ทองคำ",          pip: 0.01,   digits: 2 },
  { id: "EURUSD", label: "EUR/USD", name: "ยูโร/ดอลลาร์",    pip: 0.0001, digits: 5 },
  { id: "GBPUSD", label: "GBP/USD", name: "ปอนด์/ดอลลาร์",   pip: 0.0001, digits: 5 },
  { id: "USDJPY", label: "USD/JPY", name: "ดอลลาร์/เยน",     pip: 0.01,   digits: 3 },
  { id: "USDCHF", label: "USD/CHF", name: "ดอลลาร์/ฟรังก์",  pip: 0.0001, digits: 5 },
  { id: "AUDUSD", label: "AUD/USD", name: "ออสเตรเลีย",      pip: 0.0001, digits: 5 },
  { id: "USDCAD", label: "USD/CAD", name: "ดอลลาร์/แคนาดา",  pip: 0.0001, digits: 5 },
  { id: "NZDUSD", label: "NZD/USD", name: "นิวซีแลนด์",      pip: 0.0001, digits: 5 },
  { id: "EURJPY", label: "EUR/JPY", name: "ยูโร/เยน",        pip: 0.01,   digits: 3 },
  { id: "GBPJPY", label: "GBP/JPY", name: "ปอนด์/เยน",       pip: 0.01,   digits: 3 },
  { id: "AUDJPY", label: "AUD/JPY", name: "ออสเตรเลีย/เยน",  pip: 0.01,   digits: 3 },
  { id: "NZDJPY", label: "NZD/JPY", name: "นิวซีแลนด์/เยน",  pip: 0.01,   digits: 3 },
  { id: "CADJPY", label: "CAD/JPY", name: "แคนาดา/เยน",      pip: 0.01,   digits: 3 },
  { id: "CHFJPY", label: "CHF/JPY", name: "ฟรังก์/เยน",      pip: 0.01,   digits: 3 },
  { id: "EURGBP", label: "EUR/GBP", name: "ยูโร/ปอนด์",      pip: 0.0001, digits: 5 },
  { id: "EURAUD", label: "EUR/AUD", name: "ยูโร/ออสเตรเลีย", pip: 0.0001, digits: 5 },
  { id: "EURCHF", label: "EUR/CHF", name: "ยูโร/ฟรังก์",     pip: 0.0001, digits: 5 },
  { id: "GBPCHF", label: "GBP/CHF", name: "ปอนด์/ฟรังก์",    pip: 0.0001, digits: 5 },
  { id: "XAGUSD", label: "XAG/USD", name: "เงิน (Silver)",   pip: 0.001,  digits: 3 },
  { id: "BTCUSD", label: "BTC/USD", name: "บิตคอยน์",        pip: 1,      digits: 2 },
  { id: "ETHUSD", label: "ETH/USD", name: "อีเธอเรียม",      pip: 0.01,   digits: 2 },
  { id: "USOIL",  label: "WTI Oil", name: "น้ำมัน WTI",      pip: 0.01,   digits: 2 },
  { id: "US30",   label: "US30",    name: "ดาวโจนส์",        pip: 1,      digits: 2 },
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
  closeReason?: "manual" | "sl" | "tp" | "stop_out" | null;
}

const CLOSE_REASON_LABEL: Record<string, string> = { sl: "SL", tp: "TP", stop_out: "Stop Out" };

type PriceEntry = MarketQuote;
type Prices = Record<string, PriceEntry>;

function fmtN(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function symOf(id: string) {
  return SYMBOLS.find((s) => s.id === id) ?? SYMBOLS[0];
}

// A position is valued at the price it would close at: buys close at bid, sells at ask.
function closingPrice(trade: Trade, prices: Prices): number | undefined {
  const p = prices[trade.symbol];
  if (!p) return undefined;
  return trade.type === "buy" ? p.bid : p.ask;
}

function calcPnl(trade: Trade, prices: Prices): number {
  const current = closingPrice(trade, prices) ?? trade.openPrice;
  // mids of every symbol, so cross pairs (EURJPY…) can convert their P&L to USD
  const mids = Object.fromEntries(Object.entries(prices).map(([id, p]) => [id, p?.mid]));
  return calcTradePnl(trade.type, trade.symbol, trade.openPrice, current, trade.volume, mids);
}

/* ══════════════════════════════════════════════ */
export function WebTraderClient({ lang }: { lang: string }) {
  const isth = lang === "th";

  /* ── Chart state ── */
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS.find(s => s.id === 'EURUSD') ?? SYMBOLS[0]);
  const [timeframe, setTimeframe] = useState("5");
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(0);
  const [mobileTab, setMobileTab] = useState<"chart" | "markets" | "trade" | "positions">("chart");

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

  /* ── Prices state (pushed over Socket.IO, ~4 updates/s) ── */
  const [prices, setPrices] = useState<Prices>({});

  /* ── Positions state ── */
  const [openPositions, setOpenPositions] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<"positions" | "history">("positions");
  const [closing, setClosing] = useState<string | null>(null);

  /* ── Fetch accounts (also called after every open/close so balance stays in sync) ── */
  const fetchAccounts = useCallback(async () => {
    const d = await fetch("/api/accounts").then((r) => r.json());
    const all: Account[] = d.accounts ?? [];
    setAccounts(all);
    setSelectedAccount((prev) => all.find((a) => a.id === prev?.id) ?? all[0] ?? null);
  }, []);

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

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("prices", (data: Prices) => {
      setPrices(data);
      setNow(Date.now());
    });
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(clock); socket.disconnect(); };
  }, []);

  /* ── Fetch open positions + history ── */
  const accountId = selectedAccount?.id;
  const fetchPositions = useCallback(async () => {
    if (!accountId) return;
    const [openRes, histRes] = await Promise.all([
      fetch(`/api/trades?accountId=${accountId}&status=open`),
      fetch(`/api/trades?accountId=${accountId}&status=closed`),
    ]);
    const [od, hd] = await Promise.all([openRes.json(), histRes.json()]);
    setOpenPositions(od.trades ?? []);
    setTradeHistory(hd.trades ?? []);
  }, [accountId]);

  useEffect(() => {
    if (!accountId) return;
    const controller = new AbortController();
    async function loadPositions() {
      try {
        const [open, history] = await Promise.all([
          fetch(`/api/trades?accountId=${accountId}&status=open`, { signal: controller.signal }).then((r) => r.json()),
          fetch(`/api/trades?accountId=${accountId}&status=closed`, { signal: controller.signal }).then((r) => r.json()),
        ]);
        if (!controller.signal.aborted) {
          setOpenPositions(open.trades ?? []);
          setTradeHistory(history.trades ?? []);
        }
      } catch {
        // Switching accounts aborts the previous request.
      }
    }
    void loadPositions();
    return () => controller.abort();
  }, [accountId]);

  /* ── Chart helpers ── */
  const handleSymbolChange = (sym: typeof SYMBOLS[0]) => {
    setSelectedSymbol(sym);
  };
  const handleTimeframe = (tf: string) => {
    setTimeframe(tf);
  };

  /* ── Place order ── */
  const handleOrder = async () => {
    if (!selectedAccount || placing) return;
    const vol = parseFloat(volume);
    if (isNaN(vol) || vol <= 0) return;

    const sp = prices[selectedSymbol.id];
    if (!sp) {
      setOrderSuccess(isth ? "ยังไม่มีราคา — กรุณารอสักครู่" : "No price yet — please wait");
      setTimeout(() => setOrderSuccess(""), 3000);
      return;
    }

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
          sl: sl ? parseFloat(sl) : null,
          tp: tp ? parseFloat(tp) : null,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        // the server fills at its own price and tells us what it was
        setOrderSuccess(
          `${orderType === "buy" ? "▲ BUY" : "▼ SELL"} ${volume} lot ${selectedSymbol.label} @ ${Number(d.openPrice).toFixed(selectedSymbol.digits)}`
        );
        setSl(""); setTp("");
        await Promise.all([fetchPositions(), fetchAccounts()]);
      } else {
        setOrderSuccess(d.error ?? (isth ? "เปิดออเดอร์ไม่สำเร็จ" : "Order failed"));
      }
      setTimeout(() => setOrderSuccess(""), 5000);
    } finally {
      setPlacing(false);
    }
  };

  /* ── Close position ── */
  const handleClose = async (pos: Trade) => {
    if (closing) return;
    setClosing(pos.id);
    try {
      const res = await fetch("/api/trades", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId: pos.id }),
      });
      const d = await res.json();
      if (d.ok) {
        const sign = d.pnl >= 0 ? "+" : "-";
        setOrderSuccess(
          `${d.pnl >= 0 ? "▲" : "▼"} ${isth ? "ปิด" : "Closed"} ${symOf(pos.symbol).label} ${sign}$${fmtN(Math.abs(d.pnl))}`
        );
        await Promise.all([fetchPositions(), fetchAccounts()]);
      } else {
        setOrderSuccess(d.error ?? (isth ? "ปิดออเดอร์ไม่สำเร็จ" : "Close failed"));
      }
      setTimeout(() => setOrderSuccess(""), 5000);
    } finally {
      setClosing(null);
    }
  };

  // Equity and free margin float with the open positions; balance only changes when a trade closes
  const floatingPnl = openPositions.reduce((sum, p) => sum + calcPnl(p, prices), 0);

  const selPrice = prices[selectedSymbol.id];
  const hasPrices = !!selPrice;
  const status = quoteStatus(selPrice, connected, now);
  const executable = status === "live" || status === "polled";
  const statusLabels = {
    live: isth ? "ราคาสด" : "Live ticks",
    polled: isth ? "ราคาอัปเดตเป็นรอบ" : "Polled price",
    indicative: isth ? "เรตรายวัน • ไม่ใช่ราคาสด" : "Daily indicative rate",
    stale: isth ? "ราคาค้าง • รอฟีดใหม่" : "Stale • waiting for feed",
    waiting: isth ? "รอข้อมูลราคา" : "Waiting for prices",
    disconnected: isth ? "การเชื่อมต่อขาด • กำลังเชื่อมต่อใหม่" : "Disconnected • reconnecting",
  };

  /* ─────────────────────────────────────── RENDER ── */
  return (
    <div className="flex flex-col w-full h-dvh overflow-hidden bg-[#0b1120] text-slate-200 [&_button]:touch-manipulation [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-[#c6a87c]">

      {/* ══ TOP BAR ══ */}
      <div className="flex items-center gap-2 px-3 py-2.5 lg:gap-3 lg:px-4 border-b border-slate-800 bg-[#0f172a] shrink-0">
        <Link
          href={`/${lang}/dashboard`}
          aria-label={isth ? "กลับแดชบอร์ด" : "Back to dashboard"}
          className="flex min-h-11 items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all text-xs font-bold shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#c6a87c]/20 to-transparent border border-[#c6a87c]/30 rounded-lg shrink-0">
          <BarChart2 className="w-4 h-4 text-[#c6a87c]" />
          <span className="text-xs font-black text-[#e6cda3] tracking-wider font-mono">LUNA WEBTRADER</span>
        </div>

        <div className="hidden lg:flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-hide ml-2">
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

        <div className="hidden lg:flex items-center gap-1 ml-auto shrink-0">
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

      <div className="lg:hidden border-b border-slate-800 bg-[#0f172a] px-3 py-2 space-y-2 shrink-0">
        <div className="flex items-center gap-3">
          <select
            aria-label={isth ? "เลือกสินทรัพย์" : "Select instrument"}
            value={selectedSymbol.id}
            onChange={(e) => handleSymbolChange(SYMBOLS.find((s) => s.id === e.target.value) ?? SYMBOLS[0])}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 text-base font-bold text-[#e6cda3]"
          >
            {SYMBOLS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <div className="text-right text-xs min-w-0">
            <p className="text-slate-500">{isth ? "กำไร / ขาดทุน" : "Floating P&L"}</p>
            <p className={`font-mono font-bold ${floatingPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{floatingPnl >= 0 ? "+" : ""}${fmtN(floatingPnl)}</p>
          </div>
        </div>
        {mobileTab === "chart" && (
          <div className="flex overflow-x-auto scrollbar-hide gap-1" aria-label="Chart timeframe">
            {TIMEFRAMES.map((tf) => <button key={tf.value} onClick={() => handleTimeframe(tf.value)} aria-pressed={timeframe === tf.value} className={`min-h-11 min-w-11 rounded-lg text-xs font-bold ${timeframe === tf.value ? "bg-slate-700 text-[#e6cda3]" : "text-slate-400"}`}>{tf.label}</button>)}
          </div>
        )}
      </div>

      {orderSuccess && mobileTab !== "trade" && (
        <div role="status" className="lg:hidden shrink-0 border-b border-slate-700 bg-slate-800 px-4 py-3 text-xs text-[#e6cda3] break-words">{orderSuccess}</div>
      )}

      {/* ══ MAIN BODY ══ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ══ LEFT: Market Watch ══ */}
        <div className={`${mobileTab === "markets" ? "flex" : "hidden"} w-full lg:flex lg:w-48 shrink-0 border-r border-slate-800 bg-[#0f172a] flex-col overflow-hidden`}>
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Market Watch</span>
            {connected && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Connected" />
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {SYMBOLS.map((s) => {
              const p = prices[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => { handleSymbolChange(s); setMobileTab("chart"); }}
                  className={`w-full px-4 py-4 lg:px-3 lg:py-2 flex items-center justify-between text-left hover:bg-slate-800/60 transition-colors border-b border-slate-800/40 ${
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
        <div className={`${mobileTab === "chart" || mobileTab === "positions" ? "flex" : "hidden"} min-w-0 flex-1 lg:flex flex-col overflow-hidden`}>
          <div className={`${mobileTab === "chart" ? "flex" : "hidden"} lg:flex min-h-0 flex-1 flex-col`}>
            <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-800 px-3 py-2 text-[10px]">
              <span className={status === "live" ? "text-emerald-400" : "text-amber-400"}>● {statusLabels[status]}</span>
              <span className="text-slate-500">{selPrice?.ts ? `${isth ? "อัปเดต" : "Updated"} ${new Date(selPrice.ts).toLocaleTimeString(isth ? "th-TH" : "en-GB")}` : "—"}</span>
            </div>
            <TradingViewChart symbol={selectedSymbol.id} timeframe={timeframe} isth={isth} />
          </div>

          {/* ── BOTTOM: Positions / History ── */}
          <div className={`${mobileTab === "positions" ? "flex" : "hidden"} flex-1 min-h-0 lg:flex lg:flex-none lg:h-44 border-t border-slate-800 bg-[#0f172a] flex-col shrink-0`}>
            <div className="flex items-center gap-1 px-3 pt-2 border-b border-slate-800 shrink-0">
              {(["positions", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`min-h-11 lg:min-h-0 px-3 py-1 text-xs lg:text-[11px] font-bold rounded-t transition-all ${
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
              <div className="lg:hidden p-3 space-y-3">
                {(activeTab === "positions" ? openPositions : tradeHistory).map((trade) => {
                  const isOpen = activeTab === "positions";
                  const sym = symOf(trade.symbol);
                  const current = isOpen ? closingPrice(trade, prices) : trade.closePrice;
                  const pnl = isOpen ? calcPnl(trade, prices) : trade.pnl ?? 0;
                  return (
                    <article key={trade.id} className="rounded-2xl border border-slate-700/70 bg-slate-800/50 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div><p className="font-bold text-sm">{sym.label}</p><p className={`text-xs mt-1 ${trade.type === "buy" ? "text-emerald-400" : "text-rose-400"}`}>{trade.type.toUpperCase()} · {trade.volume} lot</p></div>
                        <p className={`font-mono font-bold ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{pnl >= 0 ? "+" : ""}${fmtN(pnl)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 my-3 text-xs">
                        <div><p className="text-slate-500">{isth ? "ราคาเปิด" : "Open"}</p><p className="font-mono mt-1">{fmtN(trade.openPrice, sym.digits)}</p></div>
                        <div className="text-right"><p className="text-slate-500">{isOpen ? (isth ? "ราคาปิดปัจจุบัน" : "Current close") : (isth ? "ราคาปิด" : "Close")}</p><p className="font-mono mt-1">{current != null ? fmtN(current, sym.digits) : "—"}</p></div>
                      </div>
                      {isOpen ? <button onClick={() => handleClose(trade)} disabled={current == null || closing !== null} className="min-h-11 w-full rounded-xl bg-slate-700 text-sm font-bold text-slate-200 active:bg-rose-900 disabled:opacity-40">{closing === trade.id ? (isth ? "กำลังปิด…" : "Closing…") : (isth ? "ปิดออเดอร์" : "Close position")}</button> : <p className="text-xs text-slate-500">{trade.closeTime ? new Date(trade.closeTime).toLocaleString(isth ? "th-TH" : "en-US") : "—"}</p>}
                    </article>
                  );
                })}
              </div>

              {activeTab === "positions" && (
                openPositions.length === 0 ? (
                  <div className="flex items-center justify-center h-full gap-2 text-slate-600 text-xs">
                    <Activity className="w-4 h-4" />
                    <span>{isth ? "ยังไม่มีสถานะเปิดอยู่" : "No open positions"}</span>
                  </div>
                ) : (
                  <table className="hidden lg:table w-full text-xs">
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
                        const cur = closingPrice(pos, prices);
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
                  <table className="hidden lg:table w-full text-xs">
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
                              {t.closeReason && CLOSE_REASON_LABEL[t.closeReason] && (
                                <span className={`ml-1.5 rounded px-1 py-0.5 text-[9px] font-bold ${t.closeReason === "stop_out" ? "bg-rose-500/15 text-rose-400" : "bg-slate-700 text-slate-300"}`}>
                                  {CLOSE_REASON_LABEL[t.closeReason]}
                                </span>
                              )}
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
        <div className={`${mobileTab === "trade" ? "flex" : "hidden"} w-full lg:flex lg:w-64 shrink-0 border-l border-slate-800 bg-[#0f172a] flex-col overflow-y-auto overscroll-contain [&_input]:min-w-0 [&_input]:min-h-11 [&_input]:text-base lg:[&_input]:min-h-0 lg:[&_input]:text-xs [&_button]:min-h-11 lg:[&_button]:min-h-0`}>

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
                { label: isth ? "ทุน" : "Equity",             value: `$${fmtN(selectedAccount.equity + floatingPnl)}`,     color: selectedAccount.equity + floatingPnl >= 0 ? "text-emerald-400" : "text-rose-400" },
                { label: isth ? "มาร์จิ้นว่าง" : "Free Margin", value: `$${fmtN(selectedAccount.freeMargin + floatingPnl)}`, color: "text-[#c6a87c]" },
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
              <span className={`text-[9px] ${status === "live" ? "text-emerald-400" : "text-amber-400"}`}>{statusLabels[status]}</span>
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
                  aria-label="Volume (Lots)" inputMode="decimal"
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
                  aria-label="Stop Loss" inputMode="decimal"
                  type="number" step={selectedSymbol.pip} value={sl} onChange={(e) => setSl(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-rose-400 placeholder:text-slate-600 outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Take Profit</label>
                <input
                  aria-label="Take Profit" inputMode="decimal"
                  type="number" step={selectedSymbol.pip} value={tp} onChange={(e) => setTp(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs font-mono text-emerald-400 placeholder:text-slate-600 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleOrder}
              disabled={!selectedAccount || placing || !executable}
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
              <div role="status" className={`p-2.5 rounded-xl text-[11px] font-bold flex items-start gap-2 ${
                orderSuccess.startsWith("▲") || orderSuccess.startsWith("▼")
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
              }`}>
                <span className="shrink-0">{orderSuccess.startsWith("▲") || orderSuccess.startsWith("▼") ? "✓" : "⚠"}</span>
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
              {isth ? "กราฟและตัวเลขใช้ราคาจากเซิร์ฟเวอร์ชุดเดียวกัน" : "Chart and quotes share the server feed"}
            </p>
          </div>
        </div>
      </div>
      <nav aria-label={isth ? "เมนูเทรด" : "Trading navigation"} className="lg:hidden grid grid-cols-4 shrink-0 border-t border-slate-700 bg-[#0f172a] pb-[env(safe-area-inset-bottom)]">
        {([
          { id: "markets", label: isth ? "ราคา" : "Markets", icon: List },
          { id: "chart", label: isth ? "กราฟ" : "Chart", icon: BarChart2 },
          { id: "trade", label: isth ? "ส่งคำสั่ง" : "Trade", icon: TrendingUp },
          { id: "positions", label: isth ? "ออเดอร์" : "Positions", icon: Wallet },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setMobileTab(id)} aria-current={mobileTab === id ? "page" : undefined} className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold ${mobileTab === id ? "text-[#e6cda3] bg-[#c6a87c]/10" : "text-slate-500"}`}>
            <Icon className="h-5 w-5" /><span>{label}{id === "positions" && openPositions.length > 0 ? ` (${openPositions.length})` : ""}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
