// SPDX-License-Identifier: MIT
/**
 * Gate runner: selection by name/tier, GO/NO_GO checkpoints, custom shell gates.
 * Checkpoints: .whw/checkpoints/<gate>/<gate>-<stamp>.txt + latest.txt (copy).
 */

import { join } from 'node:path';
import { closeDb, get, openDb } from '../db/sqlite.js';
import { runHook } from '../hooks.js';
import { localDate, runShell, utcStamp, writeText } from '../util.js';
import { listSeedFiles } from '../planning/seed.js';
import * as planningCoverage from './builtin/planning-coverage.js';
import * as adrLink from './builtin/adr-link.js';
import * as programInventory from './builtin/program-inventory.js';
import * as waveSync from './builtin/wave-sync.js';
import * as readmeSync from './builtin/readme-sync.js';
import * as agentsParity from './builtin/agents-parity.js';
import * as noSecrets from './builtin/no-secrets.js';
import * as evidenceQuality from './builtin/evidence-quality.js';
import * as releaseReadiness from './builtin/release-readiness.js';

export const BUILTINS = [
  planningCoverage, adrLink, programInventory, waveSync, readmeSync, agentsParity, noSecrets, evidenceQuality, releaseReadiness,
];

/**
 * @param {any} ctx
 * @returns {{ name: string, description: string, builtin: boolean, tiers: string[], command?: string }[]}
 */
export function listGates(ctx) {
  const tiers = ctx.config?.gates?.tiers ?? {};
  const customs = Array.isArray(ctx.config?.gates?.custom) ? ctx.config.gates.custom : [];
  const tierOf = (name) => Object.entries(tiers).filter(([, names]) => names?.includes(name)).map(([t]) => t);
  const out = BUILTINS.map((g) => ({ name: g.name, description: g.description, builtin: true, tiers: tierOf(g.name) }));
  for (const c of customs) {
    if (!c?.name || !c?.command) continue;
    out.push({ name: c.name, description: c.description ?? '(custom shell gate)', builtin: false, tiers: tierOf(c.name), command: c.command });
  }
  return out;
}

/**
 * @param {any} ctx
 * @param {string} gateName
 * @param {{ status: string, failures: string[], details: string[] }} result
 * @returns {{ file: string, latest: string }}
 */
export function writeCheckpoint(ctx, gateName, result) {
  const dir = join(ctx.paths.checkpoints, gateName);
  const stamp = utcStamp();
  const lines = [`# whw gate ${gateName} — ${localDate()}T${stamp.slice(9)} (${stamp})`];
  for (const d of result.details) lines.push(`[${stamp.slice(9)}] PASS ${d}`);
  for (const f of result.failures) lines.push(`[${stamp.slice(9)}] FAIL ${f}`);
  lines.push(`status=${result.status} failures=${result.failures.length}`);
  const content = `${lines.join('\n')}\n`;
  const file = join(dir, `${gateName}-${stamp}.txt`);
  const latest = join(dir, 'latest.txt');
  writeText(file, content);
  writeText(latest, content);
  return { file, latest };
}

/**
 * Run one gate (builtin or custom shell command).
 * @param {any} ctx
 * @param {{ name: string, command?: string }} gate
 * @param {import('node:sqlite').DatabaseSync} db
 */
export async function runOne(ctx, gate, db) {
  const builtin = BUILTINS.find((g) => g.name === gate.name);
  if (builtin) return builtin.run(ctx, db);
  const custom = (ctx.config?.gates?.custom ?? []).find((c) => c?.name === gate.name);
  if (!custom?.command) throw new Error(`unknown gate: ${gate.name} (run \`whw gate list\`)`);
  const res = await runShell(custom.command, { cwd: ctx.root, timeoutMs: 300000 });
  const tail = `${res.stdout}\n${res.stderr}`.trim().split('\n').slice(-15).join('\n');
  if (res.code === 0) {
    return { status: 'GO', failures: [], details: [`$ ${custom.command}`, ...tail.split('\n').slice(-3)] };
  }
  return { status: 'NO_GO', failures: [`exit ${res.code}: $ ${custom.command}`], details: tail.split('\n') };
}

/**
 * Resolve the selection to gate names.
 * @param {any} ctx
 * @param {string[]} names
 * @param {{ tier?: string, all?: boolean }} opts
 */
export function resolveSelection(ctx, names, opts = {}) {
  const available = listGates(ctx).map((g) => g.name);
  if (opts.all) return available;
  if (opts.tier) {
    const tier = ctx.config?.gates?.tiers?.[opts.tier];
    if (!tier) throw new Error(`unknown tier ${JSON.stringify(opts.tier)} (tiers: ${Object.keys(ctx.config?.gates?.tiers ?? {}).join(', ')})`);
    return [...tier];
  }
  if (names.length) {
    for (const n of names) {
      if (!available.includes(n)) throw new Error(`unknown gate: ${n} (run \`whw gate list\`)`);
    }
    return names;
  }
  return [...(ctx.config?.gates?.tiers?.pr ?? [])];
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdGateList(positionals, ctx) {
  const gates = listGates(ctx);
  if (ctx.json) {
    ctx.log.data({ gates });
    return 0;
  }
  for (const g of gates) {
    const tiers = g.tiers.length ? g.tiers.join(',') : 'untiered';
    ctx.log.info(`${g.builtin ? '[builtin]' : '[custom] '} ${g.name} (${tiers}) — ${g.description}`);
  }
  return 0;
}

/**
 * @param {string[]} positionals @param {any} ctx @param {string|null} sub
 * @returns {Promise<number>}
 */
export async function cmdGateRun(positionals, ctx, sub = null) {
  const names = sub && sub !== 'run' ? [sub, ...positionals] : positionals;
  const selected = resolveSelection(ctx, names, { tier: ctx.flags.tier, all: Boolean(ctx.flags.all) });
  if (!selected.length) {
    ctx.log.info('no gates selected.');
    return 0;
  }
  const db = openDb(ctx.paths.state);
  /** @type {string[]} */
  let failedNames = [];
  let code = 0;
  try {
    const seedFiles = listSeedFiles(ctx.paths.planning);
    const todoCount = Number(get(db, 'SELECT COUNT(*) AS n FROM todos;')?.n ?? 0);
    if (seedFiles.length && todoCount === 0) {
      const result = {
        status: 'NO_GO',
        failures: [`${seedFiles.length} planning seed(s) but 0 todos in state.db — run \`whw sync --all\``],
        details: [],
      };
      const cp = writeCheckpoint(ctx, 'unsynced-state', result);
      if (ctx.json) {
        ctx.log.data({ results: [{ name: 'unsynced-state', ...result, checkpoint: cp.latest }] });
      } else {
        ctx.log.info(`NO_GO unsynced-state (${cp.latest})`);
        ctx.log.info(`      FAIL ${result.failures[0]}`);
      }
      failedNames = ['unsynced-state'];
      code = 1;
    } else {
      const results = [];
      for (const gateName of selected) {
        let result;
        try {
          result = await runOne(ctx, { name: gateName }, db);
        } catch (err) {
          result = { status: 'NO_GO', failures: [err instanceof Error ? err.message : String(err)], details: [] };
        }
        const cp = writeCheckpoint(ctx, gateName, result);
        results.push({ name: gateName, ...result, checkpoint: cp.latest });
      }
      const failed = results.filter((r) => r.status !== 'GO');
      failedNames = failed.map((r) => r.name);
      code = failed.length ? 1 : 0;
      if (ctx.json) {
        ctx.log.data({ results });
      } else {
        for (const r of results) {
          ctx.log.info(`${r.status === 'GO' ? 'GO  ' : 'NO_GO'} ${r.name} (${r.checkpoint})`);
          for (const f of r.failures) ctx.log.info(`      FAIL ${f}`);
        }
      }
    }
  } finally {
    closeDb(db);
  }
  if (failedNames.length) {
    await runHook(ctx, 'on_gate_fail', { WHW_GATES: failedNames.join(',') });
  }
  return code;
}
