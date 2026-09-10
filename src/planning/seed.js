// SPDX-License-Identifier: MIT
/** Seed application: planning/*.todos.sql -> state database (idempotent). */

import { readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { all, run } from '../db/sqlite.js';
import { isDir, readText } from '../util.js';

/**
 * List seed files, sorted. Only *.todos.sql (never *.done.sql — those apply on `whw close`).
 * @param {string} planningDir
 * @param {{ track?: string }} [opts] substring filter on filename or track
 * @returns {string[]} absolute paths
 */
export function listSeedFiles(planningDir, opts = {}) {
  if (!isDir(planningDir)) return [];
  const files = readdirSync(planningDir)
    .filter((f) => f.endsWith('.todos.sql'))
    .sort()
    .map((f) => join(planningDir, f));
  if (opts.track) {
    const needle = opts.track.toLowerCase();
    return files.filter((f) => {
      const text = readText(f).toLowerCase();
      return basename(f).toLowerCase().includes(needle) || text.includes(`'${needle}'`) || text.includes(needle);
    });
  }
  return files;
}

const PRESERVE_STATUSES = new Set(['done', 'in_progress', 'blocked', 'cancelled']);

/**
 * Apply one seed file. Seeds are idempotent upserts; live statuses
 * (`done`, `in_progress`, `blocked`, `cancelled`) are restored after apply so
 * `whw sync` cannot unclaim or unblock work.
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} file absolute path
 * @returns {{ file: string, todos: number }}
 */
export function applySeedFile(db, file) {
  const sql = readText(file);
  try {
    db.exec('BEGIN;');
    const preserved = all(db, "SELECT ref, status FROM todos WHERE status != 'pending';");
    db.exec(sql);
    for (const row of preserved) {
      if (!PRESERVE_STATUSES.has(row.status)) continue;
      run(db, 'UPDATE todos SET status = ? WHERE ref = ?;', row.status, row.ref);
    }
    db.exec('COMMIT;');
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      /* already rolled back */
    }
    throw new Error(`seed failed: ${file}: ${err instanceof Error ? err.message : err}`);
  }
  const row = db.prepare('SELECT COUNT(*) AS n FROM todos;').get();
  return { file, todos: Number(row?.n ?? 0) };
}

/**
 * Apply all (or track-filtered) seeds.
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} planningDir
 * @param {{ track?: string }} [opts]
 */
export function syncAll(db, planningDir, opts = {}) {
  if (!isDir(planningDir)) {
    throw new Error(`planning dir not found: ${planningDir} (run \`whw init\` first)`);
  }
  const files = listSeedFiles(planningDir, opts);
  return files.map((file) => applySeedFile(db, file));
}
