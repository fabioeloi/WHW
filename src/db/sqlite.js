// SPDX-License-Identifier: MIT
/** SQLite backend via built-in node:sqlite (zero dependencies). */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { readText } from '../util.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Absolute path of the bundled SQLite schema. */
export function schemaPath() {
  return join(HERE, '..', '..', 'sql', 'schema.sqlite.sql');
}

/**
 * Open (creating parent dirs) and ensure the schema exists.
 * @param {string} dbPath
 * @returns {import('node:sqlite').DatabaseSync}
 */
export function openDb(dbPath) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(readText(schemaPath()));
  return db;
}

/** @param {import('node:sqlite').DatabaseSync} db */
export function closeDb(db) {
  db.close();
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} sql
 * @param {...any} params
 * @returns {any[]}
 */
export function all(db, sql, ...params) {
  return db.prepare(sql).all(...params);
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} sql
 * @param {...any} params
 * @returns {any|undefined}
 */
export function get(db, sql, ...params) {
  return db.prepare(sql).get(...params);
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} sql
 * @param {...any} params
 * @returns {{ changes: number|bigint, lastInsertRowid: number|bigint }}
 */
export function run(db, sql, ...params) {
  return db.prepare(sql).run(...params);
}
