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
const { calcBonus, requiredLots, withdrawAllowance, parseBonusSetting, DEFAULT_BONUS_SETTING } = loadTs('src/lib/bonusRules.ts');
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
