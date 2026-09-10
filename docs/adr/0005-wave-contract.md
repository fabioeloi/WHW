# ADR 0005 — Wave contract A–E and program charters

- **Status:** Accepted
- **Date:** 2026-09-10
- **Wave:** 002
- **Related:** [0006](0006-gate-tiers.md), `docs/how/waves.md`, `docs/how/programs.md`

## Context

Agents need a rhythm small enough to review and strict enough to trust:
planning, building, verifying, deciding, and closing must be distinguishable
events with artifacts — and multi-wave efforts need bounded scope.

## Decision

| Rule | Detail |
| ---- | ------ |
| Wave = A–E | **A** plan/seed → **B** implement → **C** verify → **D** ADR addendum → **E** canonical close; one letter per PR; done only when E merges |
| Seed chain | `todo_deps` A→B→C→D→E; letters unlock in order |
| Programs | Chartered by ADR: outcome, exclusions, wave map, close criteria; first wave doc-first, last wave closes |
| Boundary | No wave past a program's range without a new charter ADR (enforced by `program-inventory`) |
| Traceability | No todo without a wave, no wave without an ADR, no ADR without a WHY |

### Options considered

| Option | Upside | Downside |
| ------ | ------ | -------- |
| Free-form tasks | Flexible | Unreviewable scope; "done" undefined |
| Sprints (time-boxed) | Familiar | Time boxes lie for agents; artifacts still undefined |
| A–E waves + charters (chosen) | Artifact per letter; scope needs decisions | Ceremony overhead for trivial fixes (mitigated: solo flow = atomic commits per letter) |

## Consequences

### Positive

- Reviews, handoffs, and metrics share one vocabulary (letters, waves, programs).
- Scope creep becomes a visible, decidable event.

### Negative / trade-offs

- One-line fixes carry five-letter ceremony — acceptable; letters can be small,
  but they must exist to keep the audit trail uniform.

## References

- `src/scaffold/wave.js`, `src/scaffold/program.js`, `src/close.js`

## Addendum Wave 002 — sql-cli-core

Shipped: `sql/schema.sqlite.sql` + `sql/schema.postgres.sql` (todos,
todo_deps, transitions, ready view), `bin/whw.js`, `src/cli.js` dispatcher,
config precedence, redacting logger, `node:sqlite` adapter, seed/queue/
transitions/status. Evidence: smoke loop sync→queue→claim→done→status green.
Follow-ups: none.
