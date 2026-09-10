// SPDX-License-Identifier: MIT
/**
 * `whw evaluate` — two-phase evaluation.
 * Phase A: deterministic checks (lint/tests/build) at zero AI cost.
 * Phase B: weighted rubric ingest (model-agnostic prompt + JSON scores).
 * Report: .whw/evaluation-report.json (default, overridable with --report).
 */

import { join } from 'node:path';
import { fileExists, readJson, runShell, writeText } from './util.js';

const DEFAULT_REPORT = join('.whw', 'evaluation-report.json');

/** @param {any} ctx @returns {{ id: string, weight: number }[]} */
export function criteria(ctx) {
  const list = ctx.config?.evaluate?.criteria;
  if (!Array.isArray(list) || !list.length) {
    throw new Error('no evaluate.criteria in whw.config.json (run `whw init` for defaults)');
  }
  return list;
}

/** @param {any} ctx @returns {number} */
export function threshold(ctx) {
  const t = ctx.config?.evaluate?.threshold;
  return typeof t === 'number' ? t : 3.5;
}

/**
 * @param {Record<string, number>} scores
 * @param {{ id: string, weight: number }[]} crit
 */
export function weightedAverage(scores, crit) {
  let num = 0;
  let den = 0;
  const breakdown = {};
  for (const c of crit) {
    const s = scores[c.id];
    if (typeof s !== 'number' || Number.isNaN(s) || s < 0 || s > 5) {
      throw new Error(`score for ${JSON.stringify(c.id)} must be a number 0–5 (got ${JSON.stringify(s)})`);
    }
    num += s * c.weight;
    den += c.weight;
    breakdown[c.id] = { score: s, weight: c.weight };
  }
  return { average: den ? Number((num / den).toFixed(3)) : 0, breakdown };
}

/**
 * Model-agnostic Phase B scoring prompt (stdout when --scores is absent).
 * @param {any} ctx
 */
export function phaseBPrompt(ctx) {
  const crit = criteria(ctx);
  const lines = crit.map((c) => `- ${c.id} (weight ${c.weight}): score 0–5`).join('\n');
  return `# WHW Phase B — rubric scoring

Score the change under review (read the diff, the wave's todos, and the
evaluation criteria in roles/evaluator.md). Reply with JSON ONLY:

\`\`\`json
{
  "scores": {
${crit.map((c) => `    "${c.id}": 0`).join(',\n')}
  },
  "fixes": ["top fix if average < ${threshold(ctx)}, else empty", "…", "…"]
}
\`\`\`

Rubric:
${lines}

Then ingest: \`whw evaluate --phase b --scores '<json>'\`
`;
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdEvaluate(positionals, ctx) {
  const phase = ctx.flags.phase ?? positionals[0];
  if (phase !== 'a' && phase !== 'b') {
    throw new Error('usage: whw evaluate --phase a|b [--scores JSON] [--report FILE]');
  }
  const reportFile = join(ctx.root, ctx.flags.report ?? DEFAULT_REPORT);
  const report = fileExists(reportFile) ? readJson(reportFile) : {};

  if (phase === 'a') {
    const commands = ctx.config?.evaluate?.phaseA;
    if (!Array.isArray(commands) || !commands.length) {
      throw new Error('no evaluate.phaseA commands in whw.config.json (e.g. ["node --test \\"tests/**/*.test.js\\""])');
    }
    const checks = [];
    for (const command of commands) {
      const res = await runShell(String(command), { cwd: ctx.root, timeoutMs: 600000 });
      const tail = `${res.stdout}\n${res.stderr}`.trim().split('\n').slice(-10);
      checks.push({ command: String(command), code: res.code, pass: res.code === 0, tail });
    }
    const pass = checks.every((c) => c.pass);
    report.phaseA = { status: pass ? 'pass' : 'fail', checks, at: new Date().toISOString() };
    writeText(reportFile, `${JSON.stringify(report, null, 2)}\n`);
    if (ctx.json) {
      ctx.log.data(report.phaseA);
      return pass ? 0 : 1;
    }
    for (const c of checks) ctx.log.info(`${c.pass ? 'PASS' : 'FAIL'} $ ${c.command} (exit ${c.code})`);
    ctx.log.info(`Phase A ${pass ? 'PASS' : 'FAIL'} → ${reportFile}`);
    return pass ? 0 : 1;
  }

  // Phase B
  const raw = ctx.flags.scores;
  if (!raw) {
    process.stdout.write(`${phaseBPrompt(ctx)}\n`);
    return 0;
  }
  const text = raw.startsWith('@') ? (await import('./util.js').then((u) => u.readText(join(ctx.root, raw.slice(1))))) : raw;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('--scores must be JSON (or @file.json)');
  }
  const scores = parsed.scores ?? parsed;
  const crit = criteria(ctx);
  for (const c of crit) {
    if (!(c.id in scores)) throw new Error(`missing score for ${JSON.stringify(c.id)} (criteria: ${crit.map((x) => x.id).join(', ')})`);
  }
  const { average, breakdown } = weightedAverage(scores, crit);
  const t = threshold(ctx);
  const verdict = average >= t ? 'APPROVE' : 'REJECT';
  const fixes = Array.isArray(parsed.fixes) ? parsed.fixes : [];
  if (verdict === 'REJECT' && !fixes.length) {
    throw new Error(`REJECT (average ${average} < ${t}) requires "fixes": ["…", "…", "…"] in the scores JSON`);
  }
  report.phaseB = { status: verdict === 'APPROVE' ? 'pass' : 'fail', verdict, average, threshold: t, breakdown, fixes, at: new Date().toISOString() };
  writeText(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  if (ctx.json) {
    ctx.log.data(report.phaseB);
    return verdict === 'APPROVE' ? 0 : 1;
  }
  ctx.log.info(`Phase B ${verdict} — weighted average ${average} (threshold ${t}) → ${reportFile}`);
  for (const f of fixes) ctx.log.info(`  fix: ${f}`);
  return verdict === 'APPROVE' ? 0 : 1;
}
