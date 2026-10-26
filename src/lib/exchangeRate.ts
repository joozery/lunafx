import "server-only";
import type { Db } from "mongodb";

export const EXCHANGE_RATE_KEY = "exchangeRate";

export interface ExchangeRateSetting {
  mode: "live" | "fixed";
  depositRate: number;    // fixed mode: THB per 1 USD when the customer deposits
  withdrawRate: number;   // fixed mode: THB per 1 USD when the customer withdraws
  depositMarkup: number;  // live mode: THB added to the market rate for deposits
  withdrawMarkup: number; // live mode: THB taken off the market rate for withdrawals
}

export interface ExchangeRate {
  depositRate: number;
  withdrawRate: number;
  mode: "live" | "fixed";
  marketRate: number | null; // live USD/THB mid, when available
  updatedAt: string | null;
}

export const DEFAULT_EXCHANGE_SETTING: ExchangeRateSetting = {
  mode: "fixed",
  depositRate: 35,
  withdrawRate: 35,
  depositMarkup: 0.5,
  withdrawMarkup: 0.5,
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function getExchangeSetting(db: Db): Promise<ExchangeRateSetting> {
  const doc = await db.collection("settings").findOne({ key: EXCHANGE_RATE_KEY });
  return { ...DEFAULT_EXCHANGE_SETTING, ...(doc?.value ?? {}) };
}

/* Live USD/THB, cached for a minute: FastForex first, then a free daily source */
const CACHE_MS = 60_000;
let cache: { rate: number; at: number; updated: string } | null = null;

export async function getMarketUsdThb(): Promise<{ rate: number; updated: string } | null> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;

  const sources: (() => Promise<{ rate: number; updated: string } | null>)[] = [
    async () => {
      const key = process.env.FASTFOREX_API_KEY?.trim();
      if (!key) return null;
      const r = await fetch(`https://api.fastforex.io/fetch-one?from=USD&to=THB&api_key=${key}`, { signal: AbortSignal.timeout(5000), cache: "no-store" });
      if (!r.ok) return null;
      const d = await r.json();
      return d?.result?.THB > 0 ? { rate: d.result.THB, updated: d.updated ?? new Date().toISOString() } : null;
    },
    async () => {
      const r = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(5000), cache: "no-store" });
      if (!r.ok) return null;
      const d = await r.json();
      return d?.rates?.THB > 0 ? { rate: d.rates.THB, updated: d.time_last_update_utc ?? new Date().toISOString() } : null;
    },
  ];

  for (const source of sources) {
    try {
      const got = await source();
      if (got) {
        cache = { ...got, at: Date.now() };
        return got;
      }
    } catch {}
  }
  // Keep serving the last known market rate rather than dropping to the fixed fallback on a blip
  return cache;
}

export async function getExchangeRate(db: Db): Promise<ExchangeRate> {
  const s = await getExchangeSetting(db);
  if (s.mode === "live") {
    const market = await getMarketUsdThb();
    if (market) {
      return {
        mode: "live",
        depositRate: round2(market.rate + s.depositMarkup),
        withdrawRate: round2(Math.max(0.01, market.rate - s.withdrawMarkup)),
        marketRate: round2(market.rate * 1000) / 1000,
        updatedAt: market.updated,
      };
    }
    // no market data at all → fall back to the admin's fixed rates
  }
  return { mode: s.mode, depositRate: s.depositRate, withdrawRate: s.withdrawRate, marketRate: null, updatedAt: null };
}

export function isValidRate(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 1 && n <= 1000;
}

export function isValidMarkup(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 50;
}
