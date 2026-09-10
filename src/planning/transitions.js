// SPDX-License-Identifier: MIT
/** Status transitions with audit trail (every change lands in `transitions`). */

import { all, get, run } from '../db/sqlite.js';

export const STATUSES = ['pending', 'in_progress', 'done', 'blocked', 'cancelled'];

/** Allowed from -> to edges. `done` is terminal (reopen = new wave, not a downgrade). */
export const EDGES = {
  pending: ['in_progress', 'blocked', 'cancelled'],
  in_progress: ['done', 'blocked', 'cancelled', 'pending'],
  blocked: ['in_progress', 'cancelled', 'pending'],
  cancelled: ['pending'],
  done: [],
};

/** @param {string} s */
export function assertStatus(s) {
  if (!STATUSES.includes(s)) throw new Error(`invalid status ${JSON.stringify(s)} (want one of ${STATUSES.join(', ')})`);
}

/** @param {string|undefined} cur */
function joinEvidence(cur, add) {
  if (!add) return cur ?? null;
  if (!cur) return add;
  if (cur.includes(add)) return cur;
  return `${cur} | ${add}`;
}

/**
 * Transition a todo, auditing the change.
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} ref
 * @param {string} to
 * @param {{ actor?: string, evidence?: string, note?: string, forceWip?: boolean }} [opts]
 */
export function setStatus(db, ref, to, opts = {}) {
  assertStatus(to);
  const row = get(db, 'SELECT ref, status FROM todos WHERE ref = ?;', ref);
  if (!row) throw new Error(`unknown todo ref: ${ref} (run \`whw queue\` to list actionable refs)`);
  const from = row.status;
  if (from === to) return { ref, from, to, changed: false };
  if (!EDGES[from]?.includes(to)) {
    throw new Error(`illegal transition ${from} -> ${to} for ${ref}`);
  }
  if (to === 'done' && !opts.evidence) {
    throw new Error(`refusing to mark ${ref} done without --evidence (evidence over chat)`);
  }
  const actor = opts.actor || process.env.USER || process.env.USERNAME || 'agent';
  if (to === 'in_progress' && !opts.forceWip) {
    const others = all(db, "SELECT ref FROM todos WHERE status = 'in_progress' AND ref != ?;", ref);
    for (const o of others) {
      const last = get(
        db,
        "SELECT actor FROM transitions WHERE ref = ? AND to_status = 'in_progress' ORDER BY id DESC LIMIT 1;",
        o.ref,
      );
      const otherActor = last?.actor || actor;
      if (otherActor === actor) {
        throw new Error(
          `already in_progress: ${o.ref} (actor ${actor}). Finish or block it, or pass --force-wip`,
        );
      }
    }
  }
  db.exec('BEGIN;');
  try {
    if (to === 'done') {
      const cur = get(db, 'SELECT evidence FROM todos WHERE ref = ?;', ref)?.evidence;
      run(db, 'UPDATE todos SET status = ?, evidence = ? WHERE ref = ?;', to, joinEvidence(cur, opts.evidence), ref);
    } else if (opts.note || (to === 'blocked' && opts.evidence)) {
      const cur = get(db, 'SELECT notes FROM todos WHERE ref = ?;', ref)?.notes;
      run(db, 'UPDATE todos SET status = ?, notes = ? WHERE ref = ?;', to, joinEvidence(cur, opts.note ?? opts.evidence), ref);
    } else {
      run(db, 'UPDATE todos SET status = ? WHERE ref = ?;', to, ref);
    }
    run(
      db,
      'INSERT INTO transitions (ref, from_status, to_status, actor, evidence) VALUES (?, ?, ?, ?, ?);',
      ref,
      from,
      to,
      actor,
      opts.evidence ?? opts.note ?? null,
    );
    db.exec('COMMIT;');
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      /* already rolled back */
    }
    throw err;
  }
  return { ref, from, to, changed: true, actor };
}

/**
 * Append a free-text note (no status change).
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} ref
 * @param {string} message
 */
export function appendNote(db, ref, message) {
  const row = get(db, 'SELECT ref, notes FROM todos WHERE ref = ?;', ref);
  if (!row) throw new Error(`unknown todo ref: ${ref}`);
  run(db, 'UPDATE todos SET notes = ? WHERE ref = ?;', joinEvidence(row.notes, message), ref);
  return { ref, notes: joinEvidence(row.notes, message) };
}

/**
 * Recent transitions (newest first).
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {{ track?: string, limit?: number }} [opts]
 */
export function recentTransitions(db, opts = {}) {
  const limit = Number.isFinite(opts.limit) && opts.limit > 0 ? Math.floor(opts.limit) : 20;
  if (opts.track) {
    return db
      .prepare(
        `SELECT tr.* FROM transitions tr JOIN todos t ON t.ref = tr.ref
         WHERE t.track LIKE ? ORDER BY tr.id DESC LIMIT ?;`,
      )
      .all(`%${opts.track}%`, limit);
  }
  return db.prepare('SELECT * FROM transitions ORDER BY id DESC LIMIT ?;').all(limit);
}
