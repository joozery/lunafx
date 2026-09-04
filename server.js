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
  transports: ['websocket'], // WebSocket only — avoids HTTP polling conflict with Next.js
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

/* ─── Yahoo Finance symbol map ─── */
const YF_MAP = {
  XAUUSD: 'XAUUSD=X',
  EURUSD: 'EURUSD=X',
  GBPUSD: 'GBPUSD=X',
  USDJPY: 'USDJPY=X',
  USDCHF: 'USDCHF=X',
  AUDUSD: 'AUDUSD=X',
  USDCAD: 'USDCAD=X',
  NZDUSD: 'NZDUSD=X',
  BTCUSD: 'BTC-USD',
  ETHUSD: 'ETH-USD',
  USOIL:  'CL=F',
  US30:   '^DJI',
};

const reverseMap = Object.fromEntries(
  Object.entries(YF_MAP).map(([id, yf]) => [yf, id])
);

let lastPrices = {};

async function fetchAndBroadcast() {
  try {
    const symbols = Object.values(YF_MAP).join(',');
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbols)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      console.warn(`[prices] Yahoo Finance responded ${res.status}`);
      return;
    }

    const json = await res.json();
    const quotes = json?.quoteResponse?.result ?? [];

    const prices = {};
    for (const q of quotes) {
      const id = reverseMap[q.symbol];
      if (!id) continue;
      const mid = q.regularMarketPrice ?? 0;
      prices[id] = {
        mid,
        bid: q.bid > 0 ? q.bid : mid,
        ask: q.ask > 0 ? q.ask : mid,
        change: q.regularMarketChange ?? 0,
        changePct: q.regularMarketChangePercent ?? 0,
      };
    }

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

  // Push last known prices immediately so client doesn't wait 5s
  if (Object.keys(lastPrices).length > 0) {
    socket.emit('prices', lastPrices);
  }

  socket.on('disconnect', (reason) => {
    console.log(`\n[ws] -${socket.id.slice(0, 8)} (${reason})`);
  });
});

/* ─── Price broadcast loop ─── */
fetchAndBroadcast();
const priceInterval = setInterval(fetchAndBroadcast, 5000);

process.on('SIGTERM', () => {
  clearInterval(priceInterval);
  process.exit(0);
});

/* ─── Boot Next.js then start listening ─── */
nextApp.prepare().then(() => {
  httpServer.on('request', (req, res) => {
    handle(req, res);
  });

  httpServer.listen(PORT, () => {
    console.log(`\n> Ready at http://localhost:${PORT} [${dev ? 'dev' : 'prod'}]`);
    console.log('> Socket.IO broadcasting live prices every 5s');
  });
});
