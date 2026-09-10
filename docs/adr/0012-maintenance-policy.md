# ADR 0012 — Maintenance policy

- **Status:** Proposed
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

<!-- Addenda: append `## Addendum Wave NNN — <topic>` per wave D, newest last. -->
