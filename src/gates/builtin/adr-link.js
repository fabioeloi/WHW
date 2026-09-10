// SPDX-License-Identifier: MIT
/** Gate: every wave's ADR resolves to an existing ADR file. */

import { all } from '../../db/sqlite.js';
import { findAdrFile } from '../util.js';

export const name = 'adr-link';
export const description = 'Every wave todos ADR value resolves to an existing ADR file.';

/**
 * @param {any} ctx
 * @param {import('node:sqlite').DatabaseSync} db
 */
export async function run(ctx, db) {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const details = [];
  const rows = all(db, "SELECT DISTINCT track, adr FROM todos WHERE track LIKE 'wave-%';");
  if (!rows.length) return { status: 'GO', failures, details: ['no wave tracks in state.db'] };
  for (const r of rows) {
    if (!r.adr) {
      failures.push(`${r.track}: missing ADR (see planning-coverage)`);
      continue;
    }
    const file = findAdrFile(ctx.paths.adr, r.adr);
    if (!file) failures.push(`${r.track}: ADR ${r.adr} has no file in ${ctx.paths.adr}`);
    else details.push(`${r.track} → ADR ${String(r.adr).padStart(4, '0')}`);
  }
  return { status: failures.length ? 'NO_GO' : 'GO', failures, details };
}
