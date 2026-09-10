// SPDX-License-Identifier: MIT
/** Gate: README status claims match execution state (no phantom "done"). */

import { join } from 'node:path';
import { get } from '../../db/sqlite.js';
import { fileExists, readText } from '../../util.js';

export const name = 'readme-sync';
export const description = 'README wave claims match state.db; linked translations exist.';

/**
 * @param {any} ctx
 * @param {import('node:sqlite').DatabaseSync} db
 */
export async function run(ctx, db) {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const details = [];
  const readme = join(ctx.root, 'README.md');
  if (!fileExists(readme)) {
    failures.push('README.md missing at repo root');
    return { status: 'NO_GO', failures, details };
  }
  const text = readText(readme);
  // Claim detection is line-based: skip command examples (`whw done …`) and
  // `.done.sql` mentions, which are instructions — not status claims.
  const claimed = new Set();
  for (const line of text.split('\n')) {
    if (/whw\s+(done|close|claim|sync|queue|gate|evaluate|status|metrics)\b/.test(line)) continue;
    if (line.includes('.done.sql')) continue;
    for (const m of line.matchAll(/wave[-\s]?(\d{3})\b[^\n]{0,80}?\bdone\b/gi)) claimed.add(m[1]);
    for (const m of line.matchAll(/\bdone\b[^\n]{0,40}?wave[-\s]?(\d{3})\b/gi)) claimed.add(m[1]);
  }
  for (const nnn of [...claimed].sort()) {
    const e = get(db, 'SELECT status FROM todos WHERE ref = ?;', `wave${nnn}-E`);
    if (e?.status !== 'done') failures.push(`README claims wave ${nnn} done but wave${nnn}-E is ${e?.status ?? 'unknown'}`);
    else details.push(`README claim verified: wave ${nnn} done`);
  }
  if (!claimed.size) details.push('README makes no wave-done claims');
  for (const m of text.matchAll(/\]\(([^)]*\.md)\)/g)) {
    const target = m[1];
    if (/^(https?:|#|mailto:)/.test(target)) continue;
    const abs = join(ctx.root, target.split('#')[0]);
    if (!fileExists(abs)) failures.push(`README links missing file: ${target}`);
  }
  if (!failures.length) details.push('README local .md links resolve');
  return { status: failures.length ? 'NO_GO' : 'GO', failures, details };
}
