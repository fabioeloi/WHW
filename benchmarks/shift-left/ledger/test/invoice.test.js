import assert from 'node:assert/strict';
import test from 'node:test';
import { formatInvoice } from '../src/domain/invoice.js';

test('formatInvoice labels the amount', () => {
  assert.equal(formatInvoice(1250), 'invoice:1250');
});
