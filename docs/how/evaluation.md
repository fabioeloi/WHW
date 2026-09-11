# Evaluation

Two phases, in order: deterministic checks at zero AI cost, then a weighted
rubric scored by a model. Cheap proof first, expensive judgment second.

## Phase A — deterministic

```bash
whw evaluate --phase a
```

Runs `evaluate.phaseA` commands from `whw.config.json` (lint, tests, build —
e.g. `["node --test \"tests/**/*.test.js\""]`) and records pass/fail per command with tails in
`.whw/evaluation-report.json` (gitignored; derived). Any failure → the change is REJECTED with the
exact command and output. Never score Phase B on a red Phase A. Cite
`whw evaluate --phase a` in todo evidence rather than committing the report.

## Phase B — rubric

```bash
whw evaluate --phase b                  # prints the scoring prompt
whw evaluate --phase b --scores '{…}'   # ingest scores → APPROVE/REJECT
```

The model reviews the diff against the wave's ADR, acceptance criteria, and
`templates/evaluation-criteria.md`, then returns JSON:

```json
{
  "scores": {
    "technical-quality": 4,
    "originality": 4,
    "craft": 3,
    "functionality": 5
  },
  "fixes": []
}
```

Weights (defaults, tunable in config): technical-quality 1.3, originality 1.3,
craft 1.0, functionality 1.0. Scores 0–5; weighted average ≥ threshold (3.5) →
**APPROVE**, else **REJECT** with exactly the top-3 fixes by leverage
(`fixes` is required on REJECT — the command refuses verdicts without them).

The originality weight is deliberate: generic, over-abstracted, or
placeholder-laden work fails even when tests pass.

## Separation of duties

REJECT returns to the builder with failures only — the evaluator never
rewrites the code in the same pass. The verdict is recorded as evidence on
the wave's C todo. The report is local (`.whw/evaluation-report.json`,
gitignored); the command is the durable evidence.

## Tuning

- Threshold and weights are per-project (`whw.config.json`). Raise the bar for
  security-sensitive surfaces; lower ceremony for docs-only waves — via ADR,
  not vibes.
- Criteria ids are free-form, but keep the default four unless you have a
  reason: comparability across waves matters more than perfect taxonomy.
