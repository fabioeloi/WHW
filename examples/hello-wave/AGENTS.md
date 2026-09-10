# AGENTS.md — Hello Wave

Canonical agent instructions for this example repo.

## The loop

1. `whw sync --all` → `whw queue` (SQL is the source of truth).
2. `whw claim <ref>` — one at a time.
3. Follow `README.md` (the walkthrough) for the wave's work.
4. `whw done <ref> --evidence "…"` — evidence required.
5. `whw gate run --tier pr` must be GO; close with `whw close 001`.

## Never

- Never hand-edit `.whw/state.db`; never commit it.
- Never commit secrets. Never downgrade `done`.
