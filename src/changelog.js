// SPDX-License-Identifier: MIT
/**
 * Keep a Changelog helpers: extract a version section for GitHub Release notes.
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readText, writeText } from './util.js';

/**
 * @param {string} markdown
 * @param {string} version semver without a leading `v`
 * @returns {string|null}
 */
export function extractChangelogSection(markdown, version) {
  const esc = String(version).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startRe = new RegExp(`^## \\[${esc}\\][^\\n]*`, 'm');
  const start = markdown.match(startRe);
  if (!start || start.index === undefined) return null;
  const from = start.index;
  const rest = markdown.slice(from + start[0].length);
  const next = rest.search(/^## \[/m);
  const body = next === -1 ? rest : rest.slice(0, next);
  return `${start[0]}${body}`.replace(/\s+$/, '\n');
}

/**
 * True when `[Unreleased]` contains list items (Keep a Changelog bullets).
 * @param {string} markdown
 */
export function unreleasedHasEntries(markdown) {
  const section = extractChangelogSection(markdown, 'Unreleased');
  if (!section) return false;
  return /^\s*[-*+] /m.test(section);
}

/**
 * @param {string} changelogPath
 * @param {string} version
 * @param {string} outPath
 */
export function writeReleaseNotesFile(changelogPath, version, outPath) {
  const section = extractChangelogSection(readText(changelogPath), version);
  if (!section) throw new Error(`CHANGELOG.md has no ## [${version}] section`);
  writeText(outPath, section);
}

/**
 * @param {string[]} argv
 * @returns {{ version: string, out: string, file: string }}
 */
export function parseChangelogNotesArgv(argv) {
  let version = '';
  let out = '';
  let file = 'CHANGELOG.md';
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok === '--version') version = argv[++i] ?? '';
    else if (tok === '--out') out = argv[++i] ?? '';
    else if (tok === '--file') file = argv[++i] ?? file;
    else if (!tok.startsWith('-') && !version) version = tok;
    else if (!tok.startsWith('-') && !out) out = tok;
  }
  return { version: String(version).replace(/^v/, ''), out, file };
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  const { version, out, file } = parseChangelogNotesArgv(process.argv.slice(2));
  if (!version || !out) {
    process.stderr.write('usage: node src/changelog.js --version X.Y.Z --out FILE [--file CHANGELOG.md]\n');
    process.exit(1);
  }
  writeReleaseNotesFile(file, version, out);
}
