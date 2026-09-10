# Self-management with todos.sql

WHW projects manage themselves through versioned SQL seeds. Intent is code:
reviewed in PRs, diffed in git, applied idempotently, queried by agents.

## The two layers

| Layer | Files | Role |
| ----- | ----- | ---- |
| Intent (versioned) | `planning/*.todos.sql` + `*.done.sql` | What should happen, and in what order |
| State (derived) | `.whw/state.db` (gitignored) | What actually happened: statuses, transitions, evidence |

`whw sync` loads intent into state. Seeds are upserts that **never downgrade
`done`**: re-syncing after edits updates titles, notes, and structure while
preserving completed work. The database can always be rebuilt — delete it and
re-sync if it ever diverges.

## Seed anatomy

`whw wave new <slug> --adr NNNN` generates the pair:

- `planning/wave-NNN-<slug>.todos.sql` — five rows (`waveNNN-A`…`E`), steps
  1–5, letters, ADR, notes — plus the dependency chain A→B→C→D→E in
  `todo_deps`. Applied by `whw sync` (and re-applied freely).
- `planning/wave-NNN-<slug>.done.sql` — the close hook. Applied **only** by
  `whw close` after A–D are terminal, the addendum exists, and sync gates are
  GO. Never by hand.

Non-wave tracks (recurring ops, imports) use the same shape with free-form
refs and explicit `todo_deps` edges — see `sql/schema.*.sql` for the pattern.

## The agent loop

```bash
whw sync --all            # intent → state
whw queue                 # in_progress first, then dependency-ready pending
whw claim wave003-B       # pending → in_progress (audited)
# … work …
whw done wave003-B --evidence "PR #48, e2e green"   # evidence required
whw block wave003-C --reason "waiting on API key"   # objective cause
whw note wave003-C -m "key requested, ticket OPS-12"
whw status                # Status / Evidence / Next step
```

Every transition lands in `transitions` (ref, from → to, actor, evidence,
timestamp). `whw status` renders the report from the database — the same data
a handoff, a metric, or a gate reads.

## Rules

- The queue decides what is true. In-chat lists are scratch, never canonical.
- One claim at a time per agent; claim before coding, evidence on done.
- Statuses: `pending`, `in_progress`, `done`, `blocked`, `cancelled`.
  `done` is terminal. `blocked`/`cancelled` require reasons.
- State edits go through the CLI. Hand SQL against `state.db` voids the audit
  warranty — and `planning-coverage` will notice drift on the next sync.
