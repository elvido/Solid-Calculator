import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDigitLimit, evaluateExpression, formatResult } from '../src/calculations';

test('calculator applies multiplication before addition', () => {
  assert.equal(evaluateExpression(['2', '+', '3', '*', '4']), 14);
});

test('calculator reports invalid arithmetic as NaN and Error', () => {
  assert.ok(Number.isNaN(evaluateExpression(['10', '/', '0'])));
  assert.equal(formatResult(Number.NaN), 'Error');
});

test('calculator formatting and digit limits are predictable', () => {
  assert.equal(formatResult(1.5), '1.5');
  assert.equal(applyDigitLimit('-123456', 4), '-1234');
  assert.equal(applyDigitLimit('12.34', 4), '12.34');
});
