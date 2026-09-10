# Evidence and reporting

WHW's answer to "prove it": evidence is structured, attached to the work, and
rendered on demand — never vibes in a transcript.

## Where evidence lives

| Evidence | Location | Written by |
| -------- | -------- | ---------- |
| Todo evidence | `todos.evidence` + `transitions` rows | `whw done --evidence`, `whw close` |
| Gate verdicts | `.whw/checkpoints/<gate>/latest.txt` | `whw gate run` |
| Evaluation | `.whw/evaluation-report.json` | `whw evaluate` |
| Metrics | `.whw/metrics.json` (via `--out`) | `whw metrics` |
| Commits/PRs | git history with `(Wave NNN L)` trailers | humans/agents |
| Narrative | `docs/plan.md` entries + ADR addenda | wave D/E letters |

The `wave-sync` gate keeps the narrative layer honest: a closed wave without
its plan entry and addendum fails the `pr` tier.

## The milestone report

Every milestone ends with the same contract (`whw status` renders it from SQL):

```md
## Status
- <completed, 1–3 bullets>

## Evidence
- `<command / check / test / PR>`
- `<objective result>`

## Next step
- <immediate action>
```

Blocked work replaces Next step with **Blocked**: objective cause, impact, and
the smallest unblock action. Empty milestone responses are forbidden — always
return at least minimal progress. A manual template lives in
`templates/status-report.md`.

## Metrics

`whw metrics` snapshots reproducible numbers: commits, PR references, calendar
days, ADRs, waves (total/closed), planning totals and done ratio, gates
(builtin/custom, checkpoint verdicts), test files/cases. Same repo + same
command = same numbers; record them in program-close addenda and case studies
instead of hand-counting.

## Rules

- Evidence names artifacts a stranger could re-run (commit SHAs, PR numbers,
  checkpoint paths, exact commands) — never "fixed" or "tested".
- PR numbers flow back into todo evidence, the plan entry, and the ADR
  addendum. Three pointers, zero archaeology.
- Track `latest.txt` as proof; timestamped checkpoint copies stay on disk and
  are gitignored. `state.db` is derived — rebuild with `whw sync --all`.
- From wave 007 onward, `whw gate run evidence-quality` (`ops`) fails `done`
  rows whose evidence is not re-runnable. Historic Program 001 strings stay
  as written.
