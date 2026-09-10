// SPDX-License-Identifier: MIT
/** Shared test helpers: temp projects, contexts, quiet loggers. */

import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from '../src/config.js';
import { createLogger } from '../src/log.js';
import { writeText } from '../src/util.js';

/** @returns {string} fresh temp dir */
export function makeTmp(prefix = 'whw-test-') {
  return mkdtempSync(join(tmpdir(), prefix));
}

/**
 * Build a CLI-ish ctx rooted at dir.
 * @param {string} root
 * @param {Record<string, any>} [flags]
 */
export function makeCtx(root, flags = {}) {
  const { configFile, config, paths } = loadConfig({ cwd: root, root });
  return {
    root,
    configFile,
    config,
    paths,
    flags,
    log: createLogger({ quiet: true }),
    json: false,
  };
}

/**
 * Minimal seed SQL for tests (two todos with a dep edge).
 * @param {string} [track]
 */
export function seedSql(track = 't1') {
  return `INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('${track}-1', 'First', 'pending', '${track}', 1, NULL, '0001', ''),
  ('${track}-2', 'Second', 'pending', '${track}', 2, NULL, '0001', '')
ON CONFLICT (ref) DO UPDATE SET title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;
INSERT INTO todo_deps (ref, depends_on) VALUES ('${track}-2', '${track}-1') ON CONFLICT DO NOTHING;
`;
}

/** @param {string} root @param {string} [track] @returns {string} seed file path */
export function writeSeed(root, track = 't1') {
  const file = join(root, 'planning', `${track}.todos.sql`);
  writeText(file, seedSql(track));
  return file;
}
