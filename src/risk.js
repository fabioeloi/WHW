// SPDX-License-Identifier: MIT
/**
 * Risk classes and the opt-in shift-left letter chain.
 * Highest matching signal wins. classic ignores the class and keeps A–E.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileExists, isDir, readJson, writeText } from './util.js';

export const PROFILES = ['classic', 'shift-left'];
export const CLASSES = ['low', 'medium', 'high', 'critical'];
export const CLASSIC_LETTERS = ['A', 'B', 'C', 'D', 'E'];

const RANK = { low: 0, medium: 1, high: 2, critical: 3 };

/** Signal vocabulary. Unknown signals are rejected so a typo cannot lower the class. */
export const SIGNAL_CLASS = {
  docs: 'low',
  'local-refactor': 'low',
  'test-only': 'low',
  behavior: 'medium',
  schema: 'medium',
  'new-module': 'medium',
  auth: 'high',
  payment: 'high',
  pii: 'high',
  infra: 'high',
  logging: 'high',
  architecture: 'critical',
  'security-boundary': 'critical',
  'destructive-migration': 'critical',
  'blast-radius': 'critical',
};

/**
 * @param {any} config
 * @returns {'classic'|'shift-left'}
 */
export function processProfile(config) {
  const profile = config?.process?.profile ?? 'classic';
  if (!PROFILES.includes(profile)) {
    throw new Error(`invalid process.profile ${JSON.stringify(profile)} (want classic or shift-left)`);
  }
  return profile;
}

/**
 * @param {string|string[]|undefined|null|boolean} raw
 * @returns {string[]}
 */
export function parseSignals(raw) {
  if (raw == null || raw === false || raw === true || raw === '') return [];
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  return String(raw).split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * @param {string[]} signals
 * @returns {'low'|'medium'|'high'|'critical'}
 */
export function classify(signals) {
  if (!signals.length) throw new Error('shift-left classification requires at least one signal');
  /** @type {'low'|'medium'|'high'|'critical'|null} */
  let best = null;
  for (const signal of signals) {
    const risk = SIGNAL_CLASS[signal];
    if (!risk) {
      throw new Error(`unknown signal ${JSON.stringify(signal)} (known: ${Object.keys(SIGNAL_CLASS).join(', ')})`);
    }
    if (best == null || RANK[risk] > RANK[best]) best = risk;
  }
  return /** @type {'low'|'medium'|'high'|'critical'} */ (best);
}

/**
 * @param {'low'|'medium'|'high'|'critical'} riskClass
 */
export function policyFor(riskClass) {
  switch (riskClass) {
    case 'low':
      return {
        letters: ['A', 'B', 'C', 'E'],
        humanJudgment: 'never',
        fitnessBeforeBuild: false,
        designBeforeBuild: false,
        walkthrough: false,
      };
    case 'medium':
      return {
        letters: ['A', 'B', 'C', 'D', 'E'],
        humanJudgment: 'on-exception',
        fitnessBeforeBuild: false,
        designBeforeBuild: false,
        walkthrough: false,
      };
    case 'high':
      return {
        letters: ['A', 'D0', 'B', 'C', 'D', 'E'],
        humanJudgment: 'always',
        fitnessBeforeBuild: true,
        designBeforeBuild: true,
        walkthrough: false,
      };
    case 'critical':
      return {
        letters: ['A', 'D0', 'B', 'C', 'D', 'W', 'E'],
        humanJudgment: 'always',
        fitnessBeforeBuild: true,
        designBeforeBuild: true,
        walkthrough: true,
      };
    default:
      throw new Error(`unknown risk class ${JSON.stringify(riskClass)}`);
  }
}

/**
 * @param {'classic'|'shift-left'} profile
 * @param {'low'|'medium'|'high'|'critical'|null} riskClass
 * @returns {string[]}
 */
export function lettersFor(profile, riskClass) {
  if (profile === 'classic') return [...CLASSIC_LETTERS];
  return [...policyFor(/** @type {'low'|'medium'|'high'|'critical'} */ (riskClass)).letters];
}

/**
 * @param {string} planningDir
 * @param {string} nnn
 * @param {string} slug
 */
export function riskFilePath(planningDir, nnn, slug) {
  return join(planningDir, `wave-${nnn}-${slug}.risk.json`);
}

/**
 * @param {string} planningDir
 * @param {object} record
 */
export function writeWaveRisk(planningDir, record) {
  writeText(riskFilePath(planningDir, record.wave, record.slug), `${JSON.stringify(record, null, 2)}\n`);
}

/**
 * @param {string} planningDir
 * @param {string} nnn
 * @returns {any|null}
 */
export function findWaveRisk(planningDir, nnn) {
  if (!isDir(planningDir)) return null;
  const hits = readdirSync(planningDir).filter((f) => new RegExp(`^wave-${nnn}-.+\\.risk\\.json$`).test(f));
  if (!hits.length) return null;
  if (hits.length > 1) throw new Error(`multiple risk files for wave ${nnn}: ${hits.join(', ')}`);
  const file = join(planningDir, hits[0]);
  if (!fileExists(file)) return null;
  return readJson(file);
}

/**
 * @param {string|null|undefined} track
 * @returns {string|null}
 */
export function waveNnnFromTrack(track) {
  const match = /^wave-(\d{3,})-/.exec(track ?? '');
  return match ? match[1] : null;
}
