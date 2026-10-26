// Contract specs and USD P&L / margin, keyed by symbol id.
// Shared by the WebTrader (live P&L), /api/trades (P&L stored on close) and the risk engine
// so the number shown while a trade is open equals the number saved when it closes.

export interface SymbolSpec {
  base: string;  // what one unit of the contract is
  quote: string; // currency the price is quoted in (P&L accrues in this)
  size: number;  // units of base per 1.0 lot
}

const FX = (pair: string): SymbolSpec => ({ base: pair.slice(0, 3), quote: pair.slice(3), size: 100000 });

export const SYMBOL_SPECS: Record<string, SymbolSpec> = {
  XAUUSD: { base: "XAU", quote: "USD", size: 100 },
  XAGUSD: { base: "XAG", quote: "USD", size: 5000 },
  EURUSD: FX("EURUSD"),
  GBPUSD: FX("GBPUSD"),
  USDJPY: FX("USDJPY"),
  USDCHF: FX("USDCHF"),
  AUDUSD: FX("AUDUSD"),
  USDCAD: FX("USDCAD"),
  NZDUSD: FX("NZDUSD"),
  EURJPY: FX("EURJPY"),
  GBPJPY: FX("GBPJPY"),
  AUDJPY: FX("AUDJPY"),
  NZDJPY: FX("NZDJPY"),
  CADJPY: FX("CADJPY"),
  CHFJPY: FX("CHFJPY"),
  EURGBP: FX("EURGBP"),
  EURAUD: FX("EURAUD"),
  EURCHF: FX("EURCHF"),
  GBPCHF: FX("GBPCHF"),
  BTCUSD: { base: "BTC", quote: "USD", size: 1 },
  ETHUSD: { base: "ETH", quote: "USD", size: 1 },
  USOIL:  { base: "OIL", quote: "USD", size: 1000 },
  US30:   { base: "US30", quote: "USD", size: 1 },
};

// Used only when no live price for the conversion pair is available
const FALLBACK_USD_PER_UNIT: Record<string, number> = {
  EUR: 1.12, GBP: 1.33, AUD: 0.70, NZD: 0.57, JPY: 1 / 157, CHF: 1.21, CAD: 0.71,
};

export type Mids = Record<string, number | undefined>;

/** USD value of one unit of `ccy`, from the mids of its USD pair (EURUSD or USDJPY style). */
export function usdPerUnit(ccy: string, mids: Mids): number | null {
  if (ccy === "USD") return 1;
  const direct = mids[`${ccy}USD`];
  if (direct && direct > 0) return direct;
  const inverse = mids[`USD${ccy}`];
  if (inverse && inverse > 0) return 1 / inverse;
  return FALLBACK_USD_PER_UNIT[ccy] ?? null;
}

/** USD pairs whose prices are needed to value `symbol` in USD. */
export function conversionSymbols(symbol: string): string[] {
  const spec = SYMBOL_SPECS[symbol];
  if (!spec) return [];
  const pairFor = (ccy: string) => {
    if (ccy === "USD") return null;
    return SYMBOL_SPECS[`${ccy}USD`] ? `${ccy}USD` : SYMBOL_SPECS[`USD${ccy}`] ? `USD${ccy}` : null;
  };
  return [pairFor(spec.quote), pairFor(spec.base)].filter((s): s is string => !!s && s !== symbol);
}

export function calcTradePnl(
  type: string,
  symbol: string,
  openPrice: number,
  currentPrice: number,
  volume: number,
  mids: Mids = {},
): number {
  const spec = SYMBOL_SPECS[symbol] ?? { base: symbol, quote: "USD", size: 1 };
  const dir = type === "buy" ? 1 : -1;
  const pnlInQuote = dir * (currentPrice - openPrice) * volume * spec.size;
  if (spec.quote === "USD") return pnlInQuote;
  // USD-based pair (USDJPY): convert with the pair's own current price — exact
  if (spec.base === "USD") return pnlInQuote / currentPrice;
  const rate = usdPerUnit(spec.quote, mids);
  return rate ? pnlInQuote * rate : 0;
}

/** "1:500" → 500 (falls back to 500 when missing or malformed). */
export function parseLeverage(leverage: unknown): number {
  const m = /(\d+)\s*$/.exec(String(leverage ?? ""));
  const n = m ? Number(m[1]) : 500;
  return n >= 1 ? n : 500;
}

/** USD margin needed to open `volume` lots at `price`, rounded up to the cent. */
export function marginRequired(symbol: string, volume: number, price: number, leverage: number, mids: Mids = {}): number {
  const spec = SYMBOL_SPECS[symbol] ?? { base: symbol, quote: "USD", size: 1 };
  let notionalUsd: number;
  if (spec.quote === "USD") notionalUsd = volume * spec.size * price;
  else if (spec.base === "USD") notionalUsd = volume * spec.size;
  else notionalUsd = volume * spec.size * (usdPerUnit(spec.base, mids) ?? price);
  // toFixed strips float noise (112.00000000000001) so it is not rounded up a whole cent
  return Math.ceil(Number(((notionalUsd / leverage) * 100).toFixed(6))) / 100;
}
