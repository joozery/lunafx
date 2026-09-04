import { NextResponse } from "next/server";

const YF_MAP: Record<string, string> = {
  XAUUSD: "XAUUSD=X",
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  USDCHF: "USDCHF=X",
  AUDUSD: "AUDUSD=X",
  USDCAD: "USDCAD=X",
  NZDUSD: "NZDUSD=X",
  BTCUSD: "BTC-USD",
  ETHUSD: "ETH-USD",
  USOIL:  "CL=F",
  US30:   "^DJI",
};

export const revalidate = 0;

export async function GET() {
  try {
    const yfSymbols = Object.values(YF_MAP).join(",");
    const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(yfSymbols)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Yahoo status ${res.status}`);

    const json = await res.json();
    const quotes: Record<string, any>[] = json?.quoteResponse?.result ?? [];

    const reverse: Record<string, string> = {};
    for (const [id, yf] of Object.entries(YF_MAP)) reverse[yf] = id;

    type PriceEntry = { bid: number; ask: number; mid: number; change: number; changePct: number };
    const prices: Record<string, PriceEntry> = {};

    for (const q of quotes) {
      const id = reverse[q.symbol as string];
      if (!id) continue;
      const mid: number = q.regularMarketPrice ?? 0;
      prices[id] = {
        mid,
        bid: q.bid > 0 ? q.bid : mid,
        ask: q.ask > 0 ? q.ask : mid,
        change: q.regularMarketChange ?? 0,
        changePct: q.regularMarketChangePercent ?? 0,
      };
    }

    return NextResponse.json({ ok: true, prices }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, prices: {}, error: String(e) });
  }
}
