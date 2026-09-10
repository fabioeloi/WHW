# Continuity and IDE handoff

Sessions end; tools change; operators sleep. WHW treats continuity as a
mechanism, not a hope: resume from state, migrate with a package, never
reconstruct from memory.

## Resume after interruption

Reboot, restart, context reset, or new chat — the protocol is identical:

```bash
git status --short --branch
git log --oneline -n 10
whw sync --all
whw queue
```

Then continue the nearest pending step and report only the delta (already done
vs. still missing). Re-running `whw gate run --tier pr` buys fast confidence.
Do not re-ask the operator for context unless a blocking divergence appears
after revalidation.

## Migrating tools

`whw handoff --from <tool> --to <tool>` writes
`docs/handoff/handoff-<date>-<from>-to-<to>.md` containing:

- **git baseline** — branch @ SHA, clean/dirty status, recent log;
- **queue snapshot** — `in_progress` + top `ready` todos;
- **gate results** — latest checkpoint verdicts;
- **recent transitions** — who did what, with what evidence;
- **chat-path map** — local session paths per tool with confidence levels
  (official / local-observed / probable / needs-runtime-detection);
- **continuity checklist** — baseline match → sync → queue → gates → resume.

In the target tool: verify the baseline matches first. If git diverges, stop
and reconcile before touching the queue.

## Rules

- Raw transcripts stay local. Handoffs carry paths and timestamps, never
  pasted conversations — and never committed transcript dumps.
- Never claim a session path is universal; mark confidence honestly.
- The queue is the handoff: if `whw queue` + the baseline do not explain the
  next action, the previous session under-reported — say so and re-plan.
- Prefer migrating at wave-letter boundaries (clean claims, fresh context).
