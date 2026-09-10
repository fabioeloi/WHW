// SPDX-License-Identifier: MIT
/**
 * `whw handoff` — IDE/agent migration package: git baseline, queue snapshot,
 * gate results, chat-path map, and a continuity checklist. Raw transcripts
 * stay local (paths only, never content).
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { closeDb, openDb } from './db/sqlite.js';
import { getQueue } from './planning/queue.js';
import { recentTransitions } from './planning/transitions.js';
import { loadTemplate, render } from './scaffold/files.js';
import { fileExists, git, isDir, isGitRepo, localDate, readText } from './util.js';

const CHAT_PATHS = [
  '| Claude Code | `~/.claude/projects/**/*.jsonl` | local-observed |',
  '| Codex CLI | `~/.codex/sessions/YYYY/MM/DD/*.jsonl` | local-observed |',
  '| Cursor | `~/Library/Application Support/Cursor/User/workspaceStorage/*` (macOS; varies) | probable |',
  '| Gemini CLI | `~/.gemini/tmp/<project_hash>/` (`/chat save` checkpoints) | official |',
  '| Copilot CLI | `~/.copilot/session-state/*/events.jsonl` | official |',
  '| VS Code | `~/Library/Application Support/Code/User/workspaceStorage/*/chatSessions/*` (macOS) | local-observed |',
  '| Windsurf | under `~/.codeium/` when present; else in-app export | needs-runtime-detection |',
  '| Aider / OpenCode | no persistent chat store; rely on git + queue + this handoff | n/a |',
];

const FALLBACK_HANDOFF = `# Handoff — {{FROM}} → {{TO}} ({{DATE}})

## Objective

{{OBJECTIVE}}

## Git baseline

- branch: {{BRANCH}}
- HEAD: {{HEAD}}
- status: {{STATUS_CLEAN}}
- log:
{{LOG}}

Verify in the target tool before continuing:

\`\`\`bash
git status --short --branch
git log --oneline -n 10
\`\`\`

## Queue snapshot

{{QUEUE}}

## Gate results

{{GATES}}

## Recent transitions

{{TRANSITIONS}}

## Chat-path map (local only — pointers, never transcripts)

| Tool | Session path | Confidence |
| ---- | ------------ | ---------- |
{{CHAT_PATHS}}

## Continuity checklist

1. Baseline matches (branch @ SHA, clean/dirty as above).
2. \`whw resume\` (or \`whw sync --all\` then \`whw queue\`) — SQL is the source of truth.
3. \`whw gate run --tier pr\` green before new work.
4. Resume the top queue item; report Status / Evidence / Next step.
`;

/**
 * @param {string[]} positionals @param {any} ctx @returns {Promise<number>}
 */
export async function cmdHandoff(positionals, ctx) {
  const from = ctx.flags.from;
  const to = ctx.flags.to;
  if (!from || !to) throw new Error('usage: whw handoff --from TOOL --to TOOL [--out FILE]');
  const date = localDate();
  const stamp = date.replace(/-/g, '');

  let branch = '(not a git repo)';
  let head = '(n/a)';
  let status = '(n/a)';
  let log = '(n/a)';
  if (await isGitRepo(ctx.root)) {
    branch = (await git(['branch', '--show-current'], ctx.root)) || '(detached)';
    head = (await git(['rev-parse', '--short', 'HEAD'], ctx.root)) || '(no commits)';
    const st = await git(['status', '--short', '--branch'], ctx.root);
    status = st ? `dirty:\n${st.split('\n').map((l) => '  ' + l).join('\n')}` : 'clean';
    log = (await git(['log', '--oneline', '-n', '10'], ctx.root)).split('\n').map((l) => `  ${l}`).join('\n') || '  (no commits)';
  }

  let queue = '(state.db unavailable)';
  let transitions = '(state.db unavailable)';
  try {
    const db = openDb(ctx.paths.state);
    try {
      const q = getQueue(db, { limit: 8 });
      const lines = [
        ...q.inProgress.map((t) => `- [in_progress] ${t.ref} — ${t.title}`),
        ...q.ready.map((t) => `- [ready] ${t.ref} — ${t.title}`),
      ];
      queue = lines.length ? lines.join('\n') : '(queue empty)';
      const trs = recentTransitions(db, { limit: 8 });
      transitions = trs.length
        ? trs.map((t) => `- ${t.ref} ${t.from_status} → ${t.to_status} (${t.actor ?? '?'}, ${t.at})${t.evidence ? `: ${t.evidence}` : ''}`).join('\n')
        : '(no transitions yet)';
    } finally {
      closeDb(db);
    }
  } catch {
    /* keep placeholders */
  }

  let gates = '(no checkpoints yet — run `whw gate run --tier pr`)';
  if (isDir(ctx.paths.checkpoints)) {
    const rows = [];
    for (const gate of readdirSync(ctx.paths.checkpoints)) {
      const latest = join(ctx.paths.checkpoints, gate, 'latest.txt');
      if (!fileExists(latest)) continue;
      const last = readText(latest).trim().split('\n').pop();
      rows.push(`- ${gate}: ${last}`);
    }
    if (rows.length) gates = rows.join('\n');
  }

  const vars = {
    FROM: from, TO: to, DATE: date, OBJECTIVE: ctx.flags.task ?? '(fill in: goal, last milestone, open risks, next action)',
    BRANCH: branch, HEAD: head, STATUS_CLEAN: status, LOG: log,
    QUEUE: queue, GATES: gates, TRANSITIONS: transitions, CHAT_PATHS: CHAT_PATHS.join('\n'),
  };
  const { text } = loadTemplate(ctx, 'handoff.md', FALLBACK_HANDOFF);
  const out = ctx.flags.out ?? positionals[0] ?? join('docs', 'handoff', `handoff-${stamp}-${from}-to-${to}.md`);
  const { writeText } = await import('./util.js');
  writeText(join(ctx.root, out), render(text, vars));
  if (ctx.json) {
    ctx.log.data({ from, to, out, branch, head });
    return 0;
  }
  ctx.log.info(`handoff → ${out} (${from} → ${to}, ${branch} @ ${head})`);
  return 0;
}
