// Custom Next.js server with Socket.IO for real-time price broadcasting
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const crypto = require('crypto');
const { loadEnvConfig } = require('@next/env');

const PORT = parseInt(process.env.PORT || '3002', 10);
const dev = process.env.NODE_ENV !== 'production';

// Load .env* files up front so FASTFOREX_API_KEY / SESSION_SECRET are set before we read them below
loadEnvConfig(process.cwd(), dev);

const httpServer = createServer();
const nextApp = next({ dev, port: PORT, hostname: 'localhost' });
const handle = nextApp.getRequestHandler();

const io = new Server(httpServer, {
  transports: ['websocket'],
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

/* ══════════════════════════════════════════
   SOURCE A: Binance — BTC & ETH
   REST (24h change stats + fallback); live ticks come from the websocket feed below
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
   SOURCE B: open.er-api.com — forex pairs, FALLBACK ONLY (daily rate, ~1.5 pip synthetic spread)
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
      indicative: true,   // daily rate: fine to display, never used to execute trades
    };
  }
  return out;
}

/* ══════════════════════════════════════════
   SOURCE C: Coinbase — XAUUSD gold spot price, FALLBACK ONLY (polled)
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
   PRICE STORE — websocket ticks are the primary source; the REST
   fetchers above only fill in symbols with no recent websocket tick
   (and supply 24h change stats). No simulated prices.
═══════════════════════════════════════════ */
const WS_FRESH_MS = 10_000;   // a websocket tick newer than this beats REST data
const EMIT_MS     = 250;      // max broadcast rate to browsers (~4/s)

let lastPrices = {};
const wsTickAt = {};          // symbol id → ms timestamp of last websocket tick
let dirty = false;

const isLive = (id) => Date.now() - (wsTickAt[id] ?? 0) < WS_FRESH_MS;

function applyTick(id, bid, ask) {
  if (!(bid > 0) || !(ask > 0)) return;
  const prev = lastPrices[id];
  lastPrices[id] = {
    mid: (bid + ask) / 2,
    bid,
    ask,
    change:    prev?.change    ?? 0,
    changePct: prev?.changePct ?? 0,
    src: 'ws',
    ts: Date.now(),
  };
  wsTickAt[id] = Date.now();
  dirty = true;
}

function applyRest(fresh) {
  for (const [id, q] of Object.entries(fresh)) {
    if (isLive(id)) {
      // keep the live bid/ask, only refresh the 24h stats
      lastPrices[id] = { ...lastPrices[id], change: q.change, changePct: q.changePct };
    } else {
      lastPrices[id] = { ...q, src: 'rest', ts: Date.now() };
    }
  }
  dirty = true;
}

/* ══════════════════════════════════════════
   TRADE QUOTES — the API routes execute orders at server-side prices only.
   A quote is tradable if it is a fresh websocket tick, or a recent REST
   price that is not merely indicative. Otherwise (e.g. forex market closed,
   feed down) orders are rejected instead of filled at a stale price.
═══════════════════════════════════════════ */
const REST_TRADABLE_MS = 60_000;

function tradableQuote(id) {
  const q = lastPrices[id];
  if (!q || q.indicative) return null;
  if (isLive(id)) return q;
  if (q.src === 'rest' && Date.now() - q.ts < REST_TRADABLE_MS) return q;
  return null;
}

// Shared secret so only our own API routes (via loopback) can read quotes
const QUOTE_TOKEN = process.env.SESSION_SECRET
  ? Buffer.from(crypto.createHash('sha256').update(`${process.env.SESSION_SECRET}:internal-quote`).digest('hex'))
  : null;

function handleQuote(req, res) {
  const got = Buffer.from(String(req.headers['x-internal-token'] ?? ''));
  if (!QUOTE_TOKEN || got.length !== QUOTE_TOKEN.length || !crypto.timingSafeEqual(got, QUOTE_TOKEN)) {
    res.statusCode = 404;
    return res.end();
  }
  const id = new URL(req.url, 'http://localhost').searchParams.get('symbol') ?? '';
  const q = tradableQuote(id);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (!q) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ ok: false }));
  }
  res.end(JSON.stringify({ ok: true, bid: q.bid, ask: q.ask }));
}

/* ══════════════════════════════════════════
   WEBSOCKET FEEDS — Binance (BTC/ETH) and FastForex (forex + gold)
═══════════════════════════════════════════ */
function connectFeed(name, url, { onOpen, onMessage }) {
  let ws = null;
  let retry = 0;
  let stopped = false;

  const scheduleReconnect = () => {
    if (stopped) return;
    const delay = Math.min(1000 * 2 ** retry++, 30_000) + Math.random() * 500;
    console.warn(`[${name}] reconnecting in ${Math.round(delay / 1000)}s`);
    setTimeout(open, delay);
  };

  function open() {
    let alive = true;
    ws = new WebSocket(url);

    // detect half-dead connections: a ping must be answered within one interval
    const heartbeat = setInterval(() => {
      if (!alive) { ws.terminate(); return; }
      alive = false;
      try { ws.ping(); } catch {}
    }, 20_000);

    ws.on('pong', () => { alive = true; });
    ws.on('open', () => { retry = 0; console.log(`[${name}] connected`); onOpen?.(ws); });
    ws.on('message', (raw) => {
      alive = true;
      try { onMessage(JSON.parse(raw.toString()), { ws, stop: () => { stopped = true; ws.close(); } }); } catch {}
    });
    ws.on('error', (e) => console.warn(`[${name}] error: ${e.message}`));
    ws.on('close', () => { clearInterval(heartbeat); scheduleReconnect(); });
  }

  open();
}

/* Binance: best bid/ask for BTC & ETH on every book update */
const BINANCE_MAP = { BTCUSDT: 'BTCUSD', ETHUSDT: 'ETHUSD' };
connectFeed('binance', 'wss://stream.binance.com:9443/stream?streams=btcusdt@bookTicker/ethusdt@bookTicker', {
  onMessage: ({ data }) => {
    const id = BINANCE_MAP[data?.s];
    if (id) applyTick(id, parseFloat(data.b), parseFloat(data.a));
  },
});

/* FastForex: 7 forex pairs + XAUUSD over one connection (plan limit: 2 connections).
   Note: subscribe must wait for the auth ack, otherwise the server answers 401. */
const FF_KEY   = process.env.FASTFOREX_API_KEY;
const FF_FX    = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'];
const FF_METAL = ['XAUUSD'];

if (FF_KEY) {
  connectFeed('fastforex', 'wss://fastforex.wsdx.io', {
    onOpen: (ws) => ws.send(JSON.stringify({ op: 'auth', key: FF_KEY })),
    onMessage: (m, { ws, stop }) => {
      if (m.op === 'price') {
        applyTick(m.sym, parseFloat(m.bid), parseFloat(m.ask));
      } else if (m.op === 'auth') {
        if (m.status === 200) {
          ws.send(JSON.stringify({ op: 'subscribe', stream: 'fx',     pairs: FF_FX }));
          ws.send(JSON.stringify({ op: 'subscribe', stream: 'metals', pairs: FF_METAL }));
        } else {
          console.error(`[fastforex] auth failed (${m.status}): ${m.msg} — using REST fallback only`);
          stop();
        }
      } else if (m.op === 'subscribe' && m.status !== 200) {
        console.warn(`[fastforex] subscribe failed (${m.status}): ${m.msg}`);
      }
    },
  });
} else {
  console.warn('[fastforex] FASTFOREX_API_KEY not set — forex/gold fall back to delayed REST data');
}

/* ─── REST poll (fallback + 24h stats + Yahoo oil/US30) ─── */
async function fetchAndBroadcast() {
  try {
    const [cryptoR, forexR, goldR, yahooR] = await Promise.allSettled([
      fetchCryptoPrices(),
      fetchForexPrices(),
      fetchGoldPrice(),
      fetchYahooPrices(),
    ]);

    applyRest({
      ...(forexR.status  === 'fulfilled' ? forexR.value  : {}),
      ...(goldR.status   === 'fulfilled' ? goldR.value   : {}),
      ...(yahooR.status  === 'fulfilled' ? yahooR.value  : {}),
      ...(cryptoR.status === 'fulfilled' ? cryptoR.value : {}),
    });
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

// REST poll every 30s: oil/US30 (Yahoo), 24h stats, and fallback when a websocket feed is down
const priceInterval = setInterval(fetchAndBroadcast, 30_000);

// Crypto REST fallback every 5s — only fires while the Binance websocket is not delivering
setInterval(async () => {
  if (isLive('BTCUSD') && isLive('ETHUSD')) return;
  try {
    const crypto = await fetchCryptoPrices();
    if (Object.keys(crypto).length > 0) applyRest(crypto);
  } catch {}
}, 5_000);

// Broadcast to browsers, coalescing ticks into at most one message per EMIT_MS
const emitInterval = setInterval(() => {
  if (!dirty) return;
  dirty = false;
  io.emit('prices', lastPrices);
}, EMIT_MS);

process.on('SIGTERM', () => {
  clearInterval(priceInterval);
  clearInterval(emitInterval);
  process.exit(0);
});

/* ─── Boot Next.js then start listening ─── */
nextApp.prepare().then(() => {
  httpServer.on('request', (req, res) => {
    if (req.url && req.url.startsWith('/internal/quote')) return handleQuote(req, res);
    handle(req, res);
  });

  httpServer.listen(PORT, () => {
    console.log(`\n> Ready at http://localhost:${PORT} [${dev ? 'dev' : 'prod'}]`);
    console.log('> Live ticks: Binance WS (BTC/ETH) + FastForex WS (forex/gold) | Oil/US30: Yahoo REST every 30s');
  });
});
