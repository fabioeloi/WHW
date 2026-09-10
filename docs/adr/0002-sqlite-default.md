# ADR 0002 — SQLite as the default state backend

- **Status:** Accepted
- **Date:** 2026-09-10
- **Wave:** 001
- **Related:** [0003](0003-node-zero-deps.md), `docs/what/schema.md`

## Context

Agents need queryable execution state (statuses, DAG deps, audit trail) with
zero setup friction. Options range from Markdown checklists (unqueryable) to
PostgreSQL (a service to run).

## Decision

| Rule | Detail |
| ---- | ------ |
| Default backend | **SQLite** via built-in `node:sqlite` — `.whw/state.db`, derived, gitignored |
| Schema | `todos` + `todo_deps` + `transitions` + `ready` view (`sql/schema.sqlite.sql`) |
| Optional adapter | PostgreSQL schema with identical semantics (`sql/schema.postgres.sql`) for teams with a shared DB |
| Access | Only via `whw` CLI (sync/queue/claim/done/…) — hand SQL voids the audit warranty |

### Options considered

| Option | Upside | Downside |
| ------ | ------ | -------- |
| Markdown todos | Zero deps, human-readable | No queries, no deps, no audit; drifts instantly |
| JSON files | Simple | Concurrent writes, no relational queries |
| PostgreSQL-only | Shared, powerful | Requires a service; kills zero-setup adoption |
| SQLite default + PG adapter (chosen) | Zero setup; escape hatch preserved | Two schemas to keep in sync (gated by review) |

## Consequences

### Positive

- `whw init` → `whw sync` works with no services.
- Seeds stay the versioned truth; the DB is always rebuildable.

### Negative / trade-offs

- `node:sqlite` is pre-stable upstream (warning suppressed; API surface used is minimal and pinned by tests).
- Multi-writer concurrency is out of scope — one operator/agent at a time per checkout.

## References

- `sql/schema.sqlite.sql`, `sql/schema.postgres.sql`
