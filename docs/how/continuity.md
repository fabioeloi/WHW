# Continuity and IDE handoff

Sessions end; tools change; operators sleep. WHW treats continuity as a
mechanism, not a hope: resume from state, migrate with a package, never
reconstruct from memory.

## Resume after interruption

Reboot, restart, context reset, or new chat — one command:

```bash
whw resume
```

`whw resume` prints the git baseline, runs `whw sync --all` (skip with
`--no-sync`), then the queue and next step. It does **not** claim. Then
continue the nearest pending step and report only the delta (already done vs.
still missing). Re-running `whw gate run --tier pr` buys fast confidence.
Do not re-ask the operator for context unless a blocking divergence appears
after revalidation.

Equivalent by hand:

```bash
git status --short --branch
git log --oneline -n 10
whw sync --all
whw queue
```

## Migrating tools

`whw handoff --from <tool> --to <tool>` writes
`docs/handoff/handoff-<date>-<from>-to-<to>.md` containing:

- **git baseline** — branch @ SHA, clean/dirty status, recent log;
- **queue snapshot** — `in_progress` + top `ready` todos;
- **gate results** — latest checkpoint verdicts;
- **recent transitions** — who did what, with what evidence;
- **chat-path map** — local session paths per tool with confidence levels
  (official / local-observed / probable / needs-runtime-detection);
- **continuity checklist** — baseline match → `whw resume` → gates → claim.

This repository keeps a live package under `docs/handoff/` as proof the
command is exercised, not only documented. In the target tool: verify the
baseline matches first. If git diverges, stop and reconcile before touching
the queue.

## Config hooks

Optional post-event shell commands in `whw.config.json`:

```json
{
  "hooks": {
    "on_claim": "…",
    "on_done": "…",
    "on_gate_fail": "…",
    "on_close": "…"
  }
}
```

Hooks run **after** the action commits. A non-zero exit is logged; the
claim/done/close/gate verdict is never rolled back. Same trust bar as custom
gates — only from repositories you trust. Env vars: `WHW_HOOK`, `WHW_ROOT`,
plus `WHW_REF` / `WHW_FROM` / `WHW_TO` / `WHW_ACTOR` on claim/done,
`WHW_GATES` on gate fail, `WHW_WAVE` / `WHW_TRACK` on close.

## Rules

- Raw transcripts stay local. Handoffs carry paths and timestamps, never
  pasted conversations — and never committed transcript dumps.
- Never claim a session path is universal; mark confidence honestly.
- The queue is the handoff: if `whw resume` + the baseline do not explain the
  next action, the previous session under-reported — say so and re-plan.
- Prefer migrating at wave-letter boundaries (clean claims, fresh context).
