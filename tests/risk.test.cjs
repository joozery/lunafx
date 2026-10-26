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
