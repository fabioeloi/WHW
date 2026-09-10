// SPDX-License-Identifier: MIT
/** Gate: every planning seed is applied; every todo has track + ADR. */

import { readText } from '../../util.js';
import { all } from '../../db/sqlite.js';
import { extractSeedRefs, listTrackFiles, listWaveFiles } from '../util.js';

export const name = 'planning-coverage';
export const description = 'Every planning/*.todos.sql seed is applied; wave todos carry an ADR.';

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
  const tracks = listTrackFiles(ctx.paths.planning);
  if (!waves.length && !tracks.length) {
    return { status: 'GO', failures, details: ['no planning seeds yet (run `whw wave new <slug> --adr NNNN`)'] };
  }
  const have = new Set(all(db, 'SELECT ref FROM todos;').map((r) => r.ref));
  for (const w of [...waves.map((x) => x.todos), ...tracks]) {
    const refs = extractSeedRefs(readText(w));
    const missing = refs.filter((r) => !have.has(r));
    const short = w.split('/').pop();
    if (missing.length) failures.push(`${short}: ${missing.length} ref(s) not in state.db (${missing.slice(0, 5).join(', ')}) — run \`whw sync --all\``);
    else details.push(`${short}: ${refs.length} refs applied`);
  }
  const noAdr = all(db, "SELECT ref, track FROM todos WHERE track LIKE 'wave-%' AND (adr IS NULL OR adr = '');");
  for (const t of noAdr) failures.push(`${t.ref} (${t.track}): wave todo without ADR`);
  if (!noAdr.length) details.push('all wave todos reference an ADR');
  return { status: failures.length ? 'NO_GO' : 'GO', failures, details };
}
