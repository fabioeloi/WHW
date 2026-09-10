# Plan — WHW

Narrative session state. The SQL queue (`whw queue`) is authoritative for
execution; this file carries intent, decisions, and wave history.

## North star

WHW (Why · How · What) becomes the durable, agnostic way to run autonomous
software delivery: process with state that survives model and tool churn.
v0.1.0 proves the loop on itself — built in waves, gated, and released MIT.
See `WHY.md`.

## Decisions

- WHY/HOW/WHAT traceability as the load-bearing rule ([0001](adr/0001-name-scope.md)).
- SQLite default via `node:sqlite`, PostgreSQL as optional adapter ([0002](adr/0002-sqlite-default.md)).
- Node.js ≥ 22.13, zero runtime dependencies ([0003](adr/0003-node-zero-deps.md)).
- `AGENTS.md` canonical with thin per-tool adapters ([0004](adr/0004-agents-canonical.md)).
- A–E wave contract with program charters and inventory-gated close ([0005](adr/0005-wave-contract.md)).
- Lean blocking `pr` tier, on-demand `ops` tier ([0006](adr/0006-gate-tiers.md)).
- MIT with lineage hygiene (no proprietary carryover) ([0007](adr/0007-licensing-attribution.md)).

## Programs

- Program 001 — WHW v0.1.0 (`docs/adr/0008-program-001.md`): waves 001–006 — **closed**.
- Program 002 — Hardening & Publication (`docs/adr/0009-program-002.md`): waves 007–011.

## Wave log

<!-- One `## Wave NNN — <slug>` section per wave (5W2H rows A–E + evidence). -->

## Wave 001 — repo-scaffold — **done**

Hygiene + identity: license, READMEs, community docs, package manifest,
config, `main` branch. ADR: `docs/adr/0001-name-scope.md`.

| #   | What | How | Why | Where | When | Who | How much |
| --- | ---- | --- | --- | ----- | ---- | --- | -------- |
| A | Scaffold plan + branch | hygiene file list, `master`→`main` | adoptable OSS root | repo root | 001 | solo | (Wave 001 A) |
| B | Hygiene files | LICENSE, READMEs, docs, manifest, config | MIT + docs contract | repo root | 001 | solo | (Wave 001 B) |
| C | Verify | structure review, JSON validity | root must parse | repo root | 001 | solo | (Wave 001 C) |
| D | Decide | ADR 0001 addendum | record scope decision | `docs/adr/0001` | 001 | solo | (Wave 001 D) |
| E | Close | `whw close` + sync gates | canonical close | planning/ | 001 | solo | (Wave 001 E) |

Sync: `whw sync wave-001-repo-scaffold` · Close: `whw close wave-001-repo-scaffold`

## Wave 002 — sql-cli-core — **done**

State + CLI spine: both schemas, dispatcher, config, logging, SQLite adapter,
seed/queue/transitions/report. ADR: `docs/adr/0005-wave-contract.md`.

| #   | What | How | Why | Where | When | Who | How much |
| --- | ---- | --- | --- | ----- | ---- | --- | -------- |
| A | Schema + CLI design | tables/view, command surface | execution needs queryable state | `sql/`, `src/` | 002 | solo | (Wave 002 A) |
| B | Implement core | schemas, cli/config/log/db/planning/report | zero-dep spine | `sql/`, `src/`, `bin/` | 002 | solo | (Wave 002 B) |
| C | Verify | smoke sync→queue→claim→done→status | loop must hold | temp project | 002 | solo | (Wave 002 C) |
| D | Decide | ADR 0005 addendum | record contract decision | `docs/adr/0005` | 002 | solo | (Wave 002 D) |
| E | Close | `whw close` + sync gates | canonical close | planning/ | 002 | solo | (Wave 002 E) |

Sync: `whw sync wave-002-sql-cli-core` · Close: `whw close wave-002-sql-cli-core`

## Wave 003 — scaffolds-gates — **done**

Charter tooling + enforcement: init/adr/program/wave/adapters, gate runner,
7 built-ins, custom gates, checkpoints. ADR: `docs/adr/0006-gate-tiers.md`.

| #   | What | How | Why | Where | When | Who | How much |
| --- | ---- | --- | --- | ----- | ---- | --- | -------- |
| A | Scaffold + gate design | template resolution, tier policy | charter + enforce cheaply | `src/scaffold`, `src/gates` | 003 | solo | (Wave 003 A) |
| B | Implement | scaffolds, runner, built-ins, checkpoints | working charter→gate path | `src/`, `templates/`(fb) | 003 | solo | (Wave 003 B) |
| C | Verify | fresh-scaffold gates all GO, warning fix | green from zero | temp project | 003 | solo | (Wave 003 C) |
| D | Decide | ADR 0006 addendum | record tier decision | `docs/adr/0006` | 003 | solo | (Wave 003 D) |
| E | Close | `whw close` + sync gates | canonical close | planning/ | 003 | solo | (Wave 003 E) |

Sync: `whw sync wave-003-scaffolds-gates` · Close: `whw close wave-003-scaffolds-gates`

## Wave 004 — close-evaluate-run — **done**

Lifecycle completion: `close`, `metrics`, `handoff`, `doctor`, two-phase
`evaluate`, optional `run` with escalation. ADR: `docs/adr/0004-agents-canonical.md`.

| #   | What | How | Why | Where | When | Who | How much |
| --- | ---- | --- | --- | ----- | ---- | --- | -------- |
| A | Lifecycle design | close asserts, rubric, runner contract | finish + judge + migrate | `src/` | 004 | solo | (Wave 004 A) |
| B | Implement | close/metrics/handoff/doctor/evaluate/run | complete CLI surface | `src/` | 004 | solo | (Wave 004 B) |
| C | Verify | full A→E close, APPROVE/REJECT, dry-run | lifecycle must hold | temp project | 004 | solo | (Wave 004 C) |
| D | Decide | ADR 0004 addendum | record adapter decision | `docs/adr/0004` | 004 | solo | (Wave 004 D) |
| E | Close | `whw close` + sync gates | canonical close | planning/ | 004 | solo | (Wave 004 E) |

Sync: `whw sync wave-004-close-evaluate-run` · Close: `whw close wave-004-close-evaluate-run`

## Wave 005 — roles-skills-templates-docs — **done**

Agent surface + knowledge: 5 roles, 6 skills, 18 templates, full docs,
`hello-wave` example, 34 tests. ADR: `docs/adr/0008-program-001.md`.

| #   | What | How | Why | Where | When | Who | How much |
| --- | ---- | --- | --- | ----- | ---- | --- | -------- |
| A | Content plan | role matrix, skill spec, doc map | agents need contracts | `roles/`, `skills/`, `docs/` | 005 | solo | (Wave 005 A) |
| B | Write all content | roles, skills, templates, docs, example, tests | shippable surface | repo-wide | 005 | solo | (Wave 005 B) |
| C | Verify | `npm test` 34/34, example walkthrough green | proof before close | repo + `/tmp` copy | 005 | solo | (Wave 005 C) |
| D | Decide | ADR 0008 addendum (wave 005) | record delivery | `docs/adr/0008` | 005 | solo | (Wave 005 D) |
| E | Close | `whw close` + sync gates | canonical close | planning/ | 005 | solo | (Wave 005 E) |

Sync: `whw sync wave-005-roles-skills-templates-docs` · Close: `whw close wave-005-roles-skills-templates-docs`

## Wave 006 — program-close — **done**

Program 001 close: dogfood (WHY/AGENTS/adapters/seeds), CI, inventory gate,
metrics, retrospective. ADR: `docs/adr/0008-program-001.md`.

| #   | What | How | Why | Where | When | Who | How much |
| --- | ---- | --- | --- | ----- | ---- | --- | -------- |
| A | Close plan | dogfood checklist, charter criteria | close deliberately | repo root | 006 | solo | (Wave 006 A) |
| B | Inventory work | WHY/AGENTS/adapters, CI, scans | self-hosted proof | repo-wide | 006 | solo | (Wave 006 B) |
| C | Verify | gates GO, inventory GO, metrics snap | evidence of done | `.whw/` | 006 | solo | (Wave 006 C) |
| D | Decide | ADR 0008 retrospective addendum | record outcome | `docs/adr/0008` | 006 | solo | (Wave 006 D) |
| E | Close | `whw close` + sync gates | canonical close | planning/ | 006 | solo | (Wave 006 E) |

Sync: `whw sync wave-006-program-close` · Close: `whw close wave-006-program-close`

## Wave 007 — publish-release — **done**

Release plumbing is in git (PRs #1 merged, #3 open). ADR 0010 Accepted. npm
tag still waits on `NPM_TOKEN`. ADR: `docs/adr/0010-release-policy.md`.

| #   | What | How | Why | Where | When | Who | How much |
| --- | ---- | --- | --- | ----- | ---- | --- | -------- |
| A | Charter + seeds | ADR 0009–0012, `whw wave new` × 5, plan stubs | no wave without an ADR | `docs/adr/`, `planning/` | 007 | solo | [#1](https://github.com/fabioeloi/WHW/pull/1) |
| B | Release plumbing | `release.yml`, topics, protection, README/`pt-BR`, CHANGELOG | `npx` must resolve | `.github/`, README | 007 | solo | [#3](https://github.com/fabioeloi/WHW/pull/3) |
| C | Verify | Ubuntu matrix + `ci` aggregator | stranger-followable | Actions | 007 | solo | [run 34518046761](https://github.com/fabioeloi/WHW/actions/runs/34518046761) |
| D | Decide | ADR 0010 addendum | record publish decision | `docs/adr/0010` | 007 | solo | (Wave 007 D) |
| E | Close | `whw close` + sync gates | canonical close | planning/ | 007 | solo | `whw close 007` |

Sync: `whw sync wave-007-publish-release` · Close: `whw close wave-007-publish-release`

## Wave 008 — state-hygiene — **done**

Checkpoint gitignore (`latest.txt` only), `evidence-quality` ops gate, WIP
claim guard (`--force-wip`), unsynced-DB precondition, doctor tests, docs
drift from the review, sync preserves live statuses. ADR:
`docs/adr/0011-derived-state.md` Accepted.

| #   | What | How | Why | Where | When | Who | How much |
| --- | ---- | --- | --- | ----- | ---- | --- | -------- |
| A | Planning seed | `whw wave new` + refined notes | charter first | `planning/wave-008-state-hygiene.todos.sql` | 008 | solo | [#8](https://github.com/fabioeloi/WHW/pull/8) |
| B | Implementation | gitignore + gates + claim guard | stop dirty trees and vacuous GO | `src/`, `.gitignore` | 008 | solo | [#9](https://github.com/fabioeloi/WHW/pull/9) |
| C | Verification | tests + `pr` gates | proof | `tests/` | 008 | solo | [#10](https://github.com/fabioeloi/WHW/pull/10) |
| D | Decision record | ADR 0011 addendum | record policy | `docs/adr/0011` | 008 | solo | [#11](https://github.com/fabioeloi/WHW/pull/11) |
| E | Canonical close | `whw close` + sync | close | planning/ | 008 | solo | `whw close 008` |

Sync: `whw sync wave-008-state-hygiene` · Close: `whw close wave-008-state-hygiene`

## Wave 009 — runner-proof — **in progress**

Exercise `whw run` with stub open-weight and closed CLIs; unit-test
`composePrompt` / escalation; optional `model` / `costClass` on tiers;
open-model examples in escalation docs. ADR: `docs/adr/0009-program-002.md`.

| #   | What | How | Why | Where | When | Who | How much |
| --- | ---- | --- | --- | ----- | ---- | --- | -------- |
| A | Planning seed | `whw wave new` + refined notes | charter first | `planning/wave-009-runner-proof.todos.sql` | 009 | solo | (Wave 009 A) |
| B | Implementation | real `whw run` + tests | "any model" must be proven | `src/run.js`, `tests/`, `.whw/runs/` | 009 | solo | (Wave 009 B) |
| C | Verification | tests + `pr` gates | proof | `tests/` | 009 | solo | (Wave 009 C) |
| D | Decision record | ADR 0009 addendum | record runner evidence | `docs/adr/0009` | 009 | solo | (Wave 009 D) |
| E | Canonical close | `whw close` + sync | close | planning/ | 009 | solo | (Wave 009 E) |

Sync: `whw sync wave-009-runner-proof` · Close: `whw close wave-009-runner-proof`

## Wave 010 — continuity-proof — **planned**

`whw resume`, a real `docs/handoff/` between two tools, and config `hooks`
(`on_claim`, `on_done`, `on_gate_fail`, `on_close`). ADR:
`docs/adr/0009-program-002.md`.

| #   | What | How | Why | Where | When | Who | How much |
| --- | ---- | --- | --- | ----- | ---- | --- | -------- |
| A | Planning seed | `whw wave new` | charter first | `planning/wave-010-continuity-proof.todos.sql` | 010 | solo | (Wave 010 A) |
| B | Implementation | `resume` + hooks + live handoff | survive interruption for real | `src/`, `docs/handoff/` | 010 | solo | (Wave 010 B) |
| C | Verification | tests + `pr` gates | proof | `tests/` | 010 | solo | (Wave 010 C) |
| D | Decision record | ADR 0009 addendum | record continuity | `docs/adr/0009` | 010 | solo | (Wave 010 D) |
| E | Canonical close | `whw close` + sync | close | planning/ | 010 | solo | (Wave 010 E) |

Sync: `whw sync wave-010-continuity-proof` · Close: `whw close wave-010-continuity-proof`

## Wave 011 — program-close — **planned**

`release-readiness` gate (the one README already advertises), ADR 0012
Accepted, inventory GO, metrics, retrospective. ADR:
`docs/adr/0012-maintenance-policy.md`.

| #   | What | How | Why | Where | When | Who | How much |
| --- | ---- | --- | --- | ----- | ---- | --- | -------- |
| A | Planning seed | `whw wave new` | charter first | `planning/wave-011-program-close.todos.sql` | 011 | solo | (Wave 011 A) |
| B | Inventory work | release-readiness gate + policy | close deliberately | `src/gates/`, `docs/adr/0012` | 011 | solo | (Wave 011 B) |
| C | Verify | inventory GO, metrics snap | evidence of done | `.whw/` | 011 | solo | (Wave 011 C) |
| D | Decide | ADR 0009 + 0012 retrospective | record outcome | `docs/adr/0009`, `0012` | 011 | solo | (Wave 011 D) |
| E | Close | `whw close` + sync gates | canonical close | planning/ | 011 | solo | (Wave 011 E) |

Sync: `whw sync wave-011-program-close` · Close: `whw close wave-011-program-close`

## Next

Wave 009 is **in progress**. Finish A–E (runner-proof) before 010. Do not tag
`v0.1.1` until npm credentials are confirmed.
