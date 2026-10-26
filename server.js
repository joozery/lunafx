// Custom Next.js server with Socket.IO for real-time price broadcasting
const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const crypto = require('crypto');
const { recordCandle } = require('./lib/price-history.cjs');
const { loadEnvConfig } = require('@next/env');

const PORT = parseInt(process.env.PORT || '3002', 10);
const dev = process.env.NODE_ENV !== 'production';

// loadEnvConfig snapshots process.env on its first call and restores that snapshot whenever
// Next reloads env (e.g. after a .env edit). Next only sets __NEXT_DEV_SERVER later, in
// prepare(), so without this the reload deletes it and every route 500s looking for
// production-only files such as .next/dev/required-server-files.json.
if (dev) process.env.__NEXT_DEV_SERVER = '1';

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
// Every forex symbol as base/quote; the daily USD table gives any cross as rates[quote] / rates[base]
const FOREX_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  'EURJPY', 'GBPJPY', 'AUDJPY', 'NZDJPY', 'CADJPY', 'CHFJPY', 'EURGBP', 'EURAUD', 'EURCHF', 'GBPCHF',
];

async function fetchForexPrices() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return {};
  const { rates, time_last_update_unix } = await res.json();
  const out = {};
  rates.USD = 1;
  for (const id of FOREX_PAIRS) {
    const base = rates[id.slice(0, 3)], quote = rates[id.slice(3)];
    if (!base || !quote) continue;
    const mid = quote / base;
    const spread = mid * 0.00015; // ~1.5 pip spread
    out[id] = {
      mid,
      bid: mid - spread,
      ask: mid + spread,
      change: 0,
      changePct: 0,
      ts: time_last_update_unix ? time_last_update_unix * 1000 : Date.now(),
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

function pauseYahoo(res) {
  yfBackoffMs = Math.min((yfBackoffMs || 30_000) * 2, 300_000);
  const retryAfter = res.headers.get('retry-after');
  const retryMs = retryAfter == null ? 0 : /^\d+$/.test(retryAfter)
    ? Number(retryAfter) * 1000
    : Math.max(0, Date.parse(retryAfter) - Date.now()) || 0;
  const delay = Math.max(yfBackoffMs, retryMs);
  yfBackoffUntil = Date.now() + delay;
  console.warn(`\n[prices] YF 429 — pausing ${Math.ceil(delay / 1000)}s`);
}

async function refreshYFSession() {
  const cookieRes = await fetch('https://fc.yahoo.com', {
    headers: { 'User-Agent': YF_UA },
    signal: AbortSignal.timeout(8000),
  });
  if (cookieRes.status === 429) {
    pauseYahoo(cookieRes);
    return;
  }
  const setCookies = cookieRes.headers.getSetCookie?.() ?? [];
  const cookies = setCookies.map(c => c.split(';')[0]).join('; ');

  const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': YF_UA, 'Cookie': cookies },
    signal: AbortSignal.timeout(8000),
  });
  if (crumbRes.status === 429) {
    pauseYahoo(crumbRes);
    return;
  }
  if (!crumbRes.ok) throw new Error(`Yahoo session HTTP ${crumbRes.status}`);
  const crumb = (await crumbRes.text()).trim();

  if (!crumb || /\s/.test(crumb) || crumb.length > 50) {
    throw new Error('Yahoo returned an invalid session crumb');
  }
  yfSession = { cookies, crumb };
  console.log('\n[prices] YF session refreshed');
}

async function fetchYahooPrices() {
  if (Date.now() < yfBackoffUntil) return {};
  if (!yfSession.crumb) {
    await refreshYFSession();
    if (!yfSession.crumb || Date.now() < yfBackoffUntil) return {};
  }

  const symbols = Object.values(YF_MAP).join(',');
  const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbols)}&crumb=${encodeURIComponent(yfSession.crumb)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': YF_UA, 'Cookie': yfSession.cookies },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    if (res.status === 429) {
      pauseYahoo(res);
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
const candleHistory = {};
const wsTickAt = {};          // symbol id → ms timestamp of last websocket tick
let dirty = false;

const isLive = (id) => Date.now() - (wsTickAt[id] ?? 0) < WS_FRESH_MS;

function applyTick(id, bid, ask) {
  if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask < bid) return;
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
  recordCandle(candleHistory, id, lastPrices[id].mid, lastPrices[id].ts);
  wsTickAt[id] = lastPrices[id].ts;
  dirty = true;
}

function applyRest(fresh) {
  for (const [id, q] of Object.entries(fresh)) {
    if (![q.mid, q.bid, q.ask].every(Number.isFinite) || q.bid <= 0 || q.ask < q.bid) continue;
    // A daily reference rate must never replace the last executable tick (even if stale).
    if (q.indicative && lastPrices[id] && !lastPrices[id].indicative) continue;
    if (isLive(id)) {
      // keep the live bid/ask, only refresh the 24h stats
      lastPrices[id] = { ...lastPrices[id], change: q.change, changePct: q.changePct };
    } else {
      lastPrices[id] = { ...q, src: 'rest', ts: q.ts ?? Date.now() };
      if (!q.indicative) recordCandle(candleHistory, id, q.mid, lastPrices[id].ts);
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

/* FastForex: the plan allows 2 connections of ~10 symbols each, so symbols are split
   across two connections. Note: subscribe must wait for the auth ack, otherwise the server answers 401. */
const FF_KEY = (process.env.FASTFOREX_WS_API_KEY || process.env.FASTFOREX_API_KEY || '').trim();
const FF_CONNECTIONS = [
  { name: 'fastforex', fx: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'], metals: ['XAUUSD', 'XAGUSD'] },
  { name: 'fastforex-2', fx: ['EURJPY', 'GBPJPY', 'AUDJPY', 'NZDJPY', 'CADJPY', 'CHFJPY', 'EURGBP', 'EURAUD', 'EURCHF', 'GBPCHF'], metals: [] },
];

if (FF_KEY) {
  for (const { name, fx, metals } of FF_CONNECTIONS) {
    connectFeed(name, 'wss://fastforex.wsdx.io', {
      onOpen: (ws) => ws.send(JSON.stringify({ op: 'auth', key: FF_KEY })),
      onMessage: (m, { ws, stop }) => {
        if (m.op === 'price') {
          applyTick(m.sym, parseFloat(m.bid), parseFloat(m.ask));
        } else if (m.op === 'auth') {
          if (m.status === 200) {
            if (fx.length)     ws.send(JSON.stringify({ op: 'subscribe', stream: 'fx',     pairs: fx }));
            if (metals.length) ws.send(JSON.stringify({ op: 'subscribe', stream: 'metals', pairs: metals }));
          } else {
            console.error(`[${name}] auth failed (${m.status}): ${m.msg} — using REST fallback only`);
            stop();
          }
        } else if (m.op === 'subscribe' && m.status !== 200) {
          console.warn(`[${name}] subscribe failed (${m.status}): ${m.msg}`);
        }
      },
    });
  }
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
  socket.emit('candle-history', candleHistory);
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
  io.emit('candle-update', Object.fromEntries(Object.entries(candleHistory).map(([id, bars]) => [id, [bars.at(-1)]])));
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
    console.log('> Live ticks: Binance WS (BTC/ETH) + FastForex WS x2 (forex/gold/silver) | Oil/US30: Yahoo REST every 30s');
    startRiskLoop();
  });
});

/* ══════════════════════════════════════════
   RISK ENGINE — SL/TP, stop-out and negative balance protection run in
   /api/internal/risk; this loop only triggers it. On by default in production;
   in dev it must be enabled with RISK_ENGINE=on, because a local server may be
   pointed at the live database and would otherwise close real clients' positions.
═══════════════════════════════════════════ */
const RISK_INTERVAL_MS = 2_000;
const RISK_TOKEN = process.env.SESSION_SECRET
  ? crypto.createHash('sha256').update(`${process.env.SESSION_SECRET}:internal-risk`).digest('hex')
  : null;

function startRiskLoop() {
  const flag = (process.env.RISK_ENGINE || '').toLowerCase();
  const enabled = flag ? flag === 'on' : !dev;
  if (!enabled || !RISK_TOKEN) {
    console.log(`> Risk engine: OFF${RISK_TOKEN ? ' (set RISK_ENGINE=on to enable)' : ' (SESSION_SECRET missing)'}`);
    return;
  }
  console.log(`> Risk engine: ON (SL/TP + stop-out every ${RISK_INTERVAL_MS / 1000}s)`);

  let running = false;
  setInterval(async () => {
    if (running) return; // never overlap runs
    running = true;
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/api/internal/risk`, {
        method: 'POST',
        headers: { 'x-internal-token': RISK_TOKEN },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        const { closed } = await res.json();
        for (const c of closed ?? []) console.log(`[risk] closed ${c.tradeId} (${c.reason}) pnl=${c.pnl}`);
      } else {
        console.warn(`[risk] check failed: HTTP ${res.status}`);
      }
    } catch (e) {
      console.warn(`[risk] check failed: ${e.message}`);
    } finally {
      running = false;
    }
  }, RISK_INTERVAL_MS);
}
