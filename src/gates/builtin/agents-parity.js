// SPDX-License-Identifier: MIT
/** Gate: every expected tool adapter exists and defers to AGENTS.md. */

import { join } from 'node:path';
import { expectedAdapterFiles } from '../../adapters.js';
import { fileExists, readText } from '../../util.js';

export const name = 'agents-parity';
export const description = 'Tool adapter files exist and reference the canonical AGENTS.md.';

/** @param {any} ctx */
export async function run(ctx) {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const details = [];
  const agents = join(ctx.root, 'AGENTS.md');
  if (!fileExists(agents)) {
    failures.push('AGENTS.md missing at repo root (run `whw init`)');
    return { status: 'NO_GO', failures, details };
  }
  details.push('AGENTS.md present (canonical)');
  const manifest = join(ctx.root, '.whw', 'adapters.json');
  if (!fileExists(manifest)) {
    failures.push('.whw/adapters.json missing (run `whw adapters sync`)');
  }
  for (const file of expectedAdapterFiles(ctx)) {
    const abs = join(ctx.root, file);
    if (!fileExists(abs)) {
      failures.push(`${file} missing (run \`whw adapters sync\`)`);
    } else if (!readText(abs).includes('AGENTS.md')) {
      failures.push(`${file} does not reference AGENTS.md`);
    } else {
      details.push(`${file} → AGENTS.md`);
    }
  }
  return { status: failures.length ? 'NO_GO' : 'GO', failures, details };
}
