// SPDX-License-Identifier: MIT
/**
 * `whw close` — canonical wave close.
 * Asserts A–D terminal + ADR addendum + sync gates GO, then applies the
 * .done.sql hook and audits the E transition. `done` is never downgraded.
 */

import { all, closeDb, get, openDb, run } from './db/sqlite.js';
import { runOne, writeCheckpoint } from './gates/runner.js';
import { findAdrFile, listWaveFiles } from './gates/util.js';
import { fileExists, readText } from './util.js';

const SYNC_GATES = ['planning-coverage', 'adr-link', 'wave-sync', 'readme-sync'];

/**
 * @param {any} ctx
 * @param {string} wave `001` | `wave-001` | `wave-001-slug`
 */
export function resolveWave(ctx, wave) {
  const waves = listWaveFiles(ctx.paths.planning);
  const digits = wave.replace(/\D/g, '');
  const byDigits = digits ? waves.find((w) => w.nnn === digits.padStart(3, '0')) : null;
  if (byDigits) return byDigits;
  const hit = waves.find((w) => `wave-${w.nnn}-${w.slug}` === wave || w.slug === wave);
  if (hit) return hit;
  throw new Error(`unknown wave: ${wave} (waves: ${waves.map((w) => `wave-${w.nnn}-${w.slug}`).join(', ') || 'none'})`);
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdClose(positionals, ctx) {
  const arg = positionals[0] ?? ctx.flags.wave;
  if (!arg) throw new Error('usage: whw close <wave>  (e.g. whw close 001)');
  const w = resolveWave(ctx, arg);
  const track = `wave-${w.nnn}-${w.slug}`;
  const prefix = `wave${w.nnn}`;
  if (!w.done) throw new Error(`${track}: .done.sql hook missing in planning/`);
  const db = openDb(ctx.paths.state);
  try {
    const e = get(db, 'SELECT status FROM todos WHERE ref = ?;', `${prefix}-E`);
    if (!e) throw new Error(`${track}: not synced (run \`whw sync ${track}\`)`);
    if (e.status === 'done') {
      if (ctx.json) ctx.log.data({ wave: w.nnn, track, already: true });
      else ctx.log.info(`${track}: already closed.`);
      return 0;
    }
    // 1. A–D terminal
    const letters = all(db, 'SELECT ref, status FROM todos WHERE ref LIKE ? ORDER BY ref;', `${prefix}-%`);
    const byLetter = Object.fromEntries(letters.map((r) => [r.ref.split('-').pop(), r.status]));
    const open = ['A', 'B', 'C', 'D'].filter((l) => !['done', 'cancelled'].includes(byLetter[l]));
    if (open.length) {
      throw new Error(`${track}: letters not terminal: ${open.map((l) => `${prefix}-${l} (${byLetter[l] ?? 'missing'})`).join(', ')}`);
    }
    // 2. ADR addendum present
    const adrRow = all(db, 'SELECT DISTINCT adr FROM todos WHERE track = ?;', track)[0];
    const adrFile = adrRow?.adr ? findAdrFile(ctx.paths.adr, adrRow.adr) : null;
    const waveRe = new RegExp(`wave[-\\s]?${w.nnn}`, 'i');
    if (!adrFile || !/addendum/i.test(readText(adrFile)) || !waveRe.test(readText(adrFile))) {
      throw new Error(`${track}: no \`## Addendum Wave ${w.nnn}\` in ADR ${adrRow?.adr ?? '(none)'} (wave D first)`);
    }
    // 3. Sync gates GO
    for (const gateName of SYNC_GATES) {
      const result = await runOne(ctx, { name: gateName }, db);
      const cp = writeCheckpoint(ctx, gateName, result);
      if (result.status !== 'GO') {
        throw new Error(`${track}: gate ${gateName} NO_GO — ${result.failures[0] ?? 'see ' + cp.latest}`);
      }
    }
    // 4. Apply .done.sql + audit transitions for changed refs
    const before = all(db, `SELECT ref, status FROM todos WHERE ref LIKE ? AND status NOT IN ('done','cancelled');`, `${prefix}-%`);
    db.exec(readText(w.done));
    const actor = ctx.flags.actor || process.env.USER || process.env.USERNAME || 'agent';
    const evidence = `whw close ${track}`;
    for (const row of before) {
      run(
        db,
        'INSERT INTO transitions (ref, from_status, to_status, actor, evidence) VALUES (?, ?, ?, ?, ?);',
        row.ref, row.status, 'done', actor, evidence,
      );
      const cur = get(db, 'SELECT evidence FROM todos WHERE ref = ?;', row.ref)?.evidence ?? '';
      if (!cur.includes(evidence)) {
        run(db, 'UPDATE todos SET evidence = ? WHERE ref = ?;', cur ? `${cur} | ${evidence}` : evidence, row.ref);
      }
    }
    if (ctx.json) {
      ctx.log.data({ wave: w.nnn, track, closed: before.map((r) => r.ref) });
      return 0;
    }
    ctx.log.info(`${track}: closed (${before.map((r) => r.ref).join(', ') || 'E already terminal'} → done)`);
    ctx.log.info(`sync gates GO (${SYNC_GATES.join(', ')}); addendum verified in ${adrFile.split('/').pop()}`);
    return 0;
  } finally {
    closeDb(db);
  }
}
