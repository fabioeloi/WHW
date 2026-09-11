# ADR 0011 — Derived-state policy

- **Status:** Accepted
- **Date:** 2026-09-10
- **Wave:** 008
- **Related:** WHY.md, [0002](0002-sqlite-default.md), [0006](0006-gate-tiers.md), [0009](0009-program-002.md), [0013](0013-program-trust-adoption.md)

## Context

`.whw/state.db` is gitignored (rebuild with `whw sync --all`), but 35
timestamped checkpoint files plus `latest.txt`, `.whw/metrics.json`, and
`.whw/evaluation-report.json` are tracked. Every `whw gate run` dirties the
tree. Program 001 evidence strings (`Program 001 session: letter X shipped +
verified`) are not re-runnable. `whw claim` does not enforce the documented
one-claim-at-a-time rule. Several PR-tier gates GO vacuously on an empty DB;
only `planning-coverage` catches unsynced seeds.

## Decision

| Rule | Detail |
| ---- | ------ |
| Checkpoints | Track **`latest.txt` only**. Timestamped copies (`.whw/checkpoints/<gate>/<gate>-<stamp>.txt`) are local history — gitignore them; update `GITIGNORE_BLOCK` in `src/scaffold/init.js` |
| Metrics / eval reports | `.whw/metrics.json` and `.whw/evaluation-report.json` remain committable proof when a close or evaluate letter says so; they are regenerated, not hand-edited |
| Historic evidence | **Not rewritten.** `done` is terminal. Retro findings are `whw note` on the closed E todo |
| evidence-quality | New `ops`-tier gate: from wave 007 onward, evidence must contain at least one of SHA, PR `#N`, a test command, or a checkpoint path |
| WIP | `whw claim` refuses a second `in_progress` for the same actor unless `--force-wip` |
| Unsynced state | Gate runner NO_GO when planning seeds exist and `todos` count is 0 (before individual gates) |

### Options considered

| Option | Upside | Downside |
| ------ | ------ | -------- |
| Track every timestamped checkpoint | Full audit in git | Noise; dirty tree on every run |
| Track nothing under `.whw/` | Clean | Closes lose their cited proof |
| `latest.txt` only (chosen) | Proof without churn | Loses intermediate stamps (they remain on disk) |

## Consequences

### Positive

- Gate runs stop producing unreviewable diffs.
- Future `done` evidence is something a stranger can re-run.
- Empty-DB CI cannot look "mostly green".

### Negative / trade-offs

- Operators must pass `--force-wip` for legitimate parallel claims.
- `evidence-quality` lives in `ops` so existing Program 001 rows do not block PRs.

## References

- [docs/how/evidence.md](../how/evidence.md)
- [docs/how/gates.md](../how/gates.md)

## Addendum Wave 008 — state-hygiene

Shipped: gitignore timestamped checkpoint copies (`latest.txt` only);
`evidence-quality` ops gate (wave 007+); `whw claim --force-wip`; unsynced-state
NO_GO before vacuous GO; doctor warn on empty DB + seeds; `whw sync` restores
`in_progress`/`blocked`/`cancelled` (not only `done`). ADR 0008 close-criteria
checkboxes filled. Evidence: PRs
[#8](https://github.com/fabioeloi/WHW/pull/8),
[#9](https://github.com/fabioeloi/WHW/pull/9),
[#10](https://github.com/fabioeloi/WHW/pull/10),
[#11](https://github.com/fabioeloi/WHW/pull/11); `npm test` 39/39;
`whw gate run --tier pr` GO. Historic Program 001 evidence is not rewritten;
`evidence-quality` is `ops` so `wave007-A`'s seed-style string does not block
PRs. Follow-ups: wave 009 runner-proof; do not tag `v0.1.1` until `NPM_TOKEN`
is confirmed.

## Addendum Wave 012 — release-truth

`latest.txt` is deterministic (no clock in the body). Timestamped
`<gate>-<stamp>.txt` copies stay local and gitignored. A second GO
`whw gate run` must leave tracked checkpoints unchanged (unit test in
`tests/unit/gates.test.js`). `.whw/evaluation-report.json` is gitignored
(derived); cite `whw evaluate --phase a` in evidence. `ops` `latest.txt`
files (including `evidence-quality`) are tracked consistently with `pr`.
Evidence: PRs [#32](https://github.com/fabioeloi/WHW/pull/32),
[#33](https://github.com/fabioeloi/WHW/pull/33),
[#34](https://github.com/fabioeloi/WHW/pull/34); `npm test` 60/60;
`whw gate run --tier pr` GO. Follow-up: wave 013 trusted publishing.

<!-- Addenda: append `## Addendum Wave NNN — <topic>` per wave D, newest last. -->
