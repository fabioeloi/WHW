// SPDX-License-Identifier: MIT
/**
 * `whw run` — optional agent runner. Composes role prompt + AGENTS.md + queue
 * context and invokes a configured CLI. Honors the escalation ladder; the
 * final tier is always human. Bring your own runner or use this one — the
 * harness never requires a specific model.
 *
 * Runner contract: shell command with env WHW_PROMPT_FILE (markdown prompt),
 * WHW_ROLE, WHW_REF, WHW_ROOT, WHW_ATTEMPT, WHW_TIER. Exit 0 = task complete.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { closeDb, get, openDb } from './db/sqlite.js';
import { getQueue } from './planning/queue.js';
import { recentTransitions } from './planning/transitions.js';
import { statusData } from './report.js';
import { fileExists, isDir, readText, runShell, utcStamp, writeText } from './util.js';

/**
 * @param {any} ctx
 * @param {string} role
 */
export function loadRole(ctx, role) {
  const file = join(ctx.paths.roles, `${role}.md`);
  if (!fileExists(file)) {
    const known = isDir(ctx.paths.roles) ? readdirSync(ctx.paths.roles).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)) : [];
    throw new Error(`unknown role: ${role}${known.length ? ` (roles: ${known.join(', ')})` : ' — is roles/ installed? Run `whw init`.'}`);
  }
  return { file, text: readText(file) };
}

/**
 * @param {any} ctx
 * @param {{ role: string, ref?: string, task?: string, attempt?: number, tier?: string, failures?: string[] }} opts
 */
export function composePrompt(ctx, opts) {
  const { text: roleText } = loadRole(ctx, opts.role);
  const parts = [`# WHW run — role: ${opts.role}`, ''];
  parts.push('## Role', '', roleText.trim(), '');
  const agents = join(ctx.root, 'AGENTS.md');
  if (fileExists(agents)) parts.push('## Project instructions (AGENTS.md)', '', readText(agents).trim(), '');
  try {
    const db = openDb(ctx.paths.state);
    try {
      if (opts.ref) {
        const row = get(db, 'SELECT ref, title, status, track, step, letter, adr, notes, evidence FROM todos WHERE ref = ?;', opts.ref);
        parts.push('## Assigned todo', '', row ? ['- ref: ' + row.ref, '- title: ' + row.title, '- status: ' + row.status, '- track: ' + row.track, '- adr: ' + (row.adr ?? '(none)'), row.notes ? '- notes: ' + row.notes : null].filter(Boolean).join('\n') : `(unknown ref ${opts.ref})`, '');
      } else {
        const q = getQueue(db, { limit: 5 });
        const lines = [...q.inProgress.map((t) => `- [in_progress] ${t.ref} — ${t.title}`), ...q.ready.map((t) => `- [ready] ${t.ref} — ${t.title}`)];
        parts.push('## Queue (top)', '', lines.length ? lines.join('\n') : '(empty)', '');
      }
      const d = statusData(db, {});
      if (d.blocked.length) parts.push('## Blocked (do not pick these without unblocking)', '', d.blocked.map((t) => `- ${t.ref} — ${t.title}`).join('\n'), '');
      const trs = recentTransitions(db, { limit: 5 });
      if (trs.length) parts.push('## Recent transitions', '', trs.map((t) => `- ${t.ref} ${t.from_status} → ${t.to_status} (${t.actor ?? '?'})`).join('\n'), '');
    } finally {
      closeDb(db);
    }
  } catch {
    parts.push('## Queue', '', '(state.db unavailable — run `whw sync --all`)', '');
  }
  if (opts.task) parts.push('## Task', '', opts.task.trim(), '');
  if (opts.failures?.length) parts.push('## Previous failures (fix the cause, do not repeat)', '', opts.failures.map((f) => `- ${f}`).join('\n'), '');
  parts.push(`## Attempt context`, '', `- attempt: ${opts.attempt ?? 1}`, `- tier: ${opts.tier ?? 'single'}`, `- ref: ${opts.ref ?? '(none — pick from queue)'}`, '');
  parts.push('Exit 0 only when the task is complete with evidence recorded via `whw done --evidence`.', '');
  return parts.join('\n');
}

/**
 * Resolve escalation tiers: [{ name, runner, maxFailures }] ending implicitly
 * in human. A bare --runner/--default with no tiers = single attempt.
 * @param {any} ctx
 * @param {string|undefined} runnerFlag
 */
export function resolveTiers(ctx, runnerFlag) {
  const configured = Array.isArray(ctx.config?.escalation?.tiers) ? ctx.config.escalation.tiers : [];
  const fallback = Number(ctx.config?.escalation?.maxFailuresDefault ?? 2);
  if (runnerFlag) return [{ name: 'flag', runner: runnerFlag, maxFailures: 1 }];
  if (configured.length) {
    return configured.map((t, i) => ({
      name: t.name ?? `tier-${i}`,
      runner: t.runner ?? ctx.config?.runners?.default,
      maxFailures: Number(t.maxFailures ?? fallback),
      human: Boolean(t.human),
      model: t.model ?? null,
      costClass: t.costClass ?? (t.human ? 'human' : null),
    }));
  }
  const dflt = ctx.config?.runners?.default;
  if (dflt) return [{ name: 'default', runner: dflt, maxFailures: 1 }];
  return [];
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdRun(positionals, ctx) {
  const role = positionals[0];
  if (!role) throw new Error('usage: whw run <role> [--ref REF] [--runner CMD] [--task TEXT] [--dry-run]');
  loadRole(ctx, role); // validates early
  if (ctx.flags['dry-run']) {
    const prompt = composePrompt(ctx, { role, ref: ctx.flags.ref, task: ctx.flags.task, attempt: 1, tier: 'dry-run' });
    if (ctx.json) ctx.log.data({ role, prompt });
    else process.stdout.write(`${prompt}\n`);
    return 0;
  }
  const tiers = resolveTiers(ctx, ctx.flags.runner);
  if (!tiers.length) {
    throw new Error('no runner configured (pass --runner CMD or set runners.default / escalation.tiers in whw.config.json)');
  }
  const maxAttempts = Number(ctx.flags['max-attempts'] ?? 0) || tiers.reduce((a, t) => a + (t.human ? 0 : t.maxFailures), 0) || 1;
  const runsDir = join(ctx.root, '.whw', 'runs');
  const stamp = utcStamp();
  /** @type {string[]} */
  const failures = [];
  let attempt = 0;
  let tierIdx = 0;
  let tierFailures = 0;

  while (attempt < maxAttempts) {
    const tier = tiers[Math.min(tierIdx, tiers.length - 1)];
    if (tier.human) {
      const msg = `escalated to human after ${attempt} attempt(s): ${failures.at(-1) ?? 'see .whw/runs'}`;
      if (ctx.json) ctx.log.data({ role, attempts: attempt, tier: tier.name, human: true, failures });
      else ctx.log.info(`HUMAN ${msg}`);
      return 3;
    }
    if (!tier.runner) throw new Error(`tier ${JSON.stringify(tier.name)} has no runner command`);
    attempt++;
    const prompt = composePrompt(ctx, { role, ref: ctx.flags.ref, task: ctx.flags.task, attempt, tier: tier.name, failures: failures.slice(-3) });
    const promptFile = join(runsDir, `${role}-${stamp}-attempt${attempt}.md`);
    writeText(promptFile, prompt);
    ctx.log.info(`run ${role}: attempt ${attempt} (tier ${tier.name}) → ${promptFile}`);
    const started = Date.now();
    const res = await runShell(tier.runner, {
      cwd: ctx.root,
      timeoutMs: 3600000,
      env: {
        ...process.env,
        WHW_PROMPT_FILE: promptFile,
        WHW_ROLE: role,
        WHW_REF: ctx.flags.ref ?? '',
        WHW_ROOT: ctx.root,
        WHW_ATTEMPT: String(attempt),
        WHW_TIER: tier.name,
      },
    });
    const durationMs = Date.now() - started;
    const tail = `${res.stdout}\n${res.stderr}`.trim().split('\n').slice(-5).join('\n');
    const meta = [
      `tier: ${tier.name}`,
      `model: ${tier.model ?? ''}`,
      `costClass: ${tier.costClass ?? ''}`,
      `durationMs: ${durationMs}`,
      `exit: ${res.code}`,
      `$ ${tier.runner}`,
      '',
      res.stdout,
      res.stderr,
    ].join('\n');
    writeText(join(runsDir, `${role}-${stamp}-attempt${attempt}.log`), meta);
    if (res.code === 0) {
      const payload = {
        role, attempts: attempt, tier: tier.name, status: 'complete',
        model: tier.model ?? null, costClass: tier.costClass ?? null, durationMs,
      };
      if (ctx.json) ctx.log.data(payload);
      else ctx.log.info(`run ${role}: complete on attempt ${attempt} (tier ${tier.name}${tier.costClass ? `, ${tier.costClass}` : ''})`);
      return 0;
    }
    const failure = `attempt ${attempt} (${tier.name}) exit ${res.code}: ${tail.split('\n').pop()}`;
    failures.push(failure);
    ctx.log.info(`run ${role}: ${failure}`);
    tierFailures++;
    if (tierFailures >= tier.maxFailures && tierIdx < tiers.length - 1) {
      tierIdx++;
      tierFailures = 0;
      ctx.log.info(`run ${role}: escalating to tier ${tiers[tierIdx].name}`);
      if (tiers[tierIdx].human) {
        const msg = `escalated to human after ${attempt} attempt(s): ${failures.at(-1) ?? 'see .whw/runs'}`;
        if (ctx.json) ctx.log.data({ role, attempts: attempt, tier: tiers[tierIdx].name, human: true, failures });
        else ctx.log.info(`HUMAN ${msg}`);
        return 3;
      }
    }
  }
  if (ctx.json) ctx.log.data({ role, attempts: attempt, status: 'exhausted', failures });
  else ctx.log.info(`run ${role}: attempts exhausted (${attempt}) — escalate to human. Failures:\n${failures.map((f) => `- ${f}`).join('\n')}`);
  return 3;
}
