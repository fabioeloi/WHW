// SPDX-License-Identifier: MIT
/**
 * Five ledger changes. The oracle defect has no fitness rule: a direct table
 * read survives a mechanical import fix unless a design checkpoint already
 * selected the safe variant.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PURE_INVOICE = `export function formatInvoice(amountCents) {
  const label = 'invoice';
  return \`\${label}:\${amountCents}\`;
}
`;

const UNSAFE_INVOICE = `import { readTable } from '../infra/db.js';

export function formatInvoice(amountCents) {
  const rows = readTable('payments');
  return \`invoice:\${amountCents}:\${rows.rows.length}\`;
}
`;

const CLEAN_PAY = `export function pay(amountCents) {
  return { ok: true, amountCents };
}
`;

const PII_PAY = `export function pay(amountCents) {
  console.log('payment pan 4111111111111111');
  return { ok: true, amountCents };
}
`;

const DIRECT_PAY = `import { readTable } from '../infra/db.js';

export function pay(amountCents) {
  const rows = readTable('payments');
  return { ok: true, amountCents, seen: rows.rows.length };
}
`;

/** @param {string} root @param {string} rel @param {string} text */
function write(root, rel, text) {
  writeFileSync(join(root, rel), text.endsWith('\n') ? text : `${text}\n`, 'utf8');
}

/** @param {string} root @param {string} rel */
function read(root, rel) {
  return readFileSync(join(root, rel), 'utf8');
}

/** @type {object[]} */
export const CHANGES = [
  {
    id: 'docs-readme',
    title: 'Clarify billing notes',
    signals: ['docs'],
    expectedClass: 'low',
    apply(root) {
      const readme = read(root, 'README.md');
      if (!readme.includes('Billing notes stay in this README.')) {
        write(root, 'README.md', `${readme.replace(/\n*$/, '\n')}\nBilling notes stay in this README.\n`);
      }
    },
  },
  {
    id: 'rename-local',
    title: 'Rename a local invoice label',
    signals: ['local-refactor', 'test-only'],
    expectedClass: 'low',
    apply(root) {
      write(root, 'src/domain/invoice.js', PURE_INVOICE);
    },
  },
  {
    id: 'invoice-module',
    title: 'Add an isolated tax helper',
    signals: ['new-module', 'behavior'],
    expectedClass: 'medium',
    apply(root) {
      write(root, 'src/domain/tax.js', `export function taxCents(amountCents) {
  return Math.round(amountCents * 0.1);
}
`);
      write(root, 'test/tax.test.js', `import assert from 'node:assert/strict';
import test from 'node:test';
import { taxCents } from '../src/domain/tax.js';

test('taxCents rounds a tenth', () => {
  assert.equal(taxCents(1000), 100);
});
`);
    },
  },
  {
    id: 'debug-payment-log',
    title: 'Log a payment debug line',
    signals: ['pii', 'logging'],
    expectedClass: 'high',
    apply(root) {
      write(root, 'src/api/pay.js', PII_PAY);
    },
    repair(root) {
      write(root, 'src/api/pay.js', CLEAN_PAY);
    },
  },
  {
    id: 'domain-owns-table',
    title: 'Let the domain read payments',
    signals: ['architecture', 'security-boundary'],
    expectedClass: 'critical',
    oracle: { id: 'direct-table-read', marker: "readTable('payments')" },
    apply(root) {
      write(root, 'src/domain/invoice.js', UNSAFE_INVOICE);
      write(root, 'src/api/pay.js', DIRECT_PAY);
    },
    repair(root, { d0Done }) {
      write(root, 'src/domain/invoice.js', PURE_INVOICE);
      write(root, 'src/api/pay.js', d0Done ? CLEAN_PAY : DIRECT_PAY);
    },
  },
];

/** Safe tree after an early design checkpoint, and the mechanical fix that drops the illegal import but keeps the direct read. */
export const CRITICAL_VARIANTS = {
  safe: {
    'src/domain/invoice.js': PURE_INVOICE,
    'src/api/pay.js': CLEAN_PAY,
  },
  mechanicalFix: {
    'src/domain/invoice.js': PURE_INVOICE,
    'src/api/pay.js': DIRECT_PAY,
  },
};

export const FITNESS = [
  { id: 'domain-boundary', command: 'node scripts/fitness/domain-boundary.js', description: 'Domain must not import infra.' },
  { id: 'no-pii-logs', command: 'node scripts/fitness/no-pii-logs.js', description: 'Logs must not contain PII.' },
  { id: 'endpoint-contract', command: 'node scripts/fitness/endpoint-contract.js', description: 'API exports need a contract test.' },
];
