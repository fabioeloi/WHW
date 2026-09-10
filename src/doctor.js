// SPDX-License-Identifier: MIT
/** `whw doctor` — verify toolchain, config, and repo wiring (read-only). */

import { join } from 'node:path';
import { fileExists, isDir, runCmd } from './util.js';

/**
 * @param {string[]} positionals @param {any} ctx @returns {Promise<number>}
 */
export async function cmdDoctor(positionals, ctx) {
  /** @type {{ check: string, status: 'ok'|'warn'|'fail', detail: string }[]} */
  const checks = [];
  const ok = (check, detail) => checks.push({ check, status: 'ok', detail });
  const warn = (check, detail) => checks.push({ check, status: 'warn', detail });
  const fail = (check, detail) => checks.push({ check, status: 'fail', detail });

  // Node + sqlite
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major > 22 || (major === 22 && minor >= 13) || major >= 23) ok('node', `${process.versions.node} (>= 22.13)`);
  else fail('node', `${process.versions.node} — WHW needs Node >= 22.13`);
  try {
    await import('node:sqlite');
    ok('node:sqlite', 'builtin module available');
  } catch {
    fail('node:sqlite', 'unavailable — upgrade Node to >= 22.13');
  }

  // Git
  const gitRes = await runCmd('git', ['--version'], { cwd: ctx.root });
  if (gitRes.code === 0) {
    const rev = await runCmd('git', ['rev-parse', '--git-dir'], { cwd: ctx.root });
    ok('git', `${gitRes.stdout.trim()}${rev.code === 0 ? ' (repo)' : ' (not a repo — handoff/metrics partially work)'}`);
  } else {
    warn('git', 'not found — handoff baselines and metrics need git');
  }

  // Config + layout
  if (ctx.configFile) ok('config', ctx.configFile);
  else warn('config', `no whw.config.json under ${ctx.root} (run \`whw init\`)`);
  for (const [label, p, kind] of [
    ['planning', ctx.paths.planning, 'dir'],
    ['adr', ctx.paths.adr, 'dir'],
    ['AGENTS.md', join(ctx.root, 'AGENTS.md'), 'file'],
    ['WHY.md', join(ctx.root, 'WHY.md'), 'file'],
    ['roles', ctx.paths.roles, 'dir?'],
    ['templates', ctx.paths.templates, 'dir?'],
    ['skills', ctx.paths.skills, 'dir?'],
  ]) {
    const exists = kind === 'file' ? fileExists(p) : isDir(p);
    if (exists) ok(label, p);
    else if (kind === 'dir?') warn(label, `${p} missing (optional unless scaffolding)`);
    else warn(label, `${p} missing (run \`whw init\`)`);
  }

  // State DB opens
  try {
    const { openDb, closeDb, get } = await import('./db/sqlite.js');
    const db = openDb(ctx.paths.state);
    try {
      const n = get(db, 'SELECT COUNT(*) AS n FROM todos;')?.n ?? 0;
      ok('state', `${ctx.paths.state} (${n} todos)`);
    } finally {
      closeDb(db);
    }
  } catch (err) {
    fail('state', `${ctx.paths.state}: ${err instanceof Error ? err.message : err}`);
  }

  // Custom gates (listed, never executed by doctor)
  const customs = ctx.config?.gates?.custom ?? [];
  if (customs.length) ok('custom-gates', customs.map((c) => c?.name).filter(Boolean).join(', '));
  else ok('custom-gates', 'none configured');

  const fails = checks.filter((c) => c.status === 'fail');
  if (ctx.json) {
    ctx.log.data({ checks });
    return fails.length ? 1 : 0;
  }
  for (const c of checks) ctx.log.info(`${c.status.toUpperCase().padEnd(4)} ${c.check} — ${c.detail}`);
  return fails.length ? 1 : 0;
}
