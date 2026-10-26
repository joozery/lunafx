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
