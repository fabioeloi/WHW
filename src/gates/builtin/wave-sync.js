// SPDX-License-Identifier: MIT
/**
 * Gate: closed waves (E done) have their .done.sql hook, a plan entry,
 * and an ADR addendum — narrative cannot drift from execution state.
 */

import { all, get } from '../../db/sqlite.js';
import { fileExists, readText } from '../../util.js';
import { findAdrFile, listWaveFiles } from '../util.js';

export const name = 'wave-sync';
export const description = 'Closed waves have .done.sql, plan entry, and ADR addendum.';

/**
 * @param {any} ctx
 * @param {import('node:sqlite').DatabaseSync} db
 */
export async function run(ctx, db) {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const details = [];
  const waves = listWaveFiles(ctx.paths.planning);
  const planText = fileExists(ctx.paths.plan) ? readText(ctx.paths.plan) : '';
  let closed = 0;
  for (const w of waves) {
    const e = get(db, 'SELECT status FROM todos WHERE ref = ?;', `wave${w.nnn}-E`);
    if (e?.status !== 'done') continue;
    closed++;
    const tag = `wave-${w.nnn}-${w.slug}`;
    if (!w.done) failures.push(`${tag}: .done.sql hook missing`);
    const waveRe = new RegExp(`wave[-\\s]?${w.nnn}`, 'i');
    if (!waveRe.test(planText)) failures.push(`${tag}: no entry in ${ctx.paths.plan} (add \`## Wave ${w.nnn} — ${w.slug}\`)`);
    const adrRow = all(db, 'SELECT DISTINCT adr FROM todos WHERE track = ?;', tag)[0];
    const adrFile = adrRow?.adr ? findAdrFile(ctx.paths.adr, adrRow.adr) : null;
    if (!adrFile) {
      failures.push(`${tag}: ADR ${adrRow?.adr ?? '(none)'} file missing`);
    } else {
      const adrText = readText(adrFile);
      if (!/addendum/i.test(adrText) || !waveRe.test(adrText)) {
        failures.push(`${tag}: no \`## Addendum Wave ${w.nnn}\` in ${adrFile.split('/').pop()}`);
      }
    }
    if (!failures.some((f) => f.startsWith(tag))) details.push(`${tag}: synced (.done.sql + plan + addendum)`);
  }
  if (!closed) details.push('no closed waves yet');
  return { status: failures.length ? 'NO_GO' : 'GO', failures, details };
}
