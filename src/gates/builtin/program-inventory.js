// SPDX-License-Identifier: MIT
/**
 * Gate: program inventory. Every wave file falls inside a chartered program
 * range (no wave N+1 without a new charter); closed programs are fully
 * inventoried (seeds + done hooks + all todos terminal).
 */

import { get } from '../../db/sqlite.js';
import { listPrograms, listWaveFiles } from '../util.js';

export const name = 'program-inventory';
export const description = 'Waves stay inside chartered program ranges; closed programs fully inventoried.';

/**
 * @param {any} ctx
 * @param {import('node:sqlite').DatabaseSync} db
 */
export async function run(ctx, db) {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const details = [];
  const programs = listPrograms(ctx.paths.adr);
  const waves = listWaveFiles(ctx.paths.planning);
  if (!programs.length) {
    return { status: 'GO', failures, details: ['no programs chartered (single-wave project)'] };
  }
  const inRange = (n) => programs.some((p) => n >= p.first && n <= p.last);
  for (const p of programs) {
    details.push(`program ${p.slug}: waves ${p.first}–${p.last} (${p.file.split('/').pop()})`);
  }
  for (const w of waves) {
    if (!inRange(w.n)) {
      failures.push(`wave-${w.nnn}-${w.slug}: outside every chartered range — charter a program (or fix the range)`);
    }
  }
  for (const p of programs) {
    const lastRef = `wave${String(p.last).padStart(3, '0')}-E`;
    const last = get(db, 'SELECT status FROM todos WHERE ref = ?;', lastRef);
    if (last?.status !== 'done') {
      details.push(`program ${p.slug}: open (close wave ${p.last} not done yet)`);
      continue;
    }
    details.push(`program ${p.slug}: closed — verifying inventory`);
    const byN = new Map(waves.map((w) => [w.n, w]));
    for (let n = p.first; n <= p.last; n++) {
      const w = byN.get(n);
      const nnn = String(n).padStart(3, '0');
      if (!w) {
        failures.push(`program ${p.slug}: wave ${nnn} seed missing from planning/`);
        continue;
      }
      if (!w.done) failures.push(`program ${p.slug}: wave ${nnn} .done.sql hook missing`);
      const open = get(
        db,
        `SELECT COUNT(*) AS n FROM todos WHERE ref LIKE ? AND status NOT IN ('done','cancelled');`,
        `wave${nnn}-%`,
      )?.n ?? 0;
      if (Number(open) > 0) failures.push(`program ${p.slug}: wave ${nnn} has ${open} non-terminal todo(s)`);
    }
  }
  return { status: failures.length ? 'NO_GO' : 'GO', failures, details };
}
