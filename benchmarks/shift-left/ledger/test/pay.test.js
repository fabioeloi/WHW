import assert from 'node:assert/strict';
import test from 'node:test';
import { pay } from '../src/api/pay.js';

test('pay accepts an amount', () => {
  assert.deepEqual(pay(1250), { ok: true, amountCents: 1250 });
});
