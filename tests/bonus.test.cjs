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
const { calcBonus, requiredLots, withdrawAllowance, parseBonusSetting, DEFAULT_BONUS_SETTING, tradePips, countedPips, withdrawBreakdown, replacedBonusDeduction } = loadTs('src/lib/bonusRules.ts');
const on = { ...DEFAULT_BONUS_SETTING, enabled: true };

test('fixed bonus: deposit $20 gets $30, below minimum gets nothing', () => {
  assert.equal(calcBonus({ ...on, minDepositUsd: 20, bonusType: 'fixed', bonusValue: 30 }, 20), 30);
  assert.equal(calcBonus({ ...on, minDepositUsd: 20, bonusType: 'fixed', bonusValue: 30 }, 19.99), 0);
  assert.equal(calcBonus({ ...on, enabled: false }, 1000), 0);
});

test('percent bonus respects the cap', () => {
  const s = { ...on, minDepositUsd: 10, bonusType: 'percent', bonusValue: 100, maxBonusUsd: 500 };
  assert.equal(calcBonus(s, 120), 120);
  assert.equal(calcBonus(s, 2000), 500);
});

test('turnover lots scale with the bonus', () => {
  assert.equal(requiredLots({ ...on, lotsPerBonusUsd: 0.1 }, 30), 3);
});

test('withdraw allowance grows with later deposits and shrinks with withdrawals', () => {
  assert.equal(withdrawAllowance(100, 0, 0), 100);
  assert.equal(withdrawAllowance(100, 50, 120), 30);
  assert.equal(withdrawAllowance(100, 0, 150), 0);
});

test('admin setting validation', () => {
  assert.equal(typeof parseBonusSetting({ minDepositUsd: -1, bonusValue: 30, maxBonusUsd: 0, lotsPerBonusUsd: 0.1, maxWithdrawUsd: 0 }), 'string');
  assert.equal(typeof parseBonusSetting({ minDepositUsd: 20, bonusValue: 0, maxBonusUsd: 0, lotsPerBonusUsd: 0.1, maxWithdrawUsd: 0 }), 'string');
  const ok = parseBonusSetting({ enabled: true, minDepositUsd: 20, bonusType: 'fixed', bonusValue: 30, maxBonusUsd: 0, lotsPerBonusUsd: 0.1, maxWithdrawUsd: 100, firstDepositOnly: true });
  assert.equal(ok.bonusValue, 30);
  assert.equal(ok.maxWithdrawUsd, 100);
});

test('pips: distance per symbol, losing trades count, open trades do not', () => {
  assert.equal(tradePips({ symbol: 'EURUSD', openPrice: 1.1, closePrice: 1.1015 }), 15);
  assert.equal(tradePips({ symbol: 'EURUSD', openPrice: 1.1015, closePrice: 1.1 }), 15);
  assert.equal(tradePips({ symbol: 'XAUUSD', openPrice: 2650.0, closePrice: 2655.5 }), 550);
  assert.equal(tradePips({ symbol: 'USDJPY', openPrice: 150.0, closePrice: 150.25 }), 25);
  assert.equal(tradePips({ symbol: 'EURUSD', openPrice: 1.1, closePrice: null }), 0);
});

test('pips: lot-weighted mode multiplies by volume', () => {
  const t = { symbol: 'EURUSD', openPrice: 1.1, closePrice: 1.1015, volume: 2 };
  assert.equal(countedPips(t, 'distance'), 15);
  assert.equal(countedPips(t, 'lot_weighted'), 30);
});

test('pip setting validation', () => {
  const base = { minDepositUsd: 20, bonusValue: 30, maxBonusUsd: 0, lotsPerBonusUsd: 0.1, maxWithdrawUsd: 0 };
  assert.equal(typeof parseBonusSetting({ ...base, requiredPips: -5 }), 'string');
  const ok = parseBonusSetting({ ...base, requiredPips: 100000, pipMode: 'lot_weighted' });
  assert.equal(ok.requiredPips, 100000);
  assert.equal(ok.pipMode, 'lot_weighted');
  assert.equal(parseBonusSetting(base).pipMode, 'distance');
});

test('withdraw breakdown: own money and profit out, active bonus stays', () => {
  assert.deepEqual({ ...withdrawBreakdown(285.51, 40.04, null) }, { balanceUsd: 285.51, bonusHeldUsd: 40.04, withdrawableUsd: 245.47 });
  // lost part of the bonus: only what is left is held
  assert.deepEqual({ ...withdrawBreakdown(30, 40, null) }, { balanceUsd: 30, bonusHeldUsd: 30, withdrawableUsd: 0 });
  // no bonus, with a cap from a completed one
  assert.deepEqual({ ...withdrawBreakdown(500, 0, 120) }, { balanceUsd: 500, bonusHeldUsd: 0, withdrawableUsd: 120 });
  assert.deepEqual({ ...withdrawBreakdown(-5, 10, null) }, { balanceUsd: 0, bonusHeldUsd: 0, withdrawableUsd: 0 });
});

test('replaced bonus deduction never touches the new deposit', () => {
  assert.equal(replacedBonusDeduction(385.51, 100, 40.04), 40.04); // had 285.51 before
  assert.equal(replacedBonusDeduction(120, 100, 40), 20);          // only 20 left before depositing
  assert.equal(replacedBonusDeduction(100, 100, 40), 0);
});
