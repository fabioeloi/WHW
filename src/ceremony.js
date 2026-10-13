// SPDX-License-Identifier: MIT
/**
 * Append-only ceremony facts. No clock: the benchmark applies a published
 * cost model to these events. Derived state, same idea as .whw/state.db.
 */

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileExists } from './util.js';

/** @param {string} root */
export function ceremonyPath(root) {
  return join(root, '.whw', 'ceremony.jsonl');
}

/**
 * @param {string} root
 * @param {Record<string, any>} fact
 */
export function appendCeremony(root, fact) {
  const file = ceremonyPath(root);
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, `${JSON.stringify(fact)}\n`, 'utf8');
}

/**
 * @param {string} root
 * @returns {Record<string, any>[]}
 */
export function readCeremony(root) {
  const file = ceremonyPath(root);
  if (!fileExists(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}
