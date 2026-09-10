// SPDX-License-Identifier: MIT
/** `whw init` — scaffold WHW into a repository (idempotent). */

import { basename, join } from 'node:path';
import { defaultConfig } from '../config.js';
import { parseTools, syncAdapters } from '../adapters.js';
import { fileExists, localDate, readText, writeText } from '../util.js';
import { copyTree, loadTemplate, packageRoot, render, writeManaged } from './files.js';

const FALLBACK_WHY = `# WHY — {{PROJECT}}

## Purpose

Why this project exists. Who it serves, and what changes for them.

## Non-goals

What we explicitly will NOT do (until a new ADR says otherwise).

## Principles

- Purpose first: no wave without an ADR, no ADR without a WHY.
- Evidence over chat: claims ship with gates, commits, and PRs.
- Small waves: five letters, five PRs, always shippable.
`;

const FALLBACK_AGENTS = `# AGENTS.md — {{PROJECT}}

Canonical agent instructions. Tool-specific pointer files defer to this document.

## The loop

1. \`whw sync --all\` then \`whw queue\` — SQL is the source of truth, never chat memory.
2. \`whw claim <ref>\` — one claim at a time.
3. Implement on \`feat/wave-NNN-<slug>-<letter>\`; commit \`type(scope): summary (Wave NNN L)\`.
4. \`whw done <ref> --evidence "<commit/PR/tests>"\` — evidence is required.
5. \`whw gate run --tier pr\` must be GO before merge.
6. End every milestone with Status / Evidence / Next step (\`whw status\`).

## Rules

- Do not start the next wave until \`main\` is green.
- Do not commit secrets, tokens, or personal data.
- Do not downgrade \`done\`; to revisit, charter a new wave.

Full process: docs/why (manifesto) · docs/how (process) · docs/what (reference).
`;

const FALLBACK_PLAN = `# Plan — {{PROJECT}}

Narrative session state. The SQL queue (\`whw queue\`) is authoritative for
execution; this file carries intent, decisions, and wave history.

## North star

Where this project is headed, in one paragraph.

## Decisions

Superseding decisions with ADR links (newest last).

## Wave log

One \`## Wave NNN — <slug>\` section per wave with a 5W2H table (rows A–E)
and PR links. See templates/plan-wave-5w2h.md.
`;

const FALLBACK_README = `# {{PROJECT}}

> Delivered with WHW (Why · How · What) — an agnostic harness for
> evidence-gated delivery. Start at [WHY.md](WHY.md).

## Status

Wave log and decisions: [docs/plan.md](docs/plan.md) · [docs/adr](docs/adr) ·
\`whw queue\` (authoritative execution state).
`;

const FALLBACK_PR_TEMPLATE = `## Summary

- What changed and why (link ADR / wave).

## Validation Evidence

- [ ] \`whw gate run --tier pr\` GO
- [ ] Tests green (\`whw evaluate --phase a\` or project suite)
- [ ] Wave letter scope respected (one letter per PR)

## Risk Review

- [ ] No secrets or personal data committed
- [ ] Docs updated when behavior changed

## Wave

- Wave / letter:
- ADR:
`;

const FALLBACK_CI = `name: whw

on:
  pull_request: {}
  push:
    branches: [main]

jobs:
  whw:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
      - name: Sync planning
        run: npx -y @fabioeloi/whw@latest sync --all
      - name: Doctor
        run: npx -y @fabioeloi/whw@latest doctor
      - name: PR gates
        run: npx -y @fabioeloi/whw@latest gate run --tier pr
`;

const GITIGNORE_BLOCK = `# WHW derived state (rebuild with \`whw sync --all\`; seeds in planning/ are canonical)
.whw/state.db
.whw/state.db-journal
.whw/state.db-wal
.whw/state.db-shm
.whw/*.log
.whw/checkpoints/**/*.txt
!.whw/checkpoints/**/latest.txt
.whw/runs/
`;

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdInit(positionals, ctx) {
  const force = Boolean(ctx.flags.force);
  const project = ctx.flags.project ?? basename(ctx.root);
  const tools = parseTools(ctx.flags.tools ?? '');
  const vars = { PROJECT: project, DATE: localDate() };
  /** @type {Record<string, string[]>} */
  const summary = { created: [], kept: [], overwritten: [] };
  const track = (file, st) => summary[st].push(file);

  // 1. Config
  const configFile = join(ctx.root, 'whw.config.json');
  if (!fileExists(configFile) || force) {
    const cfg = defaultConfig();
    cfg.project = project;
    const existed = fileExists(configFile);
    writeText(configFile, `${JSON.stringify(cfg, null, 2)}\n`);
    track('whw.config.json', existed ? 'overwritten' : 'created');
  } else {
    track('whw.config.json', 'kept');
  }

  // 2. WHY / AGENTS / plan
  for (const [file, template, fallback] of [
    ['WHY.md', 'WHY.md', FALLBACK_WHY],
    ['AGENTS.md', 'AGENTS.md', FALLBACK_AGENTS],
    ['docs/plan.md', 'plan.md', FALLBACK_PLAN],
  ]) {
    const { text } = loadTemplate(ctx, template, fallback);
    track(file, writeManaged(join(ctx.root, file), render(text, vars), force));
  }
  for (const keep of ['docs/adr/.gitkeep', 'planning/.gitkeep']) {
    track(keep, writeManaged(join(ctx.root, keep), '', force));
  }
  // README stub only when missing (never overwrite, even with --force).
  if (!fileExists(join(ctx.root, 'README.md'))) {
    const { text } = loadTemplate(ctx, 'README.md', FALLBACK_README);
    track('README.md', writeManaged(join(ctx.root, 'README.md'), render(text, vars), false));
  } else {
    track('README.md', 'kept');
  }

  // 3. Copy roles / skills / templates from the package (self-contained repo)
  const pkg = packageRoot();
  const isSelf = pkg === ctx.root;
  if (!isSelf) {
    for (const dir of ['roles', 'skills', 'templates']) {
      const res = copyTree(join(pkg, dir), join(ctx.root, dir), force);
      for (const f of res.created) summary.created.push(`${dir}/${f}`);
      for (const f of res.kept) summary.kept.push(`${dir}/${f}`);
      for (const f of res.overwritten) summary.overwritten.push(`${dir}/${f}`);
    }
    if (ctx.flags.full) {
      const res = copyTree(join(pkg, 'docs'), join(ctx.root, 'docs'), force);
      for (const f of res.created) summary.created.push(`docs/${f}`);
      for (const f of res.kept) summary.kept.push(`docs/${f}`);
      for (const f of res.overwritten) summary.overwritten.push(`docs/${f}`);
    }
  }

  // 4. GitHub: PR template + CI
  const prTpl = loadTemplate(ctx, 'pull_request_template.md', FALLBACK_PR_TEMPLATE);
  track('.github/pull_request_template.md', writeManaged(join(ctx.root, '.github', 'pull_request_template.md'), render(prTpl.text, vars), force));
  const ciTpl = loadTemplate(ctx, 'ci-whw.yml', FALLBACK_CI);
  track('.github/workflows/whw.yml', writeManaged(join(ctx.root, '.github', 'workflows', 'whw.yml'), render(ciTpl.text, vars), force));

  // 5. .gitignore block
  const giFile = join(ctx.root, '.gitignore');
  if (!fileExists(giFile)) {
    writeText(giFile, GITIGNORE_BLOCK);
    track('.gitignore', 'created');
  } else if (!readText(giFile).includes('.whw/state.db')) {
    writeText(giFile, `${readText(giFile).replace(/\n*$/, '\n')}\n${GITIGNORE_BLOCK}`);
    track('.gitignore', 'overwritten');
  } else {
    track('.gitignore', 'kept');
  }

  // 6. Adapters
  const adapters = syncAdapters(ctx, tools, force);
  for (const f of adapters.created) summary.created.push(f);
  for (const f of adapters.kept) summary.kept.push(f);
  for (const f of adapters.overwritten) summary.overwritten.push(f);

  if (ctx.json) {
    ctx.log.data({ project, tools, ...summary, native: adapters.native });
    return 0;
  }
  for (const f of summary.created) ctx.log.info(`created ${f}`);
  for (const f of summary.overwritten) ctx.log.info(`updated ${f}`);
  if (summary.kept.length) ctx.log.info(`kept ${summary.kept.length} existing file(s) (use --force to overwrite)`);
  for (const t of adapters.native) ctx.log.info(`native ${t}: no pointer file needed`);
  ctx.log.info(`next: whw adr new <slug>  →  whw wave new <slug> --adr NNNN  →  whw sync --all`);
  return 0;
}
