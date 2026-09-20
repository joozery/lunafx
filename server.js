// Custom Next.js server with Socket.IO for real-time price broadcasting
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const PORT = parseInt(process.env.PORT || '3002', 10);
const dev = process.env.NODE_ENV !== 'production';

const httpServer = createServer();
const nextApp = next({ dev, port: PORT, hostname: 'localhost' });
const handle = nextApp.getRequestHandler();

const io = new Server(httpServer, {
  transports: ['websocket'],
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

/* ─── Symbol list (for drift fallback) ─── */
const ALL_IDS = ['XAUUSD','EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','USDCAD','NZDUSD','BTCUSD','ETHUSD','USOIL','US30'];

/* ══════════════════════════════════════════
   SOURCE A: Binance — BTC & ETH (free, no auth, very high rate limit)
═══════════════════════════════════════════ */
async function fetchCryptoPrices() {
  const res = await fetch(
    'https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22%2C%22ETHUSDT%22%5D',
    { signal: AbortSignal.timeout(6000) }
  );
  if (!res.ok) return {};
  const data = await res.json();
  const out = {};
  for (const t of data) {
    const id = t.symbol === 'BTCUSDT' ? 'BTCUSD' : 'ETHUSD';
    const last = parseFloat(t.lastPrice);
    const bid  = parseFloat(t.bidPrice) || last;
    const ask  = parseFloat(t.askPrice) || last;
    const mid  = (bid + ask) / 2;
    out[id] = {
      mid, bid, ask,
      change:    parseFloat(t.priceChange),
      changePct: parseFloat(t.priceChangePercent),
    };
  }
  return out;
}

/* ══════════════════════════════════════════
   SOURCE B: open.er-api.com — forex pairs (free, no key, hourly updates)
═══════════════════════════════════════════ */
const FOREX_CFG = {
  EURUSD: { code: 'EUR', invert: true  },
  GBPUSD: { code: 'GBP', invert: true  },
  USDJPY: { code: 'JPY', invert: false },
  USDCHF: { code: 'CHF', invert: false },
  AUDUSD: { code: 'AUD', invert: true  },
  USDCAD: { code: 'CAD', invert: false },
  NZDUSD: { code: 'NZD', invert: true  },
};

async function fetchForexPrices() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return {};
  const { rates } = await res.json();
  const out = {};
  for (const [id, { code, invert }] of Object.entries(FOREX_CFG)) {
    if (!rates[code]) continue;
    const mid = invert ? 1 / rates[code] : rates[code];
    const spread = mid * 0.00015; // ~1.5 pip spread
    out[id] = {
      mid,
      bid: mid - spread,
      ask: mid + spread,
      change: 0,
      changePct: 0,
    };
  }
  return out;
}

/* ══════════════════════════════════════════
   SOURCE C: Coinbase — XAUUSD gold spot price (free, no key)
═══════════════════════════════════════════ */
async function fetchGoldPrice() {
  const res = await fetch('https://api.coinbase.com/v2/prices/XAU-USD/spot', {
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return {};
  const data = await res.json();
  const mid = parseFloat(data?.data?.amount ?? 0);
  if (!mid) return {};
  const spread = mid * 0.0003;
  return {
    XAUUSD: { mid, bid: mid - spread, ask: mid + spread, change: 0, changePct: 0 },
  };
}

/* ══════════════════════════════════════════
   SOURCE D: Yahoo Finance — Oil, US30 (with cookie+crumb + backoff)
═══════════════════════════════════════════ */
const YF_MAP = { USOIL: 'CL=F', US30: '^DJI' };
const YF_REVERSE = Object.fromEntries(Object.entries(YF_MAP).map(([id, yf]) => [yf, id]));
const YF_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let yfSession     = { cookies: '', crumb: '' };
let yfBackoffUntil = 0;
let yfBackoffMs    = 0;

async function refreshYFSession() {
  const cookieRes = await fetch('https://fc.yahoo.com', {
    headers: { 'User-Agent': YF_UA },
    signal: AbortSignal.timeout(8000),
  });
  const setCookies = cookieRes.headers.getSetCookie?.() ?? [];
  const cookies = setCookies.map(c => c.split(';')[0]).join('; ');

  const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': YF_UA, 'Cookie': cookies },
    signal: AbortSignal.timeout(8000),
  });
  const crumb = await crumbRes.text();

  if (!crumb || crumb.includes(' ') || crumb.length > 50) {
    throw new Error(`Bad crumb: "${crumb.slice(0, 40)}"`);
  }
  yfSession = { cookies, crumb };
  console.log(`\n[prices] YF session refreshed (crumb: ${crumb.slice(0, 6)}…)`);
}

async function fetchYahooPrices() {
  if (Date.now() < yfBackoffUntil) return {};

  const symbols = Object.values(YF_MAP).join(',');
  const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbols)}&crumb=${encodeURIComponent(yfSession.crumb)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': YF_UA, 'Cookie': yfSession.cookies },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    if (res.status === 429) {
      yfBackoffMs    = Math.min((yfBackoffMs || 30_000) * 2, 300_000);
      yfBackoffUntil = Date.now() + yfBackoffMs;
      console.warn(`\n[prices] YF 429 — pausing ${yfBackoffMs / 1000}s`);
    } else if (res.status === 401 || res.status === 404) {
      await refreshYFSession();
    }
    return {};
  }

  yfBackoffMs    = 0;
  yfBackoffUntil = 0;

  const quotes = (await res.json())?.quoteResponse?.result ?? [];
  const out = {};
  for (const q of quotes) {
    const id = YF_REVERSE[q.symbol];
    if (!id) continue;
    const mid = q.regularMarketPrice ?? 0;
    out[id] = {
      mid,
      bid: q.bid > 0 ? q.bid : mid,
      ask: q.ask > 0 ? q.ask : mid,
      change:    q.regularMarketChange ?? 0,
      changePct: q.regularMarketChangePercent ?? 0,
    };
  }
  return out;
}

/* ══════════════════════════════════════════
   DRIFT — simulate tiny movement for symbols with stale data
   so the UI never looks frozen even when APIs are slow
═══════════════════════════════════════════ */
let lastPrices = {};

function applyDrift(fresh) {
  const result = { ...fresh };
  for (const id of ALL_IDS) {
    if (result[id]) continue;           // fresh data wins
    if (!lastPrices[id]) continue;      // nothing to drift from
    const last   = lastPrices[id];
    const drift  = 1 + (Math.random() - 0.5) * 0.0002; // ±0.01%
    const mid    = last.mid * drift;
    const spread = last.ask - last.bid;
    result[id] = {
      mid,
      bid: mid - spread / 2,
      ask: mid + spread / 2,
      change:    last.change,
      changePct: last.changePct,
    };
  }
  return result;
}

/* ─── Main broadcast ─── */
async function fetchAndBroadcast() {
  try {
    const [cryptoR, forexR, goldR, yahooR] = await Promise.allSettled([
      fetchCryptoPrices(),
      fetchForexPrices(),
      fetchGoldPrice(),
      fetchYahooPrices(),
    ]);

    const fresh = {
      ...(cryptoR.status === 'fulfilled' ? cryptoR.value : {}),
      ...(forexR.status  === 'fulfilled' ? forexR.value  : {}),
      ...(goldR.status   === 'fulfilled' ? goldR.value   : {}),
      ...(yahooR.status  === 'fulfilled' ? yahooR.value  : {}),
    };

    const prices = applyDrift(fresh);
    if (Object.keys(prices).length === 0) return;

    lastPrices = prices;
    io.emit('prices', prices);
    process.stdout.write(`\r[prices] ${Object.keys(prices).length} symbols → ${io.engine.clientsCount} clients`);
  } catch (e) {
    console.error('\n[prices] fetch error:', e.message);
  }
}

/* ─── Socket.IO connection handler ─── */
io.on('connection', (socket) => {
  console.log(`\n[ws] +${socket.id.slice(0, 8)}`);
  if (Object.keys(lastPrices).length > 0) {
    socket.emit('prices', lastPrices);
  }
  socket.on('disconnect', (reason) => {
    console.log(`\n[ws] -${socket.id.slice(0, 8)} (${reason})`);
  });
});

/* ─── Startup: init YF session, then start loops ─── */
refreshYFSession()
  .catch(e => console.warn('[prices] YF session init failed:', e.message))
  .finally(() => fetchAndBroadcast());

// Crypto every 5s (Binance has high rate limits)
setInterval(async () => {
  try {
    const crypto = await fetchCryptoPrices();
    if (Object.keys(crypto).length === 0) return;
    lastPrices = { ...lastPrices, ...crypto };
    io.emit('prices', lastPrices);
  } catch {}
}, 5_000);

// Forex + Yahoo every 30s
const priceInterval = setInterval(fetchAndBroadcast, 30_000);

process.on('SIGTERM', () => {
  clearInterval(priceInterval);
  process.exit(0);
});

/* ─── Boot Next.js then start listening ─── */
nextApp.prepare().then(() => {
  httpServer.on('request', (req, res) => { handle(req, res); });

  httpServer.listen(PORT, () => {
    console.log(`\n> Ready at http://localhost:${PORT} [${dev ? 'dev' : 'prod'}]`);
    console.log('> Crypto: Binance every 5s | Forex: ExchangeRate API every 30s | Gold/Oil/Index: Yahoo Finance every 30s');
  });
});
