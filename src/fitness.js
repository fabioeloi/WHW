// SPDX-License-Identifier: MIT
/**
 * Project fitness rules (whw.config.json `fitness[]`).
 * Each rule is a shell command. WHW does not embed domain constraints.
 */

import { join } from 'node:path';
import { appendCeremony } from './ceremony.js';
import { fileExists, readJson, runShell, writeText } from './util.js';

export const FITNESS_LATEST = 'fitness-latest.json';

/**
 * @param {any} config
 * @returns {{ id: string, command: string, description?: string }[]}
 */
export function fitnessRules(config) {
  const rules = config?.fitness ?? [];
  if (!Array.isArray(rules)) throw new Error('fitness must be an array');
  for (const rule of rules) {
    if (!rule?.id || !rule?.command) throw new Error('each fitness rule requires id and command');
  }
  return rules;
}

/** @param {string} root */
export function fitnessLatestPath(root) {
  return join(root, '.whw', FITNESS_LATEST);
}

/**
 * @param {string} root
 * @returns {{ status: string, results: { id: string, status: string }[] }|null}
 */
export function readFitnessLatest(root) {
  const file = fitnessLatestPath(root);
  if (!fileExists(file)) return null;
  return readJson(file);
}

/**
 * Run every configured rule. Empty config is GO.
 * Writes .whw/fitness-latest.json and one conformance ceremony fact per rule.
 * @param {any} ctx
 */
export async function runFitness(ctx) {
  const rules = fitnessRules(ctx.config);
  /** @type {{ id: string, status: string }[]} */
  const results = [];
  for (const rule of rules) {
    const res = await runShell(rule.command, { cwd: ctx.root, timeoutMs: 120000 });
    const status = res.code === 0 ? 'GO' : 'NO_GO';
    results.push({ id: rule.id, status });
    appendCeremony(ctx.root, { event: 'gate', name: `fitness:${rule.id}`, kind: 'conformance', status });
  }
  const status = results.every((r) => r.status === 'GO') ? 'GO' : 'NO_GO';
  const payload = { status, results };
  writeText(fitnessLatestPath(ctx.root), `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

/**
 * GO when no rules exist or the latest run passed. Missing latest with rules
 * configured is not GO: an exception review cannot assume a check that never ran.
 * @param {string} root
 * @param {any} config
 * @returns {'GO'|'NO_GO'}
 */
export function fitnessStatusForPolicy(root, config) {
  if (!fitnessRules(config).length) return 'GO';
  const latest = readFitnessLatest(root);
  return latest?.status === 'GO' ? 'GO' : 'NO_GO';
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdFitness(positionals, ctx) {
  const report = await runFitness(ctx);
  if (ctx.json) {
    ctx.log.data(report);
  } else if (!report.results.length) {
    ctx.log.info('no fitness rules configured (GO)');
  } else {
    for (const rule of report.results) {
      ctx.log.info(`${rule.status === 'GO' ? 'GO  ' : 'NO_GO'} ${rule.id}`);
    }
  }
  return report.status === 'GO' ? 0 : 1;
}
