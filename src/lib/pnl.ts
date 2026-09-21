// USD P&L for a 1.0 lot position per 1.0 move in price, keyed by symbol id.
// Shared by the WebTrader (live P&L) and /api/trades (P&L stored on close)
// so the number shown while a trade is open equals the number saved when it closes.
export const PNL_FACTOR: Record<string, number> = {
  XAUUSD: 100,
  EURUSD: 100000,
  GBPUSD: 100000,
  USDJPY: 650,
  USDCHF: 110000,
  AUDUSD: 100000,
  USDCAD: 75000,
  NZDUSD: 100000,
  BTCUSD: 1,
  ETHUSD: 1,
  USOIL: 1000,
  US30: 1,
};

export function calcTradePnl(
  type: string,
  symbol: string,
  openPrice: number,
  currentPrice: number,
  volume: number,
): number {
  const dir = type === "buy" ? 1 : -1;
  return dir * (currentPrice - openPrice) * volume * (PNL_FACTOR[symbol] ?? 1);
}

// Units of the base instrument per 1.0 lot, used for margin.
const CONTRACT_SIZE: Record<string, number> = {
  XAUUSD: 100,
  EURUSD: 100000,
  GBPUSD: 100000,
  USDJPY: 100000,
  USDCHF: 100000,
  AUDUSD: 100000,
  USDCAD: 100000,
  NZDUSD: 100000,
  BTCUSD: 1,
  ETHUSD: 1,
  USOIL: 1000,
  US30: 1,
};

// Pairs where USD is the base currency: the notional is already in USD.
const USD_BASE = new Set(["USDJPY", "USDCHF", "USDCAD"]);

/** "1:500" → 500 (falls back to 500 when missing or malformed). */
export function parseLeverage(leverage: unknown): number {
  const m = /(\d+)\s*$/.exec(String(leverage ?? ""));
  const n = m ? Number(m[1]) : 500;
  return n >= 1 ? n : 500;
}

/** USD margin needed to open `volume` lots at `price`, rounded up to the cent. */
export function marginRequired(symbol: string, volume: number, price: number, leverage: number): number {
  const size = CONTRACT_SIZE[symbol] ?? 1;
  const notional = USD_BASE.has(symbol) ? volume * size : volume * size * price;
  return Math.ceil((notional / leverage) * 100) / 100;
}
