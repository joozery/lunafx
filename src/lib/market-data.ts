export type MarketQuote = {
  bid: number; ask: number; mid: number; change: number; changePct: number;
  src?: "ws" | "rest"; ts?: number; indicative?: boolean;
};
export type Candle = { time: number; open: number; high: number; low: number; close: number };
export type CandleHistory = Record<string, Candle[]>;

export function mergeCandles(history: Candle[], updates: Candle[]): Candle[] {
  const byTime = new Map(history.map((c) => [c.time, c]));
  for (const candle of updates) byTime.set(candle.time, candle);
  return [...byTime.values()].sort((a, b) => a.time - b.time).slice(-1440);
}

export function aggregateCandles(candles: Candle[], timeframe: string): Candle[] {
  const minutes = timeframe === "D" ? 1440 : timeframe === "W" ? 10080 : Number(timeframe);
  const period = Math.max(1, minutes || 1) * 60_000;
  const result: Candle[] = [];
  for (const candle of candles) {
    const time = Math.floor(candle.time / period) * period;
    const previous = result.at(-1);
    if (previous?.time === time) {
      previous.high = Math.max(previous.high, candle.high);
      previous.low = Math.min(previous.low, candle.low);
      previous.close = candle.close;
    } else result.push({ ...candle, time });
  }
  return result;
}

export function quoteStatus(quote: MarketQuote | undefined, connected: boolean, now: number) {
  if (!connected) return "disconnected";
  if (!quote?.ts) return "waiting";
  if (quote.indicative) return "indicative";
  if (now - quote.ts > (quote.src === "ws" ? 10_000 : 60_000)) return "stale";
  return quote.src === "ws" ? "live" : "polled";
}
