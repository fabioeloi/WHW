# Schema reference

Execution state: three tables + one view. SQLite (`sql/schema.sqlite.sql`) is
the default backend; PostgreSQL (`sql/schema.postgres.sql`) is an optional
adapter with identical semantics.

## todos

| Column | Type | Meaning |
| ------ | ---- | ------- |
| `ref` | TEXT PK | Stable id: `waveNNN-L` for waves, free-form otherwise |
| `title` | TEXT NOT NULL | One-line, reviewable in a queue listing |
| `status` | TEXT | `pending` `in_progress` `done` `blocked` `cancelled` (CHECK) |
| `track` | TEXT NOT NULL | Wave track (`wave-NNN-slug`) or free-form track |
| `step` | INTEGER | 1–999; queue order within a track |
| `letter` | TEXT NULL | Wave letter A–E (NULL for non-wave tracks) |
| `adr` | TEXT NULL | Serving ADR number, e.g. `0009` |
| `notes` | TEXT NULL | Working notes; block/cancel reasons appended |
| `evidence` | TEXT NULL | Proof of done (commits/PRs/tests/checkpoints) |
| `created_at` / `updated_at` | timestamps | `updated_at` refreshed by trigger on UPDATE |

Indexes: `status`, `track`. `ref` is UNIQUE by primary key.

## todo_deps

DAG edges: (`ref`, `depends_on`), composite PK, both FKs to `todos(ref)`
`ON DELETE CASCADE`, `CHECK (ref <> depends_on)`. Wave seeds chain
A→B→C→D→E; E additionally fans in on A–D transitively through the chain.

## transitions

Audit trail (append-only): `id`, `ref`, `from_status`, `to_status`, `actor`,
`evidence`, `at`. Every CLI status change inserts exactly one row; `whw close`
backfills rows for refs its `.done.sql` flips.

## ready (view)

`pending` todos whose dependencies are all `done`/`cancelled`:

```sql
SELECT t.* FROM todos t
WHERE t.status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM todo_deps d JOIN todos p ON p.ref = d.depends_on
    WHERE d.ref = t.ref AND p.status NOT IN ('done', 'cancelled')
  );
```

`whw queue` = `in_progress` (by track, step) + `ready` (by track, step).

## Seed contract

Seeds are idempotent upserts that never downgrade `done`:

```sql
INSERT INTO todos (…) VALUES (…)
ON CONFLICT (ref) DO UPDATE SET
  …,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;
```

(PostgreSQL: `EXCLUDED` uppercase.) Deps are cleared per-wave-ref-prefix and
re-inserted, then `ON CONFLICT DO NOTHING`. Apply seeds only via `whw sync`;
apply `.done.sql` only via `whw close`.
