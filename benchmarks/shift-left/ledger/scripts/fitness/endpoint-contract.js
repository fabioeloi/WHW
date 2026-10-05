// SPDX-License-Identifier: MIT
/** Every API export function must be named by a file under test/. */

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

const root = process.cwd();
const tests = walk(join(root, 'test')).map((file) => readFileSync(file, 'utf8')).join('\n');
const failures = [];
for (const file of walk(join(root, 'src', 'api'))) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/export function (\w+)/g)) {
    if (!tests.includes(match[1])) failures.push(match[1]);
  }
}
if (failures.length) {
  process.stderr.write(`endpoint without contract test: ${failures.join(', ')}\n`);
  process.exit(1);
}
