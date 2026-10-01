#!/bin/sh
# SPDX-License-Identifier: MIT
# Disposable published-package adoption replay; retains files for inspection.
set -eu
probe=$(mktemp -d "${TMPDIR:-/tmp}/whw018-replay.XXXXXX")
printf '%s\n' "$probe"
cd "$probe"
git init -q
cli() { npx --yes @fabioeloi/whw@0.2.0 "$@"; }
cli init --tools claude,cursor,codex,copilot,gemini
cli doctor
cli program new adoption --waves 1
cli wave new first-change --adr 0001
node --input-type=module <<'JS'
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
if (existsSync('bin/whw.js') || existsSync('src')) throw Error('init copied CLI');
const p='docs/adr/0001-program-adoption.md';
let s=readFileSync(p,'utf8').replace('| 001 | <slug> | 0001 |','| 001 | first-change | 0001 |');
s=s.replace('Why this program exists. What outcome closes it. What the previous program (if\nany) left behind.','Disposable documentation acceptance fixture: verify the published CLI adoption path.');
writeFileSync(p,s);
writeFileSync('WHY.md','# WHY\n\nVerify the published WHW adoption contract in a disposable fixture.\n');
writeFileSync('docs/plan.md','# Plan\n\n## Wave 001 — first-change\n\nA planning; B implementation; C verification; D decision; E close.\n');
JS
cli sync --all
cli queue
cli claim wave001-A
cli gate run --tier pr
cli done wave001-A --evidence 'planning/wave-001-first-change.todos.sql; docs/adr/0001-program-adoption.md; npx @fabioeloi/whw@0.2.0 gate run --tier pr'
cli status
cli gate run --tier ops
cli resume
cli handoff --from codex --to claude
cli queue
