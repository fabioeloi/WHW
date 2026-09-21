// SPDX-License-Identifier: MIT
/**
 * Gate: commits since the last closed program-close wave carry a wave
 * trailer or an ADR 0012 maint prefix. Does not inspect PR labels.
 */

import { get } from '../../db/sqlite.js';
import { git, isGitRepo, runCmd } from '../../util.js';
import { listWaveFiles } from '../util.js';

export const name = 'maint-audit';
export const description = 'Non-merge commits since the last program close carry (Wave NNN L) or chore(deps|maint).';

/** Subject contains a wave trailer, anywhere. */
export const WAVE_TRAILER = /\(Wave \d{3} [A-E]\)/;
/** Dependabot / grouped-deps subjects (ADR 0012 / 0014). */
export const CHORE_DEPS = /^chore\(deps\)/;
/** Human hotfix subjects (ADR 0012). */
export const CHORE_MAINT = /^chore\(maint\)/;

/**
 * True when a commit subject is in-wave or an allowed maint exception.
 * @param {string} subject
 */
export function subjectIsAllowed(subject) {
  const s = String(subject ?? '').trim();
  if (!s) return false;
  return WAVE_TRAILER.test(s) || CHORE_DEPS.test(s) || CHORE_MAINT.test(s);
}

/**
 * Highest `program-close` wave whose E todo is `done`, or null.
 * @param {any} ctx
 * @param {import('node:sqlite').DatabaseSync} db
 * @returns {{ nnn: string, n: number, slug: string }|null}
 */
export function lastClosedProgramCloseWave(ctx, db) {
  const waves = listWaveFiles(ctx.paths.planning).filter((w) => w.slug === 'program-close');
  let last = null;
  for (const w of waves) {
    const row = get(db, 'SELECT status FROM todos WHERE ref = ?;', `wave${w.nnn}-E`);
    if (row?.status === 'done') last = w;
  }
  return last;
}

/**
 * Newest commit whose message contains `(Wave NNN E)` (subject or body).
 * Merge commits of a close PR match via the body, which is the intended
 * baseline (011 E merge `3e1563c`).
 * @param {string} root
 * @param {string} nnn
 * @returns {Promise<string>} SHA or empty
 */
export async function findProgramCloseSha(root, nnn) {
  return git(['log', '-1', '--format=%H', '--fixed-strings', `--grep=(Wave ${nnn} E)`], root);
}

/**
 * @param {any} ctx
 * @param {import('node:sqlite').DatabaseSync} db
 */
export async function run(ctx, db) {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const details = [];

  if (!(await isGitRepo(ctx.root))) {
    return { status: 'GO', failures, details: ['not a git repo — skip'] };
  }

  const last = lastClosedProgramCloseWave(ctx, db);
  if (!last) {
    return { status: 'GO', failures, details: ['no closed program-close wave — skip'] };
  }

  const sha = await findProgramCloseSha(ctx.root, last.nnn);
  if (!sha) {
    failures.push(
      `wave-${last.nnn}-program-close E is done but no git commit matches "(Wave ${last.nnn} E)" — check the close merge`,
    );
    return { status: 'NO_GO', failures, details };
  }
  details.push(`baseline wave-${last.nnn}-program-close @ ${sha.slice(0, 7)}`);

  const range = `${sha}..HEAD`;
  const logged = await runCmd('git', ['log', '--no-merges', '--format=%h\t%s', range], { cwd: ctx.root });
  if (logged.code !== 0) {
    failures.push(`git log ${range} failed: ${(logged.stderr || logged.stdout).trim() || `exit ${logged.code}`}`);
    return { status: 'NO_GO', failures, details };
  }

  const lines = logged.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) {
    details.push(`no non-merge commits since ${sha.slice(0, 7)}`);
    return { status: 'GO', failures, details };
  }

  /** @type {string[]} */
  const bad = [];
  for (const line of lines) {
    const tab = line.indexOf('\t');
    const hash = tab === -1 ? line.slice(0, 7) : line.slice(0, tab);
    const subject = tab === -1 ? line : line.slice(tab + 1);
    if (!subjectIsAllowed(subject)) bad.push(`${hash} ${subject}`);
  }
  if (bad.length) {
    failures.push(
      `${bad.length} commit(s) since wave-${last.nnn} E lack (Wave NNN L) and are not chore(deps)|chore(maint):`,
    );
    for (const row of bad) failures.push(`  ${row}`);
  } else {
    details.push(`non-merge commits since ${sha.slice(0, 7)} allowed`);
  }
  return { status: failures.length ? 'NO_GO' : 'GO', failures, details };
}
