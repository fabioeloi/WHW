// SPDX-License-Identifier: MIT
/**
 * Configuration resolution.
 * Precedence (highest first): CLI flags > WHW_* env vars > whw.config.json > defaults.
 */

import { join, resolve } from 'node:path';
import { fileExists, findRoot, readJson } from './util.js';

export const CONFIG_FILENAME = 'whw.config.json';

/** @returns {object} deep-fresh defaults */
export function defaultConfig() {
  return {
    project: 'WHW Project',
    dirs: {
      planning: 'planning',
      adr: 'docs/adr',
      plan: 'docs/plan.md',
      checkpoints: '.whw/checkpoints',
      state: '.whw/state.db',
      roles: 'roles',
      templates: 'templates',
      skills: 'skills',
    },
    gates: {
      tiers: {
        pr: ['planning-coverage', 'adr-link', 'wave-sync', 'readme-sync', 'agents-parity', 'no-secrets'],
        ops: ['program-inventory', 'evidence-quality', 'release-readiness'],
      },
      custom: [],
    },
    evaluate: {
      phaseA: [],
      threshold: 3.5,
      criteria: [
        { id: 'technical-quality', weight: 1.3 },
        { id: 'originality', weight: 1.3 },
        { id: 'craft', weight: 1.0 },
        { id: 'functionality', weight: 1.0 },
      ],
    },
    conventions: {
      branch: '{type}/wave-{nnn}-{slug}-{letter}',
      commit: '{type}({scope}): {summary} (Wave {nnn} {letter})',
      waveLetters: ['A', 'B', 'C', 'D', 'E'],
    },
    runners: { default: null },
    escalation: { tiers: [], maxFailuresDefault: 2 },
    hooks: {},
  };
}

/**
 * Collect WHW_* env overrides.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function collectEnv(env = process.env) {
  const o = {};
  if (env.WHW_PROJECT) o.project = env.WHW_PROJECT;
  const dirs = {};
  if (env.WHW_PLANNING) dirs.planning = env.WHW_PLANNING;
  if (env.WHW_ADR) dirs.adr = env.WHW_ADR;
  if (env.WHW_PLAN) dirs.plan = env.WHW_PLAN;
  if (env.WHW_CHECKPOINTS) dirs.checkpoints = env.WHW_CHECKPOINTS;
  if (env.WHW_STATE) dirs.state = env.WHW_STATE;
  if (Object.keys(dirs).length) o.dirs = dirs;
  if (env.WHW_RUNNER) o.runners = { default: env.WHW_RUNNER };
  return o;
}

/** Deep-merge plain objects (arrays replace). @returns {object} */
export function mergeDeep(...objs) {
  /** @type {any} */
  const out = {};
  for (const obj of objs) {
    if (!obj || typeof obj !== 'object') continue;
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
        out[k] = mergeDeep(out[k], v);
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

/**
 * Resolve the effective configuration and absolute paths.
 * @param {{ cwd?: string, root?: string, configFile?: string, overrides?: object, env?: NodeJS.ProcessEnv }} [opts]
 * @returns {{ root: string, configFile: string|null, config: any, paths: Record<string,string> }}
 */
export function loadConfig(opts = {}) {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const root = opts.root ? resolve(opts.root) : findRoot(cwd);
  const configFile = opts.configFile
    ? resolve(root, opts.configFile)
    : join(root, CONFIG_FILENAME);
  let fileCfg = {};
  if (fileExists(configFile)) {
    try {
      fileCfg = readJson(configFile);
    } catch (err) {
      throw new Error(`invalid ${configFile}: ${err instanceof Error ? err.message : err}`);
    }
  }
  const config = mergeDeep(defaultConfig(), fileCfg, collectEnv(opts.env), opts.overrides ?? {});
  const d = config.dirs;
  const paths = {
    root,
    planning: resolve(root, d.planning),
    adr: resolve(root, d.adr),
    plan: resolve(root, d.plan),
    checkpoints: resolve(root, d.checkpoints),
    state: resolve(root, d.state),
    roles: resolve(root, d.roles),
    templates: resolve(root, d.templates),
    skills: resolve(root, d.skills),
  };
  return { root, configFile: fileExists(configFile) ? configFile : null, config, paths };
}
