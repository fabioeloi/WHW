// SPDX-License-Identifier: MIT
/** Actionable queue: in_progress first, then dependency-ready pending. */

import { all } from '../db/sqlite.js';

const COLS = 'ref, title, status, track, step, letter, adr, notes, evidence, updated_at';

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {{ track?: string, limit?: number }} [opts]
 * @returns {{ inProgress: any[], ready: any[] }}
 */
export function getQueue(db, opts = {}) {
  const { track, limit } = opts;
  const trackFilter = track ? 'AND track LIKE ?' : '';
  const params = track ? [`%${track}%`] : [];
  const lim = Number.isFinite(limit) && limit > 0 ? `LIMIT ${Math.floor(limit)}` : '';
  const inProgress = all(
    db,
    `SELECT ${COLS} FROM todos WHERE status = 'in_progress' ${trackFilter} ORDER BY track, step ${lim};`,
    ...params,
  );
  const ready = all(
    db,
    `SELECT ${COLS} FROM ready WHERE 1=1 ${trackFilter} ORDER BY track, step ${lim};`,
    ...params,
  );
  return { inProgress, ready };
}

/**
 * List todos by status (for --status filters and reports).
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {{ status?: string, track?: string, limit?: number }} [opts]
 */
export function listTodos(db, opts = {}) {
  const conds = [];
  /** @type {any[]} */
  const params = [];
  if (opts.status) {
    conds.push('status = ?');
    params.push(opts.status);
  }
  if (opts.track) {
    conds.push('track LIKE ?');
    params.push(`%${opts.track}%`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const lim = Number.isFinite(opts.limit) && opts.limit > 0 ? `LIMIT ${Math.floor(opts.limit)}` : '';
  return all(db, `SELECT ${COLS} FROM todos ${where} ORDER BY track, step ${lim};`, ...params);
}

/**
 * Dependency detail for a todo: what it waits on and what waits on it.
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} ref
 */
export function depDetail(db, ref) {
  const waitsOn = all(
    db,
    `SELECT t.ref, t.title, t.status FROM todo_deps d JOIN todos t ON t.ref = d.depends_on WHERE d.ref = ? ORDER BY t.ref;`,
    ref,
  );
  const blocks = all(
    db,
    `SELECT t.ref, t.title, t.status FROM todo_deps d JOIN todos t ON t.ref = d.ref WHERE d.depends_on = ? ORDER BY t.ref;`,
    ref,
  );
  return { waitsOn, blocks };
}
