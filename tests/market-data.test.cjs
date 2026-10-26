const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { recordCandle } = require('../lib/price-history.cjs');
function loadTs(path) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports: module.exports, module });
  return module.exports;
}
const { aggregateCandles, mergeCandles, quoteStatus } = loadTs('src/lib/market-data.ts');
const { calcTradePnl } = loadTs('src/lib/pnl.ts');

test('all actual ticks form OHLC, with no fabricated bars over gaps', () => {
  const history = {};
  recordCandle(history, 'BTCUSD', 100, 60000);
  recordCandle(history, 'BTCUSD', 110, 61000);
  recordCandle(history, 'BTCUSD', 90, 62000);
  recordCandle(history, 'BTCUSD', 105, 63000);
  recordCandle(history, 'BTCUSD', 120, 240000);
  recordCandle(history, 'BTCUSD', 999, 10000);
  recordCandle(history, 'BTCUSD', Infinity, 250000);
  assert.deepEqual(history.BTCUSD, [
    { time: 60000, open: 100, high: 110, low: 90, close: 105 },
    { time: 240000, open: 120, high: 120, low: 120, close: 120 },
  ]);
  const aggregate = aggregateCandles(history.BTCUSD, '5');
  assert.equal(aggregate.length, 1);
  assert.equal(aggregate[0].open, 100);
  assert.equal(aggregate[0].close, 120);
  assert.equal(aggregate[0].high, 120);
  assert.equal(aggregate[0].low, 90);
});

test('reconnect snapshot and streamed bar updates replace instead of duplicating', () => {
  const first = { time: 60000, open: 100, high: 100, low: 100, close: 100 };
  const update = { ...first, high: 110, close: 110 };
  const bars = mergeCandles([first], [update]);
  assert.equal(bars.length, 1);
  assert.equal(bars[0].close, 110);
  assert.equal(first.close, 100);
});

test('daily, stale, disconnected and polled data must not be labelled live', () => {
  const now = 100000;
  const quote = { ts: now, src: 'ws' };
  assert.equal(quoteStatus(quote, true, now), 'live');
  assert.equal(quoteStatus(quote, false, now), 'disconnected');
  assert.equal(quoteStatus(quote, true, now + 10001), 'stale');
  assert.equal(quoteStatus({ ...quote, indicative: true }, true, now), 'indicative');
  assert.equal(quoteStatus({ ...quote, src: 'rest' }, true, now), 'polled');
  assert.equal(quoteStatus({ ...quote, src: 'rest' }, true, now + 60001), 'stale');
});

test('price store preserves live ticks over daily fallback; chart OHLC and P&L follow the same quote', () => {
  const source = fs.readFileSync('server.js', 'utf8');
  const start = source.indexOf('const WS_FRESH_MS');
  const end = source.indexOf('/* ═', start);
  const context = vm.createContext({ Date, recordCandle, Number });
  vm.runInContext(source.slice(start, end), context);
  vm.runInContext("applyTick('EURUSD', 1.10, 1.12); applyRest({ EURUSD: {mid: 1, bid: 0.99, ask: 1.01, change: 0, changePct: 0, indicative: true} });", context);
  let quote = vm.runInContext('lastPrices.EURUSD', context);
  assert.equal(quote.bid, 1.10);
  assert.equal(quote.src, 'ws');
  assert.equal(calcTradePnl('buy', 'EURUSD', 1.1, quote.bid, 0.01), 0);
  vm.runInContext("applyTick('EURUSD', 1.11, 1.13)", context);
  quote = vm.runInContext('lastPrices.EURUSD', context);
  assert.ok(Math.abs(calcTradePnl('buy', 'EURUSD', 1.1, quote.bid, 0.01) - 10) < 0.0001);
  assert.equal(vm.runInContext('candleHistory.EURUSD.at(-1).close', context), quote.mid);
  vm.runInContext("wsTickAt.EURUSD = 0; applyRest({ EURUSD: {mid: 1, bid: 0.99, ask: 1.01, change: 0, changePct: 0, indicative: true} });", context);
  assert.equal(vm.runInContext('lastPrices.EURUSD.bid', context), quote.bid);
});

test('history stays bounded to one day', () => {
  const history = {};
  for (let i = 0; i < 2000; i++) recordCandle(history, 'BTCUSD', 100, i * 60000);
  assert.equal(history.BTCUSD.length, 1440);
});

test('cross pairs convert P&L to USD; USD-base pairs use their own price', () => {
  const { calcTradePnl, marginRequired, conversionSymbols } = loadTs('src/lib/pnl.ts');
  // USDJPY: 1 lot, +1 yen at 160 → 100000 / 160 = $625
  assert.equal(calcTradePnl('buy', 'USDJPY', 159, 160, 1), 100000 / 160);
  // EURJPY: 1 lot +1 yen, USDJPY 160 → $625
  assert.equal(calcTradePnl('buy', 'EURJPY', 175, 176, 1, { USDJPY: 160 }), 100000 / 160);
  // EURGBP sell: 1 lot −0.001, GBPUSD 1.30 → +$130
  assert.ok(Math.abs(calcTradePnl('sell', 'EURGBP', 0.840, 0.839, 1, { GBPUSD: 1.30 }) - 130) < 1e-6);
  assert.deepEqual([...conversionSymbols('EURJPY')], ['USDJPY', 'EURUSD']);
  // EURJPY margin at 1:100 for 0.1 lot with EURUSD 1.12 → 10000*1.12/100 = $112
  assert.equal(marginRequired('EURJPY', 0.1, 176, 100, { EURUSD: 1.12 }), 112);
  assert.equal(marginRequired('XAUUSD', 0.01, 4000, 200), 20); // 1 oz × $4000 / 200
});
