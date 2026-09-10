// SPDX-License-Identifier: MIT
/** WHW CLI: argument parsing, dispatch, and core planning commands. */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { closeDb, openDb } from './db/sqlite.js';
import { createLogger } from './log.js';
import { getQueue, listTodos } from './planning/queue.js';
import { applySeedFile, listSeedFiles } from './planning/seed.js';
import { runHook } from './hooks.js';
import { appendNote, setStatus } from './planning/transitions.js';
import { renderStatus, statusData } from './report.js';
import { readJson } from './util.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const VALUE_FLAGS = new Set([
  'root', 'config', 'actor', 'evidence', 'reason', 'message', 'm', 'note',
  'track', 'status', 'limit', 'tier', 'phase', 'scores', 'report', 'out', 'o',
  'tools', 'project', 'waves', 'adr', 'from', 'to', 'runner', 'ref', 'task',
  'title', 'format', 'gate', 'name', 'max-attempts',
]);
const SHORT = { m: 'message', o: 'out', f: 'force', h: 'help' };

const TWO_WORD = new Set(['adapters', 'adr', 'program', 'wave', 'gate']);

/**
 * @param {string[]} argv
 * @returns {{ command: string|null, sub: string|null, positionals: string[], flags: Record<string, any> }}
 */
export function parseArgs(argv) {
  /** @type {Record<string, any>} */
  const flags = {};
  /** @type {string[]} */
  const words = [];
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok === '--') {
      words.push(...argv.slice(i + 1));
      break;
    }
    if (tok.startsWith('--')) {
      const eq = tok.indexOf('=');
      const key = eq === -1 ? tok.slice(2) : tok.slice(2, eq);
      if (eq !== -1) {
        flags[key] = tok.slice(eq + 1);
      } else if (VALUE_FLAGS.has(key)) {
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('-')) flags[key] = '';
        else {
          flags[key] = next;
          i++;
        }
      } else {
        flags[key] = true;
      }
    } else if (/^-[a-zA-Z]$/.test(tok)) {
      const key = SHORT[tok[1]] ?? tok[1];
      if (VALUE_FLAGS.has(key)) {
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('-')) flags[key] = '';
        else {
          flags[key] = next;
          i++;
        }
      } else {
        flags[key] = true;
      }
    } else {
      words.push(tok);
    }
  }
  let command = words[0] ?? null;
  let sub = null;
  let positionals = words.slice(1);
  if (command && TWO_WORD.has(command) && positionals.length) {
    sub = positionals[0];
    positionals = positionals.slice(1);
  }
  if (flags.help && command !== 'help') {
    positionals = command ? [command, ...(sub ? [sub] : [])] : [];
    command = 'help';
    sub = null;
  }
  return { command, sub, positionals, flags };
}

/** @returns {string} package version */
export function version() {
  try {
    return readJson(join(HERE, '..', 'package.json')).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

const HELP = `whw — Why · How · What: an agnostic harness for evidence-gated delivery

Usage: whw [--root DIR] [--config FILE] [--json] <command> [args] [flags]

Setup
  init [--tools a,b] [--project NAME] [--force]  scaffold WHW in a repo
  doctor                                           verify toolchain + config
  adapters sync [--tools a,b]                      regenerate tool pointer files

Charter (WHY → HOW)
  adr new <slug> [--title T]                       create ADR NNNN-<slug>.md
  program new <slug> --waves N                     charter ADR with wave map
  wave new <slug> --adr NNNN                       planning/wave-NNN-<slug>.{todos,done}.sql

Execute (HOW)
  sync [track|--all]                               apply planning seeds to .whw/state.db
  queue [--track T] [--status S] [--limit N]       actionable work (in_progress, then ready)
  claim <ref> [--actor A] [--force-wip]            pending|blocked → in_progress
  done <ref> --evidence E [--actor A]              in_progress → done (evidence required)
  block <ref> --reason R                           → blocked
  cancel <ref> [--reason R]                        → cancelled
  note <ref> -m MSG                                append to notes (no status change)
  status [--track T]                               Status / Evidence / Next step
  run <role> [--ref R] [--runner C] [--task T]     invoke a configured agent CLI

Verify (WHAT)
  gate list                                        list builtin + custom gates
  gate run [NAME|--tier pr|--all]                  run gates → GO/NO_GO + checkpoints
  evaluate --phase a|b [--scores JSON]             Phase A checks / Phase B rubric ingest
  close <wave>                                     canonical close (A–D done + addendum + done.sql)
  metrics [--out FILE]                             reproducible repo metrics

Continuity
  resume [--no-sync] [--track T]                   revalidate after interruption (no claim)
  handoff --from TOOL --to TOOL [--out FILE]       IDE/agent migration package

Global flags: --root DIR  --config FILE  --json  --help  --version
Run \`whw help <command>\` for details (e.g. \`whw help wave new\`).
Docs: docs/why (manifesto) · docs/how (process) · docs/what (reference).`;

const HELP_TOPICS = {
  init: 'whw init [--tools claude,cursor,codex,copilot,gemini,windsurf,opencode,aider] [--project NAME] [--force]\n\nScaffold WHW in a repo: whw.config.json, WHY.md, AGENTS.md + tool adapters,\nplanning/, docs/adr/, templates/, roles/, skills/, .github/ CI + PR template.\nIdempotent; --force overwrites WHW-managed files (never your code).',
  queue: 'whw queue [--track T] [--status S] [--limit N]\n\nShow actionable work: in_progress todos first, then pending todos whose\ndependencies are all done/cancelled. --status lists one status verbatim.',
  claim: 'whw claim <ref> [--actor A] [--force-wip]\n\nMark pending|blocked → in_progress. Refuses a second in_progress todo\nfor the same actor unless --force-wip (one claim at a time).',
  done: 'whw done <ref> --evidence "PR #12, tests green" [--actor NAME]\n\nMark in_progress → done. Evidence is REQUIRED (commit/PR/test proof).\n`done` is terminal: to revisit, charter a new wave — never a downgrade.',
  close: 'whw close <wave>\n\nCanonical close: asserts A–D done, ADR addendum present, sync gates green,\nthen applies the .done.sql and marks E. <wave> accepts 001, wave-001,\nor the full track wave-001-slug.',
  gate: 'whw gate run [NAME|--tier pr|--all]\n\nRun gates → GO/NO_GO with checkpoints at .whw/checkpoints/<gate>/latest.txt.\nTier `pr` is blocking and lean; `ops` runs on demand. Exit 1 on NO_GO.',
  evaluate: 'whw evaluate --phase a|b [--scores JSON] [--report FILE]\n\nPhase A runs configured deterministic checks (lint/tests/build) at zero AI\ncost → evaluation-report.json. Phase B ingests rubric scores (JSON) for the\nweighted criteria (threshold 3.5) → APPROVE/REJECT + top-3 fixes.',
  run: 'whw run <role> [--ref REF] [--runner CMD] [--task TEXT]\n\nCompose role prompt + AGENTS.md + queue context and invoke a configured\nagent CLI (claude, codex, cursor-agent, gemini, aider, opencode, custom).\nHonors the escalation ladder in whw.config.json; final tier is human.',
  resume: 'whw resume [--no-sync] [--track T]\n\nRevalidate after interruption: git baseline, `whw sync --all` (unless\n--no-sync), queue, and next step. Does not claim — SQL stays the source of\ntruth. Equivalent to the AGENTS.md resume protocol as one command.',
  handoff: 'whw handoff --from TOOL --to TOOL [--out FILE] [--task TEXT]\n\nWrite an IDE/agent migration package (git baseline, queue, gates, checklist).\nRaw transcripts stay local; the package carries paths only.',
};

/**
 * @param {{ command: string|null, sub: string|null, positionals: string[], flags: Record<string, any> }} parsed
 * @param {{ cwd?: string }} [opts]
 * @returns {Promise<number>} exit code
 */
export async function main(argv, opts = {}) {
  const parsed = typeof argv[0] === 'string' && Array.isArray(argv) ? parseArgs(argv) : argv;
  const { command, sub, positionals, flags } = parsed;
  const log = createLogger({ json: Boolean(flags.json) });

  if (flags.version || command === 'version') {
    process.stdout.write(`${version()}\n`);
    return 0;
  }
  if (!command || command === 'help') {
    const topic = positionals.join(' ');
    if (topic && HELP_TOPICS[topic.split(' ')[0]]) {
      process.stdout.write(`${HELP_TOPICS[topic.split(' ')[0]]}\n`);
    } else {
      process.stdout.write(`${HELP}\n`);
    }
    return 0;
  }

  const { root, configFile, config, paths } = loadConfig({
    cwd: opts.cwd ?? process.cwd(),
    root: flags.root,
    configFile: flags.config,
  });
  const ctx = { root, configFile, config, paths, flags, log, json: Boolean(flags.json) };

  switch (command) {
    case 'init':
      return (await import('./scaffold/init.js')).cmdInit(positionals, ctx);
    case 'doctor':
      return (await import('./doctor.js')).cmdDoctor(positionals, ctx);
    case 'adapters':
      if (sub !== 'sync') throw new Error('usage: whw adapters sync [--tools a,b]');
      return (await import('./adapters.js')).cmdAdaptersSync(positionals, ctx);
    case 'adr':
      if (sub !== 'new') throw new Error('usage: whw adr new <slug> [--title T]');
      return (await import('./scaffold/adr.js')).cmdAdrNew(positionals, ctx);
    case 'program':
      if (sub !== 'new') throw new Error('usage: whw program new <slug> --waves N');
      return (await import('./scaffold/program.js')).cmdProgramNew(positionals, ctx);
    case 'wave':
      if (sub !== 'new') throw new Error('usage: whw wave new <slug> --adr NNNN');
      return (await import('./scaffold/wave.js')).cmdWaveNew(positionals, ctx);
    case 'sync':
      return cmdSync(positionals, ctx);
    case 'queue':
      return cmdQueue(positionals, ctx);
    case 'claim':
      return cmdTransition(positionals, ctx, 'claim');
    case 'done':
      return cmdTransition(positionals, ctx, 'done');
    case 'block':
      return cmdTransition(positionals, ctx, 'block');
    case 'cancel':
      return cmdTransition(positionals, ctx, 'cancel');
    case 'note':
      return cmdNote(positionals, ctx);
    case 'status':
      return cmdStatus(positionals, ctx);
    case 'run':
      return (await import('./run.js')).cmdRun(positionals, ctx);
    case 'gate':
      if (sub === 'list') return (await import('./gates/runner.js')).cmdGateList(positionals, ctx);
      return (await import('./gates/runner.js')).cmdGateRun(positionals, ctx, sub);
    case 'evaluate':
      return (await import('./evaluate.js')).cmdEvaluate(positionals, ctx);
    case 'close':
      return (await import('./close.js')).cmdClose(positionals, ctx);
    case 'metrics':
      return (await import('./metrics.js')).cmdMetrics(positionals, ctx);
    case 'handoff':
      return (await import('./handoff.js')).cmdHandoff(positionals, ctx);
    case 'resume':
      return (await import('./resume.js')).cmdResume(positionals, ctx);
    default:
      throw new Error(`unknown command: ${command} (run \`whw help\`)`);
  }
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdSync(positionals, ctx) {
  const { paths, flags, log, json } = ctx;
  const track = flags.all ? undefined : (positionals[0] ?? flags.track ?? undefined);
  const files = listSeedFiles(paths.planning, { track });
  if (!files.length) {
    if (track) throw new Error(`no seed files match track ${JSON.stringify(track)} in ${paths.planning}`);
    throw new Error(`no planning/*.todos.sql seeds in ${paths.planning} (run \`whw wave new <slug> --adr NNNN\`)`);
  }
  const db = openDb(paths.state);
  try {
    const results = files.map((file) => applySeedFile(db, file));
    const total = db.prepare('SELECT COUNT(*) AS n FROM todos;').get()?.n ?? 0;
    if (json) log.data({ synced: results.map((r) => r.file), todos: total });
    else {
      for (const r of results) log.info(`synced ${r.file}`);
      log.info(`state: ${total} todos in ${paths.state}`);
    }
    return 0;
  } finally {
    closeDb(db);
  }
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdQueue(positionals, ctx) {
  const { paths, flags, log, json } = ctx;
  const limit = flags.limit ? Number(flags.limit) : undefined;
  const db = openDb(paths.state);
  try {
    if (flags.status) {
      const rows = listTodos(db, { status: flags.status, track: flags.track, limit });
      if (json) log.data({ status: flags.status, todos: rows });
      else if (!rows.length) log.info(`no ${flags.status} todos.`);
      else for (const t of rows) log.info(`[${t.status}] ${t.ref} — ${t.title} (${t.track})`);
      return 0;
    }
    const q = getQueue(db, { track: flags.track, limit });
    if (json) {
      log.data(q);
      return 0;
    }
    if (!q.inProgress.length && !q.ready.length) {
      log.info('queue is empty. Charter the next wave (`whw wave new <slug> --adr NNNN`).');
      return 0;
    }
    for (const t of q.inProgress) log.info(`[in_progress] ${t.ref} — ${t.title} (${t.track})`);
    for (const t of q.ready) log.info(`[ready] ${t.ref} — ${t.title} (${t.track})`);
    return 0;
  } finally {
    closeDb(db);
  }
}

/** @param {string[]} positionals @param {any} ctx @param {'claim'|'done'|'block'|'cancel'} kind */
export async function cmdTransition(positionals, ctx, kind) {
  const { paths, flags, log, json } = ctx;
  const ref = positionals[0] ?? flags.ref;
  if (!ref) throw new Error(`usage: whw ${kind} <ref>${kind === 'done' ? ' --evidence E' : kind === 'block' ? ' --reason R' : ''}`);
  const db = openDb(paths.state);
  /** @type {{ ref: string, from: string, to: string, changed?: boolean, actor?: string } | undefined} */
  let res;
  try {
    if (kind === 'claim') res = setStatus(db, ref, 'in_progress', { actor: flags.actor, forceWip: Boolean(flags['force-wip']) });
    else if (kind === 'done') {
      if (!flags.evidence) throw new Error(`whw done requires --evidence (e.g. --evidence "PR #12, tests green")`);
      res = setStatus(db, ref, 'done', { actor: flags.actor, evidence: flags.evidence });
    } else if (kind === 'block') {
      const reason = flags.reason ?? flags.evidence ?? flags.message;
      if (!reason) throw new Error('whw block requires --reason');
      res = setStatus(db, ref, 'blocked', { actor: flags.actor, evidence: reason });
    } else {
      res = setStatus(db, ref, 'cancelled', { actor: flags.actor, evidence: flags.reason ?? flags.evidence });
    }
    if (json) log.data(res);
    else log.info(`${res.ref}: ${res.from} → ${res.to}`);
  } finally {
    closeDb(db);
  }
  if (res?.changed && (kind === 'claim' || kind === 'done')) {
    await runHook(ctx, kind === 'claim' ? 'on_claim' : 'on_done', {
      WHW_REF: String(res.ref),
      WHW_FROM: String(res.from),
      WHW_TO: String(res.to),
      WHW_ACTOR: String(res.actor ?? ''),
    });
  }
  return 0;
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdNote(positionals, ctx) {
  const { paths, flags, log, json } = ctx;
  const ref = positionals[0] ?? flags.ref;
  const message = flags.message ?? flags.note ?? positionals.slice(1).join(' ');
  if (!ref || !message) throw new Error('usage: whw note <ref> -m MSG');
  const db = openDb(paths.state);
  try {
    const res = appendNote(db, ref, message);
    if (json) log.data(res);
    else log.info(`${ref}: note appended`);
    return 0;
  } finally {
    closeDb(db);
  }
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdStatus(positionals, ctx) {
  const { paths, flags, log, json } = ctx;
  const track = positionals[0] ?? flags.track;
  const db = openDb(paths.state);
  try {
    if (json) {
      log.data(statusData(db, { track }));
      return 0;
    }
    process.stdout.write(renderStatus(db, { track }));
    return 0;
  } finally {
    closeDb(db);
  }
}
