// SPDX-License-Identifier: MIT
/**
 * Shift-left guards: design checkpoint, walkthrough, judgment, and fitness
 * timing. classic does not call these requirements. Heading checks are
 * conformance of an artifact contract, not proof that a human understood it.
 */

import { join } from 'node:path';
import { all, get } from './db/sqlite.js';
import { appendCeremony } from './ceremony.js';
import { fitnessStatusForPolicy, runFitness } from './fitness.js';
import { findWaveRisk, processProfile, waveNnnFromTrack } from './risk.js';
import { fileExists, readText, writeText } from './util.js';

export const DESIGN_HEADINGS = [
  '## Hypothesis',
  '## Alternatives',
  '## Risks',
  '## Boundaries',
  '## Test strategy',
  '## Operational impact',
  '## Human review',
];

export const WALKTHROUGH_HEADINGS = [
  '## Problem',
  '## Main path',
  '## Dangerous failure',
  '## Rollback',
  '## Architectural decision',
  '## Evidence',
];

export const LEARNING_LABELS = ['Discovered', 'Failed assumption', 'Rule to adjust'];

/** @param {string} root @param {string} nnn */
export function designPath(root, nnn) {
  return join(root, 'docs', 'design', `wave-${nnn}.md`);
}

/** @param {string} root @param {string} nnn */
export function walkthroughPath(root, nnn) {
  return join(root, 'docs', 'walkthrough', `wave-${nnn}.md`);
}

/** @param {string} root @param {string} nnn */
export function judgmentPath(root, nnn) {
  return join(root, 'docs', 'judgment', `wave-${nnn}.md`);
}

/**
 * @param {string} text
 * @param {string[]} headings
 * @returns {string[]}
 */
export function missingHeadings(text, headings) {
  return headings.filter((heading) => !text.includes(heading));
}

/**
 * @param {{ humanJudgment?: string }} policy
 * @param {string} fitnessStatus
 */
export function judgmentRequired(policy, fitnessStatus) {
  if (!policy || policy.humanJudgment === 'never') return false;
  if (policy.humanJudgment === 'always') return true;
  if (policy.humanJudgment === 'on-exception') return fitnessStatus !== 'GO';
  return false;
}

/**
 * @param {string} root
 * @param {string} nnn
 * @returns {'approve'|'reject'|null}
 */
export function readDecision(root, nnn) {
  const file = judgmentPath(root, nnn);
  if (!fileExists(file)) return null;
  const match = /^Decision:\s*(approve|reject)\s*$/m.exec(readText(file));
  return match ? /** @type {'approve'|'reject'} */ (match[1]) : null;
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} ref
 */
function unmetDeps(db, ref) {
  return all(
    db,
    `SELECT p.ref AS ref, p.status AS status
     FROM todo_deps d
     JOIN todos p ON p.ref = d.depends_on
     WHERE d.ref = ? AND p.status NOT IN ('done', 'cancelled')
     ORDER BY p.ref;`,
    ref,
  );
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} ref
 */
function todoRow(db, ref) {
  return get(db, 'SELECT ref, letter, track, status FROM todos WHERE ref = ?;', ref);
}

/**
 * Refuse claim when SQL deps are open, and refuse Build on shift-left
 * high/critical while fitness is NO_GO.
 * @param {any} ctx
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} ref
 */
export async function guardClaim(ctx, db, ref) {
  const waiting = unmetDeps(db, ref);
  if (waiting.length) {
    throw new Error(`${ref}: waiting on ${waiting.map((row) => `${row.ref} (${row.status})`).join(', ')}`);
  }
  const row = todoRow(db, ref);
  if (!row || row.letter !== 'B') return row;
  if (processProfile(ctx.config) !== 'shift-left') return row;
  const nnn = waveNnnFromTrack(row.track);
  const risk = nnn ? findWaveRisk(ctx.paths.planning, nnn) : null;
  if (!risk || risk.profile !== 'shift-left' || !risk.fitnessBeforeBuild) return row;
  const report = await runFitness(ctx);
  if (report.status !== 'GO') {
    const failed = report.results.filter((rule) => rule.status !== 'GO').map((rule) => rule.id).join(', ');
    throw new Error(`${ref}: fitness NO_GO (${failed}) — fix before Build`);
  }
  return row;
}

/**
 * @param {any} ctx
 * @param {string} nnn
 * @param {string} name
 * @param {string} file
 * @param {string[]} headings
 */
function assertArtifact(ctx, nnn, name, file, headings) {
  const text = fileExists(file) ? readText(file) : '';
  const missing = missingHeadings(text, headings);
  if (missing.length) {
    appendCeremony(ctx.root, { event: 'gate', name, kind: 'conformance', status: 'NO_GO' });
    throw new Error(`wave ${nnn}: ${file.split('/').pop()} missing ${missing.join(', ')}`);
  }
  appendCeremony(ctx.root, { event: 'gate', name, kind: 'conformance', status: 'GO' });
}

/**
 * @param {any} ctx
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {string} ref
 */
export async function guardDone(ctx, db, ref) {
  const row = todoRow(db, ref);
  if (!row?.letter) return row;
  const nnn = waveNnnFromTrack(row.track);
  if (row.letter === 'C' && nnn) {
    const report = await runFitness(ctx);
    if (report.status !== 'GO') {
      const failed = report.results.filter((rule) => rule.status !== 'GO').map((rule) => rule.id).join(', ');
      throw new Error(`${ref}: fitness NO_GO (${failed}) — fix before Verify`);
    }
  }
  if (processProfile(ctx.config) !== 'shift-left' || !nnn) return row;
  const risk = findWaveRisk(ctx.paths.planning, nnn);
  if (!risk || risk.profile !== 'shift-left') return row;
  if (row.letter === 'D0') {
    assertArtifact(ctx, nnn, 'design-checkpoint', designPath(ctx.root, nnn), DESIGN_HEADINGS);
  }
  if (row.letter === 'W') {
    assertArtifact(ctx, nnn, 'walkthrough', walkthroughPath(ctx.root, nnn), WALKTHROUGH_HEADINGS);
  }
  if (row.letter === 'D' && judgmentRequired(risk, fitnessStatusForPolicy(ctx.root, ctx.config))) {
    if (readDecision(ctx.root, nnn) !== 'approve') {
      throw new Error(`${ref}: human judgment required (\`whw judge ${nnn} --decision approve --note ...\`)`);
    }
  }
  return row;
}

/**
 * Learning, walkthrough, and judgment required by the wave's stored policy.
 * Call only for process.profile shift-left, before .done.sql is applied.
 * @param {any} ctx
 * @param {Record<string, string>} byLetter
 * @param {string} adrText
 * @param {string} nnn
 */
export function assertShiftLeftClose(ctx, byLetter, adrText, nnn) {
  const risk = findWaveRisk(ctx.paths.planning, nnn);
  if (!risk) throw new Error(`wave ${nnn}: missing planning/wave-${nnn}-*.risk.json`);
  const learningHeading = new RegExp(`## Learning Wave ${nnn}\\b`, 'i');
  if (!learningHeading.test(adrText)) {
    throw new Error(`wave ${nnn}: no \`## Learning Wave ${nnn}\` (Discovered, Failed assumption, Rule to adjust)`);
  }
  for (const label of LEARNING_LABELS) {
    if (!adrText.includes(label)) {
      throw new Error(`wave ${nnn}: learning section missing ${label}`);
    }
  }
  if (risk.walkthrough || Object.hasOwn(byLetter, 'W')) {
    if (byLetter.W !== 'done') {
      throw new Error(`wave ${nnn}: walkthrough letter W is ${byLetter.W ?? 'missing'}`);
    }
    const missing = missingHeadings(
      fileExists(walkthroughPath(ctx.root, nnn)) ? readText(walkthroughPath(ctx.root, nnn)) : '',
      WALKTHROUGH_HEADINGS,
    );
    if (missing.length) throw new Error(`wave ${nnn}: walkthrough missing ${missing.join(', ')}`);
  }
  if (judgmentRequired(risk, fitnessStatusForPolicy(ctx.root, ctx.config))) {
    if (readDecision(ctx.root, nnn) !== 'approve') {
      throw new Error(`wave ${nnn}: human judgment approval missing (\`whw judge ${nnn} --decision approve --note ...\`)`);
    }
  }
}

/**
 * @param {any} ctx
 * @param {string} nnn
 * @param {'approve'|'reject'} decision
 * @param {string} note
 */
export function writeJudgment(ctx, nnn, decision, note) {
  const body = `# Judgment Wave ${nnn}\n\nDecision: ${decision}\n\nNote: ${note}\n`;
  const file = judgmentPath(ctx.root, nnn);
  writeText(file, body);
  appendCeremony(ctx.root, { event: 'judge', wave: nnn, decision, kind: 'judgment' });
  return file;
}
