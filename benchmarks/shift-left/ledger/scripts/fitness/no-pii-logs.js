// SPDX-License-Identifier: MIT
/** Log calls must not carry a PAN, an email, or the marker "pan". */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...walk(abs));
    else if (name.endsWith('.js')) out.push(abs);
  }
  return out;
}

const failures = [];
for (const file of walk(join(process.cwd(), 'src'))) {
  const text = readFileSync(file, 'utf8');
  if (!/console\.log\(/.test(text)) continue;
  if (/\bpan\b/i.test(text) || /\d{13,19}/.test(text) || /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) {
    failures.push(file);
  }
}
if (failures.length) {
  process.stderr.write(`pii in logs: ${failures.join(', ')}\n`);
  process.exit(1);
}
