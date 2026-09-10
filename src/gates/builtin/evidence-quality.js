// SPDX-License-Identifier: MIT
/** Gate: done evidence from wave 007 onward must name a re-runnable artifact. */

import { all } from '../../db/sqlite.js';

export const name = 'evidence-quality';
export const description = 'Done evidence from wave 007+ names a SHA, PR, test command, or checkpoint.';

/** First wave number this gate applies to (Program 002 onward). */
export const FROM_WAVE = 7;

/**
 * True when evidence names something a stranger could re-run.
 * @param {string|null|undefined} evidence
 */
export function evidenceLooksDurable(evidence) {
  if (!evidence) return false;
  if (/\b[0-9a-f]{7,40}\b/i.test(evidence)) return true;
  if (/#\d+|\/pull\/\d+/i.test(evidence)) return true;
  if (/\.whw\/checkpoints\//.test(evidence)) return true;
  if (/\b(npm test|node --test|whw gate|whw evaluate|whw close)\b/.test(evidence)) return true;
  return false;
}

/**
 * Wave number from ref (`wave008-A`) or track (`wave-008-slug`).
 * @param {{ ref?: string, track?: string }} row
 * @returns {number|null}
 */
export function waveNumberOf(row) {
  const fromRef = /^wave(\d+)/i.exec(row.ref ?? '');
  if (fromRef) return Number(fromRef[1]);
  const fromTrack = /wave-(\d+)/i.exec(row.track ?? '');
  if (fromTrack) return Number(fromTrack[1]);
  return null;
}

/**
 * @param {any} ctx
 * @param {import('node:sqlite').DatabaseSync} db
 */
export async function run(ctx, db) {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const details = [];
  const rows = all(db, "SELECT ref, track, evidence FROM todos WHERE status = 'done';");
  let checked = 0;
  for (const r of rows) {
    const n = waveNumberOf(r);
    if (n == null || n < FROM_WAVE) continue;
    checked++;
    if (!evidenceLooksDurable(r.evidence)) {
      failures.push(`${r.ref}: evidence is not re-runnable (need SHA, PR #N, test command, or checkpoint path)`);
    }
  }
  if (!checked) details.push(`no done todos from wave ${String(FROM_WAVE).padStart(3, '0')}+`);
  else if (!failures.length) details.push(`${checked} done todo(s) from wave ${String(FROM_WAVE).padStart(3, '0')}+ have durable evidence`);
  return { status: failures.length ? 'NO_GO' : 'GO', failures, details };
}
