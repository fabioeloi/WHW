// SPDX-License-Identifier: MIT
/** `whw metrics` — reproducible repository metrics (JSON snapshot + human table). */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { closeDb, get, openDb } from './db/sqlite.js';
import { BUILTINS } from './gates/runner.js';
import { fileExists, isDir, isGitRepo, listFilesRecursive, readText, runCmd, writeText } from './util.js';

/**
 * @param {string} root
 * @returns {Promise<{ commits: number|null, head: string|null, branch: string|null, firstCommit: string|null, lastCommit: string|null, calendarDays: number|null, prRefsUnique: number|null }>}
 */
async function gitMetrics(root) {
  const empty = { commits: null, head: null, branch: null, firstCommit: null, lastCommit: null, calendarDays: null, prRefsUnique: null };
  if (!(await isGitRepo(root))) return empty;
  const count = await runCmd('git', ['rev-list', '--count', 'HEAD'], { cwd: root });
  if (count.code !== 0) return empty;
  const head = await runCmd('git', ['rev-parse', '--short', 'HEAD'], { cwd: root });
  const branch = await runCmd('git', ['branch', '--show-current'], { cwd: root });
  const first = await runCmd('git', ['log', '--reverse', '--format=%ci', '--max-count=1'], { cwd: root });
  const last = await runCmd('git', ['log', '--format=%ci', '--max-count=1'], { cwd: root });
  const subjects = await runCmd('git', ['log', '--format=%s%n%b'], { cwd: root });
  const prs = new Set(subjects.stdout.match(/#\d+/g) ?? []);
  const f = first.stdout.trim().slice(0, 10);
  const l = last.stdout.trim().slice(0, 10);
  let calendarDays = null;
  if (f && l) {
    calendarDays = Math.max(0, Math.round((new Date(l) - new Date(f)) / 86400000));
  }
  return {
    commits: Number(count.stdout.trim()),
    head: head.stdout.trim() || null,
    branch: branch.stdout.trim() || null,
    firstCommit: f || null,
    lastCommit: l || null,
    calendarDays,
    prRefsUnique: prs.size,
  };
}

/**
 * @param {string} root
 * @returns {{ testFiles: number, testCases: number }}
 */
function testMetrics(root) {
  const testsDir = join(root, 'tests');
  if (!isDir(testsDir)) return { testFiles: 0, testCases: 0 };
  const files = listFilesRecursive(testsDir).filter((f) => /\.(js|mjs|cjs|ts|py|go|rs)$/.test(f));
  let cases = 0;
  for (const f of files) {
    try {
      const text = readText(join(testsDir, f));
      cases += (text.match(/\btest\s*\(/g) ?? []).length;
      cases += (text.match(/\bit\s*\(/g) ?? []).length;
    } catch {
      /* unreadable */
    }
  }
  return { testFiles: files.length, testCases: cases };
}

/** @param {any} ctx @returns {Promise<object>} */
export async function collectMetrics(ctx) {
  const { root, paths } = ctx;
  const git = await gitMetrics(root);
  const adrs = isDir(paths.adr) ? readdirSync(paths.adr).filter((f) => f.endsWith('.md')).length : 0;
  const waves = isDir(paths.planning) ? readdirSync(paths.planning).filter((f) => /^wave-\d{3,}-.+\.todos\.sql$/.test(f)).length : 0;
  const tracks = isDir(paths.planning) ? readdirSync(paths.planning).filter((f) => f.endsWith('.todos.sql')).length : 0;
  let planning = { todos: 0, done: 0, tracks: 0, doneRatio: null };
  let wavesClosed = 0;
  try {
    const db = openDb(paths.state);
    try {
      planning.todos = Number(get(db, 'SELECT COUNT(*) AS n FROM todos;')?.n ?? 0);
      planning.done = Number(get(db, "SELECT COUNT(*) AS n FROM todos WHERE status = 'done';")?.n ?? 0);
      planning.tracks = Number(get(db, 'SELECT COUNT(DISTINCT track) AS n FROM todos;')?.n ?? 0);
      planning.doneRatio = planning.todos ? Number((planning.done / planning.todos).toFixed(3)) : null;
      wavesClosed = Number(get(db, "SELECT COUNT(*) AS n FROM todos WHERE ref LIKE 'wave%-E' AND status = 'done';")?.n ?? 0);
    } finally {
      closeDb(db);
    }
  } catch {
    /* state.db unavailable — planning stays zeroed */
  }
  const customs = Array.isArray(ctx.config?.gates?.custom) ? ctx.config.gates.custom.length : 0;
  let checkpointsGo = 0;
  let checkpointsTotal = 0;
  if (isDir(paths.checkpoints)) {
    for (const gate of readdirSync(paths.checkpoints)) {
      const latest = join(paths.checkpoints, gate, 'latest.txt');
      if (!fileExists(latest)) continue;
      checkpointsTotal++;
      if (readText(latest).includes('status=GO')) checkpointsGo++;
    }
  }
  const tests = testMetrics(root);
  return {
    project: ctx.config?.project ?? null,
    at: new Date().toISOString(),
    git,
    adrs,
    waves: { total: waves, closed: wavesClosed },
    planning: { seeds: tracks, ...planning },
    gates: { builtin: BUILTINS.length, custom: customs, checkpointsGo, checkpointsTotal },
    tests,
  };
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdMetrics(positionals, ctx) {
  const m = await collectMetrics(ctx);
  const out = ctx.flags.out ?? positionals[0];
  if (out) {
    writeText(join(ctx.root, out), `${JSON.stringify(m, null, 2)}\n`);
    ctx.log.info(`metrics → ${out}`);
  }
  if (ctx.json) {
    ctx.log.data(m);
    return 0;
  }
  if (!out) {
    const g = m.git;
    ctx.log.info(`project: ${m.project ?? '(unknown)'}`);
    ctx.log.info(`git: ${g.commits ?? '?'} commits, ${g.prRefsUnique ?? '?'} PR refs, ${g.calendarDays ?? '?'} days (${g.branch ?? '?'} @ ${g.head ?? '?'})`);
    ctx.log.info(`adrs: ${m.adrs} · waves: ${m.waves.closed}/${m.waves.total} closed · planning: ${m.planning.done}/${m.planning.todos} done (${m.planning.tracks} tracks)`);
    ctx.log.info(`gates: ${m.gates.builtin} builtin + ${m.gates.custom} custom · checkpoints GO ${m.gates.checkpointsGo}/${m.gates.checkpointsTotal}`);
    ctx.log.info(`tests: ${m.tests.testCases} cases in ${m.tests.testFiles} files`);
  }
  return 0;
}
