# CLI reference

Complete `whw` command surface. Global flags (anywhere):
`--root DIR` (project root; default: auto-discovered),
`--config FILE`, `--json` (machine output), `--help`, `--version`.

Exit codes: `0` success/GO/APPROVE · `1` error/NO_GO/REJECT · `3` human
escalation (`whw run` exhausted).

## Setup

| Command | Effect |
| ------- | ------ |
| `whw init [--tools a,b] [--project NAME] [--force] [--full]` | Scaffold WHW (config, WHY/AGENTS, plan, roles, skills, templates, CI, PR template, adapters). Idempotent; `--force` overwrites WHW-managed files (never your code, never README). `--full` also copies `docs/`. |
| `whw doctor [--json]` | Verify toolchain + config + layout (read-only; lists custom gates without running them). |
| `whw adapters sync [--tools a,b] [--force]` | (Re)generate tool pointer files + `.whw/adapters.json` manifest. Tools: `claude gemini copilot cursor windsurf codex opencode aider` (last three native, fileless). |

## Charter

| Command | Effect |
| ------- | ------ |
| `whw adr new <slug> [--title T]` | Next `docs/adr/NNNN-<slug>.md` from template. |
| `whw program new <slug> --waves N [--title T]` | Charter ADR with wave map for the next N global wave numbers. |
| `whw wave new <slug> --adr NNNN [--force]` | `planning/wave-NNN-<slug>.{todos,done}.sql` (A–E chain). Refuses unknown ADRs unless `--force`. |

## Execute

| Command | Effect |
| ------- | ------ |
| `whw sync [track\|--all]` | Apply seed(s) to `.whw/state.db` (idempotent, never downgrades `done`). Bare `sync` applies all. |
| `whw queue [--track T] [--status S] [--limit N]` | Actionable work: `in_progress` first, then dependency-ready `pending`. `--status` lists verbatim. |
| `whw claim <ref> [--actor A] [--force-wip]` | `pending`/`blocked` → `in_progress`. Refuses a second `in_progress` for the same actor unless `--force-wip`. |
| `whw done <ref> --evidence E [--actor A]` | `in_progress` → `done`. Evidence required. Terminal. |
| `whw block <ref> --reason R` | → `blocked` (reason appended to notes). |
| `whw cancel <ref> [--reason R]` | → `cancelled`. |
| `whw note <ref> -m MSG` | Append to notes (no status change). |
| `whw status [track]` | Status / Evidence / Next step from SQL. |
| `whw run <role> [--ref R] [--runner CMD] [--task T] [--max-attempts N] [--dry-run]` | Compose prompt + invoke CLI through the escalation ladder. |

## Verify

| Command | Effect |
| ------- | ------ |
| `whw gate list` | Builtin + custom gates with tiers. |
| `whw gate run [NAME…\|--tier pr\|--all]` | Run gates → checkpoints + GO/NO_GO (bare = `pr` tier). `whw gate <name>` also works. |
| `whw evaluate --phase a` | Run deterministic checks → `.whw/evaluation-report.json`. |
| `whw evaluate --phase b [--scores JSON\|@file]` | Print scoring prompt, or ingest scores → APPROVE/REJECT. |
| `whw close <wave>` | Canonical close: A–D terminal + addendum + sync gates GO → apply `.done.sql`. Accepts `001`, `wave-001`, or full track. |
| `whw metrics [--out FILE]` | Reproducible repo metrics (JSON with `--json` or file). |

## Continuity

| Command | Effect |
| ------- | ------ |
| `whw handoff --from TOOL --to TOOL [--out FILE] [--task TEXT]` | Migration package (default `docs/handoff/handoff-<date>-<from>-to-<to>.md`). |

## JSON mode

`--json` emits parsed structures for `queue`, `status`, `gate run`, `gate list`,
`evaluate`, `close`, `metrics`, `doctor`, `handoff`, transitions, and scaffolds.
Secrets are redacted (`[REDACTED]`) in `--json` data output.
