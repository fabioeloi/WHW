// SPDX-License-Identifier: MIT
/**
 * Compare classic and shift-left on the same ledger scenario.
 * No model calls. Review wait is a weight, not a measured duration.
 */

import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readCeremony } from '../../src/ceremony.js';
import { main } from '../../src/cli.js';
import { fitnessStatusForPolicy } from '../../src/fitness.js';
import { readJson, writeText } from '../../src/util.js';
import { CHANGES, FITNESS } from './scenario.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const LEDGER = join(HERE, 'ledger');
const COST_MODEL_PATH = join(HERE, 'cost-model.json');

export const ASSUMPTION = 'The design oracle treats an early D0 as selecting the safe architecture and treats a late classic review as not reverting code already built. Classic human review is modeled by the driver (one attestation per wave) because the A–E contract has no separate approval command. Shift-left attestation is enforced by the CLI. This encodes the diagnosis hypothesis; it is not a field measurement.';

/** @param {any} value @returns {any} */
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

/** @param {object} report */
export function digestReport(report) {
  const { digest, ...rest } = report;
  return createHash('sha256').update(JSON.stringify(canonical(rest))).digest('hex');
}

/**
 * @param {object} report
 * @returns {'recommend-adopt'|'recommend-reject'|'tradeoff'|'inconclusive'}
 */
export function verdictFor(report) {
  const classic = report.profiles.classic.totals;
  const shift = report.profiles['shift-left'].totals;
  if (classic.classMismatch || shift.classMismatch) return 'inconclusive';
  const classicContract = classic.universalJudgment
    && classic.lettersClassic
    && classic.closedWaves === classic.changes;
  const criticalOk = shift.criticalHumanJudgments === shift.criticalCount
    && shift.criticalWalkthroughs === shift.criticalCount;
  const lowOk = shift.lowHumanJudgments === 0;
  if (!classicContract || !criticalOk || !lowOk || shift.escapedDefects > classic.escapedDefects) {
    return 'recommend-reject';
  }
  const lighter = shift.ceremonyCost < classic.ceremonyCost;
  const safer = shift.escapedDefects < classic.escapedDefects;
  if (lighter && shift.escapedDefects <= classic.escapedDefects) return 'recommend-adopt';
  if (lighter !== safer && safer) return 'tradeoff';
  if (!lighter && safer) return 'tradeoff';
  return 'inconclusive';
}

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out;
}

/** @param {string} root */
function copyLedger(root) {
  for (const name of readdirSync(LEDGER)) {
    cpSync(join(LEDGER, name), join(root, name), { recursive: true });
  }
}

/**
 * @param {string} root
 * @param {string[]} args
 */
async function whw(root, args) {
  const code = await main(args, { cwd: root, quiet: true });
  if (code !== 0) throw new Error(`whw ${args.join(' ')} exited ${code}`);
}

/**
 * @param {string} root
 * @param {string[]} args
 */
async function tryWhw(root, args) {
  try {
    await whw(root, args);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * @param {Record<string, any>[]} facts
 * @param {Record<string, number>} weights
 */
function priceFacts(facts, weights) {
  const dones = facts.filter((fact) => fact.event === 'done');
  const closes = facts.filter((fact) => fact.event === 'close');
  const judges = facts.filter((fact) => fact.event === 'judge');
  const gates = facts.filter((fact) => fact.event === 'gate');
  const ceremonyCost = gates.length * weights.conformanceGate
    + (dones.length + closes.length) * weights.letterPair
    + dones.filter((fact) => fact.letter === 'D0').length * weights.designCheckpoint
    + dones.filter((fact) => fact.letter === 'W').length * weights.walkthrough
    + judges.length * (weights.attestation + weights.reviewWait)
    + closes.filter((fact) => fact.learning).length * weights.learning;
  return { ceremonyCost, humanJudgments: judges.length, conformanceGates: gates.length };
}

/** @param {object[]} changes */
function totalsOf(changes) {
  const sum = (key) => changes.reduce((total, change) => total + change[key], 0);
  const lows = changes.filter((change) => change.expectedClass === 'low');
  const criticals = changes.filter((change) => change.expectedClass === 'critical');
  return {
    changes: changes.length,
    humanJudgments: sum('humanJudgments'),
    conformanceGates: sum('conformanceGates'),
    artifacts: sum('artifacts'),
    reworkPreBuild: sum('reworkPreBuild'),
    reworkPostBuild: sum('reworkPostBuild'),
    escapedDefects: sum('escapedDefects'),
    ceremonyCost: sum('ceremonyCost'),
    costExcludingOracle: sum('costExcludingOracle'),
    modeledCost: sum('modeledCost'),
    fitnessBlockedBuild: sum('fitnessBlockedBuild'),
    lowCount: lows.length,
    lowHumanJudgments: lows.reduce((total, change) => total + change.humanJudgments, 0),
    criticalCount: criticals.length,
    criticalHumanJudgments: criticals.filter((change) => change.humanJudgments >= 1).length,
    criticalWalkthroughs: criticals.filter((change) => change.walkthrough).length,
    classMismatch: changes.some((change) => change.classMismatch),
    universalJudgment: changes.length > 0 && changes.every((change) => change.humanJudgments >= 1),
    closedWaves: changes.filter((change) => change.closed).length,
    lettersClassic: changes.length > 0 && changes.every((change) => change.letters.join(',') === 'A,B,C,D,E'),
  };
}

/**
 * @param {string} root
 * @param {string} nnn
 * @param {string} slug
 */
function writeDesign(root, nnn, slug) {
  writeText(join(root, 'docs', 'design', `wave-${nnn}.md`), `# Design Wave ${nnn}

## Hypothesis

${slug} changes something a ledger user can notice.

## Alternatives

Leave the current boundary in place.

## Risks

The change can leak data or couple domain to storage.

## Boundaries

Domain code stays free of infrastructure imports.

## Test strategy

Fitness rules plus the contract test names.

## Operational impact

No migration. Revert the wave if pay fails.

## Human review

Follow the risk policy for this class.
`);
}

/**
 * @param {string} root
 * @param {string} nnn
 * @param {string} slug
 */
function writeWalkthrough(root, nnn, slug) {
  writeText(join(root, 'docs', 'walkthrough', `wave-${nnn}.md`), `# Walkthrough Wave ${nnn}

## Problem

${slug} needs a traceable decision before it is trusted.

## Main path

A caller reaches pay or formatInvoice through the API edge.

## Dangerous failure

Domain code reading the payments table directly.

## Rollback

Restore the previous domain and API files.

## Architectural decision

Domain modules do not import infrastructure.

## Evidence

Fitness GO and the absence of a direct payments read.
`);
}

/**
 * @param {string} root
 * @param {string} marker
 */
function treeHas(root, marker) {
  const src = join(root, 'src');
  return walk(src).some((file) => readFileSync(file, 'utf8').includes(marker));
}

/**
 * @param {string} root
 * @param {'classic'|'shift-left'} profile
 * @param {object} change
 * @param {Record<string, number>} weights
 */
async function runChange(root, profile, change, weights) {
  const before = readCeremony(root).length;
  await whw(root, ['adr', 'new', change.id, '--title', change.title]);
  await whw(root, ['wave', 'new', change.id, '--adr', adrNumber(root, change.id), '--signals', change.signals.join(',')]);
  await whw(root, ['sync', '--all']);
  const risk = readJson(riskPath(root, change.id));
  const nnn = risk.wave;
  const letters = risk.letters;
  const config = readJson(join(root, 'whw.config.json'));
  let reworkPreBuild = 0;
  let reworkPostBuild = 0;
  let fitnessBlockedBuild = 0;
  let d0Done = false;

  for (const letter of letters) {
    if (letter === 'E') break;
    const ref = `wave${nnn}-${letter}`;
    if (letter === 'D' && profile === 'shift-left' && risk.humanJudgment === 'on-exception'
      && fitnessStatusForPolicy(root, config) === 'GO') {
      await whw(root, ['cancel', ref, '--reason', 'no conformance exception']);
      continue;
    }
    if (letter === 'D' && (profile === 'classic' || risk.humanJudgment === 'always' || risk.humanJudgment === 'on-exception')) {
      await whw(root, ['judge', nnn, '--decision', 'approve', '--note', `modeled review for ${change.id}`]);
    }
    if (letter === 'D0') writeDesign(root, nnn, change.id);
    if (letter === 'W') writeWalkthrough(root, nnn, change.id);
    if (letter === 'B' && change.apply) change.apply(root);

    const claim = await tryWhw(root, ['claim', ref]);
    if (!claim.ok) {
      if (letter === 'B' && change.repair && /fitness NO_GO/.test(claim.error.message)) {
        reworkPreBuild += 1;
        fitnessBlockedBuild += 1;
        change.repair(root, { d0Done });
        await whw(root, ['claim', ref]);
      } else {
        throw claim.error;
      }
    }
    const done = await tryWhw(root, ['done', ref, '--evidence', `benchmark ${change.id} ${letter}`]);
    if (!done.ok) {
      if (letter === 'C' && change.repair && /fitness NO_GO/.test(done.error.message)) {
        reworkPostBuild += 1;
        change.repair(root, { d0Done });
        await whw(root, ['done', ref, '--evidence', `benchmark ${change.id} ${letter} repaired`]);
      } else {
        throw done.error;
      }
    }
    if (letter === 'D0') d0Done = true;
  }

  const adr = adrFile(root, change.id);
  const adrText = readFileSync(adr, 'utf8');
  const addendum = `\n## Addendum Wave ${nnn} — ${change.id}\n\nShipped under the benchmark driver.\n`;
  if (!adrText.includes(`## Addendum Wave ${nnn}`)) {
    writeText(adr, `${adrText.replace(/\n*$/, '\n')}${addendum}`);
  }
  const plan = join(root, 'docs', 'plan.md');
  const planText = readFileSync(plan, 'utf8');
  if (!planText.includes(`## Wave ${nnn}`)) {
    writeText(plan, `${planText.replace(/\n*$/, '\n')}\n## Wave ${nnn} — ${change.id}\n\nBenchmark letters complete.\n`);
  }
  if (profile === 'shift-left') {
    const current = readFileSync(adr, 'utf8');
    if (!current.includes(`## Learning Wave ${nnn}`)) {
      writeText(adr, `${current.replace(/\n*$/, '\n')}\n## Learning Wave ${nnn}\n\n- Discovered: ${change.id} is class ${change.expectedClass}.\n- Failed assumption: a late review would undo code that was already written.\n- Rule to adjust: run design and fitness before Build when the class is high or critical.\n`);
    }
  }
  await whw(root, ['close', nnn]);

  const facts = readCeremony(root).slice(before);
  const priced = priceFacts(facts, weights);
  const escapedDefects = change.oracle && treeHas(root, change.oracle.marker) ? 1 : 0;
  const ceremonyCost = priced.ceremonyCost;
  const costExcludingOracle = ceremonyCost
    + reworkPreBuild * weights.reworkPreBuild
    + reworkPostBuild * weights.reworkPostBuild;
  const modeledCost = costExcludingOracle + escapedDefects * weights.escapedDefect;
  const adrAfter = readFileSync(adr, 'utf8');
  const planAfter = readFileSync(plan, 'utf8');
  let artifacts = 0;
  if (exists(join(root, 'docs', 'design', `wave-${nnn}.md`))) artifacts += 1;
  if (exists(join(root, 'docs', 'walkthrough', `wave-${nnn}.md`))) artifacts += 1;
  if (exists(join(root, 'docs', 'judgment', `wave-${nnn}.md`))) artifacts += 1;
  if (adrAfter.includes(`## Addendum Wave ${nnn}`)) artifacts += 1;
  if (adrAfter.includes(`## Learning Wave ${nnn}`)) artifacts += 1;
  if (planAfter.includes(`## Wave ${nnn}`)) artifacts += 1;

  return {
    id: change.id,
    expectedClass: change.expectedClass,
    obtainedClass: risk.class,
    letters,
    classMismatch: profile === 'shift-left' && risk.class !== change.expectedClass,
    humanJudgments: priced.humanJudgments,
    conformanceGates: priced.conformanceGates,
    artifacts,
    reworkPreBuild,
    reworkPostBuild,
    escapedDefects,
    ceremonyCost,
    costExcludingOracle,
    modeledCost,
    fitnessBlockedBuild,
    walkthrough: exists(join(root, 'docs', 'walkthrough', `wave-${nnn}.md`)),
    closed: true,
  };
}

/** @param {string} file */
function exists(file) {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

/** @param {string} root @param {string} slug */
function adrFile(root, slug) {
  const dir = join(root, 'docs', 'adr');
  const name = readdirSync(dir).find((file) => file.endsWith(`-${slug}.md`));
  if (!name) throw new Error(`missing ADR for ${slug}`);
  return join(dir, name);
}

/** @param {string} root @param {string} slug */
function adrNumber(root, slug) {
  const name = adrFile(root, slug).split('/').pop();
  return name.slice(0, 4);
}

/** @param {string} root @param {string} slug */
function riskPath(root, slug) {
  const dir = join(root, 'planning');
  const name = readdirSync(dir).find((file) => file.endsWith(`-${slug}.risk.json`));
  if (!name) throw new Error(`missing risk file for ${slug}`);
  return join(dir, name);
}

/**
 * @param {string} root
 * @param {'classic'|'shift-left'} profile
 * @param {Record<string, number>} weights
 */
async function runProfile(root, profile, weights) {
  const changes = [];
  for (const change of CHANGES) {
    try {
      changes.push(await runChange(root, profile, change, weights));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${profile} ${change.id}: ${message}`);
    }
  }
  return { changes, totals: totalsOf(changes) };
}

/**
 * @param {{ outFile?: string }} [opts]
 */
export async function runBenchmark(opts = {}) {
  const weights = readJson(COST_MODEL_PATH).weights;
  /** @type {Record<string, any>} */
  const profiles = {};
  for (const profile of ['classic', 'shift-left']) {
    const root = mkdtempSync(join(tmpdir(), `whw-bench-${profile}-`));
    copyLedger(root);
    await whw(root, ['init', '--project', 'Ledger', '--tools', 'cursor']);
    const config = readJson(join(root, 'whw.config.json'));
    config.process = { profile };
    config.fitness = FITNESS;
    writeText(join(root, 'whw.config.json'), `${JSON.stringify(config, null, 2)}\n`);
    mkdirSync(join(root, 'docs', 'adr'), { recursive: true });
    profiles[profile] = await runProfile(root, profile, weights);
  }
  const report = {
    scenario: 'ledger',
    comprehensionProven: false,
    assumption: ASSUMPTION,
    notSimulated: {
      modelCalls: null,
      tokens: null,
      humanWaitTime: null,
      reason: 'No model is called. Review wait is a weight in the cost model, not an observed duration.',
    },
    weights,
    profiles,
    delta: {
      ceremonyCost: profiles['shift-left'].totals.ceremonyCost - profiles.classic.totals.ceremonyCost,
      costExcludingOracle: profiles['shift-left'].totals.costExcludingOracle - profiles.classic.totals.costExcludingOracle,
      modeledCost: profiles['shift-left'].totals.modeledCost - profiles.classic.totals.modeledCost,
      escapedDefects: profiles['shift-left'].totals.escapedDefects - profiles.classic.totals.escapedDefects,
    },
    verdict: 'inconclusive',
  };
  report.verdict = verdictFor(report);
  report.digest = digestReport(report);
  if (opts.outFile) writeText(opts.outFile, `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const outFile = join(HERE, 'out', 'report.json');
  const report = await runBenchmark({ outFile });
  process.stdout.write(`${report.verdict}\n${outFile}\n`);
}
