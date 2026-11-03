const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const ts = require('typescript');

function loadTs(path) {
  const src = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function('module', 'exports', 'require', src)(m, m.exports, require);
  return m.exports;
}
const { slipNameCheck } = loadTs('src/lib/slipName.ts');

test('real slips match their customers', () => {
  assert.equal(slipNameCheck('นางสาว ลลิตา ต.', 'ลลิตา', 'ตินา'), 'match');
  assert.equal(slipNameCheck('นาย พลกฤต บ', 'พลกฤต', 'บุญเกิด'), 'match');
  assert.equal(slipNameCheck('SAIJAI CHUEAW', 'Saijai', 'Chueawomg'), 'match');
  assert.equal(slipNameCheck('MR. JOHN SM', 'John', 'Smith'), 'match');
  assert.equal(slipNameCheck('นางสาวลลิตา ต.', 'ลลิตา', 'ตินา'), 'match');
});

test('someone else transferring is a mismatch', () => {
  assert.equal(slipNameCheck('นาย สมชาย ใ', 'ลลิตา', 'ตินา'), 'mismatch');
  assert.equal(slipNameCheck('นางสาว ลลิตา ส.', 'ลลิตา', 'ตินา'), 'mismatch');
  assert.equal(slipNameCheck('SAIJAI KHAM', 'Saijai', 'Chueawomg'), 'mismatch');
});

test('different scripts or missing names cannot be checked', () => {
  assert.equal(slipNameCheck('นางสาว ลลิตา ต.', 'Lalita', 'Tina'), 'unknown');
  assert.equal(slipNameCheck('', 'ลลิตา', 'ตินา'), 'unknown');
  assert.equal(slipNameCheck('นาย พลกฤต บ', '', ''), 'unknown');
});
