import { createHash } from "crypto";
import { conversionSymbols, type Mids } from "@/lib/pnl";

export type Quote = { bid: number; ask: number };

/**
 * Latest tradable bid/ask from the price feed held by server.js.
 * Returns null when there is no fresh, executable price (feed down, market closed).
 * Orders must be filled from this, never from a price sent by the browser.
 */
export async function getServerQuote(symbol: string): Promise<Quote | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  // must match QUOTE_TOKEN in server.js
  const token = createHash("sha256").update(`${secret}:internal-quote`).digest("hex");
  const port = process.env.PORT || "3002";

  try {
    const res = await fetch(`http://127.0.0.1:${port}/internal/quote?symbol=${encodeURIComponent(symbol)}`, {
      headers: { "x-internal-token": token },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d.ok ? { bid: d.bid, ask: d.ask } : null;
  } catch {
    return null;
  }
}

/** Mids of the USD pairs needed to value `symbols` in USD (for cross pairs like EURJPY). */
export async function getConversionMids(symbols: string[]): Promise<Mids> {
  const needed = [...new Set(symbols.flatMap(conversionSymbols))];
  const mids: Mids = {};
  await Promise.all(needed.map(async (s) => {
    const q = await getServerQuote(s);
    if (q) mids[s] = (q.bid + q.ask) / 2;
  }));
  return mids;
}
