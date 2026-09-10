# Principles

Seven principles, in priority order. When two conflict, the earlier one wins.

## 1. Purpose first

Start from WHY and keep the traceability chain unbroken: todo → wave → ADR →
WHY. Work that cannot name its parent is not started; work whose parent died
is cancelled, not rationalized.

## 2. Evidence over chat

"Done" is a database row with evidence, not a sentence in a transcript.
Commits, PRs, checkpoints, test output — if a stranger cannot re-run the
proof, the proof does not exist. `whw done` without `--evidence` is refused
by design.

## 3. SQL is the source of truth

Execution state lives in `todos` + `todo_deps`: statuses, dependencies,
transitions, evidence. Narrative (`docs/plan.md`) carries intent; chat carries
nothing durable. Agents sync, claim, and close through the CLI — never by
hand-editing state, never from memory.

## 4. Lean gates, honestly blocking

A few checks that actually block are worth more than a dashboard that merely
informs. The `pr` tier stays small (coverage, linkage, sync, parity, secrets);
everything else is `ops` (on demand). Gate cascades as maturity theater —
dozens of required checks nobody can explain — are an explicit anti-goal. Every
gate failure must name the smallest fix.

## 5. Small waves, always shippable

Five letters, five small PRs, one reviewable increment. Large efforts split
into programs, not into large PRs. `main` stays green; the next wave never
starts on a red `main`. Reversibility beats velocity: prefer the smallest step
that tests the idea.

## 6. Honest abandonment

Cancelled work is recorded, not deleted: `cancelled` with a reason, ADR status
flipped with a pointer, exclusions named in the charter. A graveyard of
decisions you can read beats a history rewritten to look inevitable. Sunk cost
is not a roadmap.

## 7. Continuity over cleverness

Sessions end; tools change; operators sleep. Every mechanism must survive an
interruption: resume from `git status` + `whw queue`, migrate tools with
`whw handoff`, onboard strangers with `WHY.md` + `AGENTS.md` + `docs/plan.md`.
If a workflow only works inside one person's head — or one vendor's product —
it is not a workflow.
