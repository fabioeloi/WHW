// SPDX-License-Identifier: MIT
/** Shared helpers for gate implementations. */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { isDir, readText } from '../util.js';

/**
 * First-column quoted values of INSERT value lines (todo refs + dep refs union).
 * @param {string} sql
 * @returns {string[]}
 */
export function extractSeedRefs(sql) {
  const refs = new Set();
  for (const m of sql.matchAll(/^\s*\('([^']+)'/gm)) refs.add(m[1]);
  return [...refs];
}

/**
 * @param {string} planningDir
 * @returns {{ nnn: string, n: number, slug: string, todos: string, done: string|null }[]}
 */
export function listWaveFiles(planningDir) {
  if (!isDir(planningDir)) return [];
  const files = readdirSync(planningDir);
  const out = [];
  for (const f of files) {
    const m = /^wave-(\d{3,})-(.+)\.todos\.sql$/.exec(f);
    if (!m) continue;
    const base = f.slice(0, -'.todos.sql'.length);
    out.push({
      nnn: m[1],
      n: Number(m[1]),
      slug: m[2],
      todos: join(planningDir, f),
      done: files.includes(`${base}.done.sql`) ? join(planningDir, `${base}.done.sql`) : null,
    });
  }
  return out.sort((a, b) => a.n - b.n);
}

/**
 * @param {string} planningDir
 * @returns {string[]} non-wave *.todos.sql files (absolute)
 */
export function listTrackFiles(planningDir) {
  if (!isDir(planningDir)) return [];
  return readdirSync(planningDir)
    .filter((f) => f.endsWith('.todos.sql') && !/^wave-\d{3,}-/.test(f))
    .map((f) => join(planningDir, f));
}

/**
 * Parse whw:program markers from charter ADRs.
 * @param {string} adrDir
 * @returns {{ slug: string, first: number, last: number, file: string }[]}
 */
export function listPrograms(adrDir) {
  if (!isDir(adrDir)) return [];
  const out = [];
  for (const f of readdirSync(adrDir)) {
    if (!f.endsWith('.md')) continue;
    const abs = join(adrDir, f);
    const text = readText(abs);
    for (const m of text.matchAll(/<!--\s*whw:program\s+slug="([^"]+)"\s+waves="(\d{3,})-(\d{3,})"\s*-->/g)) {
      out.push({ slug: m[1], first: Number(m[2]), last: Number(m[3]), file: abs });
    }
  }
  return out.sort((a, b) => a.first - b.first);
}

/**
 * @param {string} adrDir
 * @param {string} adr e.g. "9" or "0009"
 * @returns {string|null} absolute ADR file or null
 */
export function findAdrFile(adrDir, adr) {
  if (!adr || !isDir(adrDir)) return null;
  const digits = String(adr).replace(/\D/g, '').padStart(4, '0');
  const hit = readdirSync(adrDir).find((f) => f.startsWith(`${digits}-`) && f.endsWith('.md'));
  return hit ? join(adrDir, hit) : null;
}
