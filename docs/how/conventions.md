# Conventions

Branches, commits, tables, and naming — the small consistencies that let
strangers (and models) navigate any WHW repo on day one.

## Branches and commits

- Branches: `<type>/wave-NNN-<slug>-<letter>` — e.g. `feat/wave-003-checkout-b`,
  `docs/wave-003-checkout-e`. Types: `feat`, `fix`, `docs`, `chore`, `test`,
  `refactor`, `ci`.
- Commits: `<type>(<scope>): <summary> (Wave NNN L)` — e.g.
  `feat(gates): add no-secrets gate (Wave 002 C)`. Maint exceptions
  (ADR 0012): `chore(maint): …` (linked `maint` issue) and Dependabot
  `chore(deps): …` (PR label `maint`, one dependency). `maint-audit`
  (`ops`) lists other non-trailer commits since the last program close.
- One wave letter per PR. Large PRs are asked to split into waves.
- Every merge to `main` via PR with the Validation Evidence checklist
  (`.github/pull_request_template.md`).

## Naming

| Thing | Pattern | Example |
| ----- | ------- | ------- |
| Wave track | `wave-NNN-<slug>` | `wave-003-guest-checkout` |
| Todo ref | `waveNNN-<L>` | `wave003-B` |
| Seed files | `planning/<track>.todos.sql` + `.<…>.done.sql` | `planning/wave-003-guest-checkout.todos.sql` |
| ADR | `docs/adr/NNNN-<slug>.md` | `docs/adr/0009-checkout-contract.md` |
| Program charter | `docs/adr/NNNN-program-<slug>.md` | `docs/adr/0008-program-001.md` |
| Plan entry | `## Wave NNN — <slug>` | in `docs/plan.md` |
| Checkpoint | `.whw/checkpoints/<gate>/latest.txt` | `…/planning-coverage/latest.txt` |

Slugs: lowercase kebab, ≤ 60 chars. Numbers: waves 3+ digits, ADRs 4 digits,
never reused.

## 5W2H plan rows

Each `docs/plan.md` wave entry carries a 5W2H table (rows A–E), copied from
`templates/plan-wave-5w2h.md`:

| # | What | How | Why | Where | When | Who | How much |
|---|------|-----|-----|-------|------|-----|----------|
| A | … | … | … | … | NNN | … | [#…](…) |

The "How much" column records PR links per letter — the cheapest traceability
there is.

## Status vocabulary

Statuses: `pending`, `in_progress`, `done`, `blocked`, `cancelled`.
Gate verdicts: `GO`, `NO_GO`. Evaluation verdicts: `APPROVE`, `REJECT`.
Reports: Status / Evidence / Next step (or Blocked). Use these words
literally — gates and scripts parse them.
