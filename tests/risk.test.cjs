const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function loadTs(path) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports: module.exports, module });
  return module.exports;
}
const { slTpHit, marginLevel, stopOutOrder } = loadTs('src/lib/risk.ts');

test('buy SL/TP trigger on bid', () => {
  assert.equal(slTpHit('buy', 1.10, 1.20, { bid: 1.0999, ask: 1.1001 }), 'sl');
  assert.equal(slTpHit('buy', 1.10, 1.20, { bid: 1.2000, ask: 1.2002 }), 'tp');
  assert.equal(slTpHit('buy', 1.10, 1.20, { bid: 1.15, ask: 1.1502 }), null);
  // ask crossing SL alone must not close a buy
  assert.equal(slTpHit('buy', 1.10, null, { bid: 1.1001, ask: 1.0999 }), null);
});

test('sell SL/TP trigger on ask', () => {
  assert.equal(slTpHit('sell', 1.20, 1.10, { bid: 1.1998, ask: 1.2000 }), 'sl');
  assert.equal(slTpHit('sell', 1.20, 1.10, { bid: 1.0998, ask: 1.1000 }), 'tp');
  assert.equal(slTpHit('sell', null, null, { bid: 9, ask: 9 }), null);
});

test('margin level is null without used margin', () => {
  assert.equal(marginLevel(100, []), null);
  assert.equal(marginLevel(100, [{ id: 'a', margin: 50, pnl: -25 }]), 150);
});

test('no stop-out above the level', () => {
  assert.deepEqual([...stopOutOrder(100, [{ id: 'a', margin: 20, pnl: -50 }])], []); // 250%
});

test('stop-out closes the worst loser first and stops once recovered', () => {
  const positions = [
    { id: 'small', margin: 10, pnl: 5 },
    { id: 'big', margin: 10, pnl: -95 },
  ];
  // equity 10 / margin 20 = 50% → close "big"; then 100 - 95 + 5 = 10 / 10 = 100% → stop
  assert.deepEqual([...stopOutOrder(100, positions)], ['big']);
});

test('negative equity closes everything', () => {
  const positions = [{ id: 'a', margin: 5.74, pnl: -26 }];
  assert.deepEqual([...stopOutOrder(-309.13, positions)], ['a']);
});

const { calcCopyVolume, copyLossBreached, masterStats, riskScoreFromDrawdown } = loadTs('src/lib/copyRules.ts');

test('copy lot sizing rounds down and skips below 0.01', () => {
  assert.equal(calcCopyVolume(1, 10000, { mode: 'ratio', allocation: 1000 }), 0.1);
  assert.equal(calcCopyVolume(1, 10000, { mode: 'ratio', allocation: 50 }), 0);      // 0.005 → skip
  assert.equal(calcCopyVolume(0.3, 10000, { mode: 'ratio', allocation: 1000 }), 0.03);
  assert.equal(calcCopyVolume(1, 10000, { mode: 'ratio', allocation: 1999 }), 0.19); // never rounds up
  assert.equal(calcCopyVolume(2, 10000, { mode: 'fixed', allocation: 0, fixedLot: 0.05 }), 0.05);
  assert.equal(calcCopyVolume(0.4, 10000, { mode: 'multiplier', allocation: 0, multiplier: 0.5 }), 0.2);
  assert.equal(calcCopyVolume(1, 0, { mode: 'ratio', allocation: 1000 }), 0);
});

test('copy loss limit', () => {
  assert.equal(copyLossBreached(1000, 20, 0, -199), false);
  assert.equal(copyLossBreached(1000, 20, 98, -298), true);
  assert.equal(copyLossBreached(1000, 0, 0, -999), false); // no limit set
});

test('master stats from closed trades', () => {
  const st = masterStats([
    { pnl: 100, closeTime: '2026-01-01' },
    { pnl: -300, closeTime: '2026-01-02' },
    { pnl: 50, closeTime: '2026-01-03' },
  ], 1000, Date.parse('2026-01-10'));
  assert.equal(st.trades, 3);
  assert.equal(st.winRate, 66.67);
  assert.equal(st.totalPnl, -150);
  assert.equal(st.roiTotal, -15);
  assert.equal(st.maxDrawdown, 27.27); // 1100 → 800
  assert.equal(riskScoreFromDrawdown(27.27), 6);
});

const { calcPerformanceFee } = loadTs('src/lib/copyRules.ts');

test('performance fee uses a high-water mark', () => {
  // week 1: +100 profit at 20% → $20, mark moves to 100
  assert.deepEqual({ ...calcPerformanceFee(100, 0, 20) }, { fee: 20, newHighWaterMark: 100 });
  // week 2: fell back to +40 → nothing, mark stays at 100
  assert.deepEqual({ ...calcPerformanceFee(40, 100, 20) }, { fee: 0, newHighWaterMark: 100 });
  // week 3: recovered to +150 → fee only on the 50 above the mark
  assert.deepEqual({ ...calcPerformanceFee(150, 100, 20) }, { fee: 10, newHighWaterMark: 150 });
  // no fee configured / losses only
  assert.deepEqual({ ...calcPerformanceFee(500, 0, 0) }, { fee: 0, newHighWaterMark: 0 });
  assert.deepEqual({ ...calcPerformanceFee(-80, 0, 20) }, { fee: 0, newHighWaterMark: 0 });
  // rounds down to the cent
  assert.equal(calcPerformanceFee(33.33, 0, 15).fee, 4.99);
});

const { accountStopOutLevel } = loadTs('src/lib/risk.ts');

test('account stop-out level defaults to 50 and is clamped to 0–100', () => {
  assert.equal(accountStopOutLevel(undefined), 50);
  assert.equal(accountStopOutLevel(null), 50);
  assert.equal(accountStopOutLevel('abc'), 50);
  assert.equal(accountStopOutLevel(70), 70);
  assert.equal(accountStopOutLevel(0), 0);
  assert.equal(accountStopOutLevel(20), 20);
  assert.equal(accountStopOutLevel(-10), 0);
  assert.equal(accountStopOutLevel(150), 100);
  assert.equal(accountStopOutLevel(undefined, 0), 0);
  assert.equal(accountStopOutLevel(null, 30), 30);
  assert.equal(accountStopOutLevel(70, 0), 70);
});

test('higher stop-out level closes earlier', () => {
  const positions = [{ id: 'a', margin: 100, pnl: -930 }]; // equity 70 → 70%
  assert.deepEqual([...stopOutOrder(1000, positions, 50)], []);
  assert.deepEqual([...stopOutOrder(1000, positions, 80)], ['a']);
});

const { pendingKind, pendingTriggered, slTpValidForEntry } = loadTs('src/lib/risk.ts');
const Q = { bid: 1.1000, ask: 1.1002 };

test('pending kind is limit below/above the market and stop on the other side', () => {
  assert.equal(pendingKind('buy', 1.0950, Q), 'buy_limit');
  assert.equal(pendingKind('buy', 1.1050, Q), 'buy_stop');
  assert.equal(pendingKind('sell', 1.1050, Q), 'sell_limit');
  assert.equal(pendingKind('sell', 1.0950, Q), 'sell_stop');
  assert.equal(pendingKind('buy', 1.1002, Q), null); // at market = market order
  assert.equal(pendingKind('sell', 1.1000, Q), null);
});

test('buy orders trigger on ask, sell orders on bid', () => {
  assert.equal(pendingTriggered('buy_limit', 1.0950, { bid: 1.0949, ask: 1.0951 }), false);
  assert.equal(pendingTriggered('buy_limit', 1.0950, { bid: 1.0948, ask: 1.0950 }), true);
  assert.equal(pendingTriggered('buy_stop', 1.1050, { bid: 1.1049, ask: 1.1051 }), true);
  assert.equal(pendingTriggered('sell_limit', 1.1050, { bid: 1.1049, ask: 1.1051 }), false);
  assert.equal(pendingTriggered('sell_limit', 1.1050, { bid: 1.1050, ask: 1.1052 }), true);
  assert.equal(pendingTriggered('sell_stop', 1.0950, { bid: 1.0950, ask: 1.0952 }), true);
});

test('SL/TP must be on the right side of the entry price', () => {
  assert.equal(slTpValidForEntry('buy', 1.09, 1.11, 1.10), true);
  assert.equal(slTpValidForEntry('buy', null, 1.11, 1.10), true);
  assert.equal(slTpValidForEntry('buy', 1.11, null, 1.10), false);
  assert.equal(slTpValidForEntry('buy', null, 1.09, 1.10), false);
  assert.equal(slTpValidForEntry('sell', 1.11, 1.09, 1.10), true);
  assert.equal(slTpValidForEntry('sell', 1.09, null, 1.10), false);
});

test('stop-out level 0 only closes once equity is gone', () => {
  assert.deepEqual([...stopOutOrder(1000, [{ id: 'a', margin: 100, pnl: -990 }], 0)], []); // equity 10
  assert.deepEqual([...stopOutOrder(1000, [{ id: 'a', margin: 100, pnl: -1000 }], 0)], ['a']); // equity 0
});
