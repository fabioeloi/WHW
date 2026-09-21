# ADR 0012 — Maintenance policy

- **Status:** Accepted
- **Date:** 2026-09-10
- **Wave:** 011
- **Related:** WHY.md, [0005](0005-wave-contract.md), [0008](0008-program-001.md), [0009](0009-program-002.md)

## Context

After Program 001 closed, `344731d`, `12e88b0`, and `c36e1d9` landed on `main`
with no wave, no todo, and no `(Wave NNN L)` trailer — while ADR 0008 said
there is no wave 007 without a new charter. WHW currently has no written
exception for emergency CI fixes. Without a policy, every hotfix recreates
the same process debt.

## Decision

| Rule | Detail |
| ---- | ------ |
| Default | All product work is a wave letter. No wave N+1 without a charter that includes it |
| Maint exception | `chore(maint): …` (no wave trailer) is allowed **only** when linked to an open GitHub issue labeled `maint`, the diff is ≤ one concern (CI pin, docs typo, secret rotation), and `whw gate run --tier pr` is GO |
| After a maint commit | Open or extend a wave in the active program (or charter the next program) within one working day so the exception does not become the path |
| Forbidden as maint | Features, schema changes, new gates, README repositioning, npm publishes |
| Close hygiene | Program close addenda list any `chore(maint)` SHAs in range; inventory does not require them to be waves |

### Options considered

| Option | Upside | Downside |
| ------ | ------ | -------- |
| Zero exceptions | Pure process | CI stays red until a full wave A–E |
| Anything goes after close | Fast | Recreates Program 001 drift |
| Narrow `chore(maint)` + issue (chosen) | Unblocks red CI; still audited | Needs discipline to convert maint into a wave |

## Consequences

### Positive

- Red CI can be fixed the same hour without lying that a wave happened.
- The exception is visible (`maint` issues + SHAs in the close addendum).

### Negative / trade-offs

- A sloppy `maint` label becomes a backdoor. Wave 011 should add a lint or
  ops note if abuse appears; this ADR does not add a gate yet.

## References

- [AGENTS.md](../../AGENTS.md) — never merge on red; never start the next wave until `main` is green
- [docs/how/conventions.md](../how/conventions.md)

## Addendum Wave 011 — program-close

Accepted as the post-close exception for red CI: `chore(maint)` only with a
`maint` issue, one concern, and `pr` gates GO. Wave 011 did not add a maint
lint gate (no abuse observed). No `chore(maint)` SHAs in Program 002. Evidence:
PRs [#23](https://github.com/fabioeloi/WHW/pull/23),
[#24](https://github.com/fabioeloi/WHW/pull/24),
[#25](https://github.com/fabioeloi/WHW/pull/25); `npm test` 56/56;
`whw gate run --tier pr` GO; `whw gate run --tier ops` GO.

## Addendum Wave 013 — Dependabot as maint (draft)

Drafted at 013 B; Accepted at 013 D.

`chore(deps)` from Dependabot is maint when the PR carries label `maint`,
the diff is one dependency, and the CI matrix is green. A `maint` *issue*
is not required for Dependabot — the PR label is the link (config:
`.github/dependabot.yml` already applies `maint`). Human hotfixes stay
`chore(maint)` with an open `maint` issue, one concern, and `pr` GO, as
in the Wave 011 addendum (unchanged).

`maint-audit` (`ops`) lists non-merge commits since the last **program**
close (highest `program-close` wave whose E is `done`). A subject is
allowed when it contains `(Wave NNN L)`, or starts with `chore(deps)` or
`chore(maint)`. The gate does not fetch GitHub labels; one-dep / `maint`
label remain merge discipline. Forbidden-as-maint (features, schema, new
gates, README repositioning, npm publishes) is unchanged.

<!-- Addenda: append `## Addendum Wave NNN — <topic>` per wave D, newest last. -->
