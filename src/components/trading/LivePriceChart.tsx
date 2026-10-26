"use client";

import { useEffect, useRef, useState } from "react";
import { aggregateCandles, type Candle, type MarketQuote } from "@/lib/market-data";

/** Candles and quote lines use the same server feed as order fills and floating P&L. */
export function LivePriceChart({ candles, quote, timeframe, label, digits, isth }: {
  candles: Candle[]; quote?: MarketQuote; timeframe: string; label: string; digits: number; isth: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width && entry.contentRect.height) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  const bars = aggregateCandles(candles, timeframe).slice(-70);
  const { width, height } = size;
  const right = Math.max(72, digits * 9 + 45);
  const plotWidth = Math.max(1, width - right - 12);
  const plotHeight = Math.max(1, height - 64);
  const values = bars.flatMap((c) => [c.high, c.low]);
  if (quote) values.push(quote.bid, quote.ask);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const padding = Math.max((max - min) * 0.18, Math.abs(max) * 0.00005, 10 ** -digits * 4);
  const low = min - padding;
  const high = max + padding;
  const y = (price: number) => 32 + (high - price) / (high - low) * plotHeight;
  const spacing = plotWidth / Math.max(24, bars.length + 3);
  const offset = Math.max(0, 21 - bars.length);
  const x = (index: number) => 12 + (offset + index + 1) * spacing;
  const selected = hover == null ? bars.at(-1) : bars[Math.max(0, Math.min(bars.length - 1, Math.round((hover - 12) / spacing) - offset - 1))];
  const price = (value: number) => value.toFixed(digits);

  return (
    <div ref={container} className="relative min-h-0 flex-1 overflow-hidden bg-[#0b1120]" aria-label={`${label} ${isth ? "กราฟราคาจากเซิร์ฟเวอร์" : "server price chart"}`}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label} candlestick chart`} onPointerMove={(e) => setHover(e.clientX - e.currentTarget.getBoundingClientRect().left)} onPointerLeave={() => setHover(null)}>
        {values.length > 0 && [0, 1, 2, 3, 4].map((i) => {
          const value = high - (high - low) * i / 4;
          return <g key={i}><line x1="0" x2={width - right} y1={y(value)} y2={y(value)} stroke="#1e293b" /><text x={width - right + 6} y={y(value) + 4} fill="#64748b" fontSize="10">{price(value)}</text></g>;
        })}
        {bars.map((c, i) => {
          const color = c.close >= c.open ? "#34d399" : "#fb7185";
          return <g key={c.time}><line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} stroke={color} /><rect x={x(i) - spacing * 0.3} y={Math.min(y(c.open), y(c.close))} width={Math.max(1, spacing * 0.6)} height={Math.max(1.5, Math.abs(y(c.open) - y(c.close)))} fill={color} />{i % Math.max(1, Math.ceil(bars.length / 4)) === 0 && <text x={x(i)} y={height - 9} textAnchor="middle" fill="#64748b" fontSize="10">{new Date(c.time).toLocaleTimeString(isth ? "th-TH" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</text>}</g>;
        })}
        {quote && ([{ value: quote.bid, color: "#fb7185", label: "BID" }, { value: quote.ask, color: "#34d399", label: "ASK" }]).map((line) => <g key={line.label}><line x1="0" x2={width - right} y1={y(line.value)} y2={y(line.value)} stroke={line.color} strokeDasharray="4 4" opacity="0.7" /><rect x={width - right} y={y(line.value) - 8} width={right} height="16" rx="2" fill={line.color} /><text x={width - right + 4} y={y(line.value) + 3} fill="#0b1120" fontSize="10" fontWeight="bold">{price(line.value)}</text></g>)}
        {hover != null && <line x1={hover} x2={hover} y1="30" y2={height - 30} stroke="#64748b" strokeDasharray="3 3" />}
      </svg>
      <div className="pointer-events-none absolute top-2 left-3 right-3 text-[10px] text-slate-400">
        <span className="font-bold text-slate-200 mr-2">{label}</span>
        {selected && <span className="font-mono">O {price(selected.open)} H {price(selected.high)} L {price(selected.low)} C {price(selected.close)}</span>}
      </div>
      {bars.length === 0 && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-500 px-8 text-center">{quote?.indicative ? (isth ? "มีเพียงเรตรายวัน • รอฟีดราคาสดเพื่อสร้างแท่งเทียน" : "Daily reference only • waiting for live candles") : (isth ? "รอราคาจากเซิร์ฟเวอร์เพื่อเริ่มกราฟ" : "Waiting for server prices to start the chart")}</div>}
      <p className="pointer-events-none absolute bottom-8 left-3 right-3 text-[9px] text-slate-500">{isth ? "แท่งเทียนจากราคาที่รับจริง • ประวัติเริ่มเมื่อเซิร์ฟเวอร์ทำงาน • เส้นแดง Bid / เขียว Ask" : "Observed server candles • History since server start • Red Bid / Green Ask"}</p>
    </div>
  );
}
