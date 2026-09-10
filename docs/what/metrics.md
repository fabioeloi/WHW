# Metrics reference

`whw metrics` snapshots reproducible repository numbers — the quantitative
half of evidence. Same repo + same command = same numbers.

## Dimensions

| Group | Metrics |
| ----- | ------- |
| `project` / `at` | Config project name, snapshot timestamp |
| `git` | `commits`, `head`, `branch`, `firstCommit`, `lastCommit`, `calendarDays`, `prRefsUnique` (`#NNN` in messages) |
| `adrs` | Count of `docs/adr/*.md` |
| `waves` | `total` seed files, `closed` (E done) |
| `planning` | `seeds`, `todos`, `done`, `tracks`, `doneRatio` |
| `gates` | `builtin` (7), `custom`, `checkpointsGo`, `checkpointsTotal` |
| `tests` | `testFiles`, `testCases` (`test(`/`it(` occurrences under `tests/`) |

```bash
whw metrics                 # human table
whw metrics --json          # JSON to stdout
whw metrics --out FILE      # JSON snapshot to file (e.g. .whw/metrics.json)
```

## Uses

- **Program close**: snapshot at close, link from the retrospective addendum.
- **Case studies**: cite the snapshot file + the regenerating command, never
  hand-counted numbers.
- **Drift watch**: `doneRatio` per track, checkpoint GO ratios, days-per-wave
  (derive from snapshots over time).

## Limits (honest)

- `testCases` is a textual heuristic, not a test runner report.
- `prRefsUnique` counts references in messages, not merged PRs (offline by
  design — no `gh` dependency).
- Metrics describe the process surface, not product outcomes. Pair them with
  the WHY acceptance they serve.
