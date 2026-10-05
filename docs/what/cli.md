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
| `whw wave new <slug> --adr NNNN [--signals a,b] [--force]` | Seeds plus `planning/wave-NNN-<slug>.risk.json`. Classic stays A–E and ignores signals. Shift-left requires signals and routes the chain. Refuses unknown ADRs unless `--force`. |

## Execute

| Command | Effect |
| ------- | ------ |
| `whw sync [track\|--all]` | Apply seed(s) to `.whw/state.db` (idempotent, never downgrades `done`). Bare `sync` applies all. |
| `whw queue [--track T] [--status S] [--limit N]` | Actionable work: `in_progress` first, then dependency-ready `pending`. `--status` lists verbatim. |
| `whw claim <ref> [--actor A] [--force-wip]` | `pending`/`blocked` → `in_progress`. Refuses open SQL dependencies and a second `in_progress` for the same actor unless `--force-wip`. Shift-left high/critical also refuses B while fitness is NO_GO. |
| `whw done <ref> --evidence E [--actor A]` | `in_progress` → `done`. Evidence required. Terminal. |
| `whw block <ref> --reason R` | → `blocked` (reason appended to notes). |
| `whw cancel <ref> [--reason R]` | → `cancelled`. |
| `whw note <ref> -m MSG` | Append to notes (no status change). |
| `whw status [track]` | Status / Evidence / Next step from SQL. |
| `whw run <role> [--ref R] [--runner CMD] [--task T] [--max-attempts N] [--dry-run]` | Compose prompt + invoke CLI through the escalation ladder. |

## Verify

| Command | Effect |
| ------- | ------ |
| `whw gate list` | Builtin + custom gates with tiers. Every gate listed here is `kind: conformance`. |
| `whw gate run [NAME…\|--tier pr\|--all]` | Run gates → checkpoints + GO/NO_GO (bare = `pr` tier). `whw gate <name>` also works. |
| `whw fitness run` | Run `fitness[]` shell rules. Exit 0 when all GO or none are configured. |
| `whw judge <wave> --decision approve\|reject --note TEXT` | Write `docs/judgment/wave-NNN.md`. Records an attestation; does not prove comprehension. |
| `whw evaluate --phase a` | Run deterministic checks → `.whw/evaluation-report.json` (gitignored). |
| `whw evaluate --phase b [--scores JSON\|@file]` | Print scoring prompt, or ingest scores → APPROVE/REJECT. |
| `whw close <wave>` | Canonical close. Classic: A–D terminal. Shift-left: every seeded letter except E, plus `## Learning Wave NNN`. Both require an addendum and sync gates GO, then apply `.done.sql`. Accepts `001`, `wave-001`, or full track. |
| `whw metrics [--out FILE]` | Reproducible repo metrics (JSON with `--json` or file). |

## Continuity

| Command | Effect |
| ------- | ------ |
| `whw resume [--no-sync] [--track T]` | Revalidate after interruption: git baseline, sync (unless `--no-sync`), PR gates, queue, next step. Returns nonzero on NO_GO; JSON includes `gates`. Does **not** claim. |
| `whw handoff --from TOOL --to TOOL [--out FILE] [--task TEXT]` | Migration package (default `docs/handoff/handoff-<date>-<from>-to-<to>.md`). |

## JSON mode

`--json` emits parsed structures for `queue`, `status`, `gate run`, `gate list`,
`evaluate`, `close`, `metrics`, `doctor`, `handoff`, `resume`, transitions, and scaffolds.
Secrets are redacted (`[REDACTED]`) in `--json` data output.

## Doctor runner discovery

Doctor searches PATH for executable files named `codex`, `claude`, `gemini`,
`ollama`, `opencode` and `aider`, reporting each as `runner:<name>`. The first
executable file wins; directories and non-executable files are excluded.
Missing runners are optional warnings, not failures. Discovery does not run
these executables, log in, or trigger inference. Executable presence says
nothing about authentication, installed models or backend health.
`configured-runners` separately lists the configured default command and
escalation tiers, without executing their shell commands.

## Run metrics

Metrics retain existing fields and add `runs`:

- `processed`: valid direct `.whw/runs/<role>-YYYYMMDDTHHMMSSZ-attempt<N>.log`
  files parsed, one per WHW attempt (not one per session or task).
- `malformed`: matching files unreadable or missing a finite nonnegative
  `durationMs`, integer `exit`, or the `$ ` command boundary; these do not
  enter aggregates.
- `unknown`: processed attempts with missing/blank `costClass`, or the literal
  class `unknown`.
- `byCostClass`: groups configured class strings (including custom classes).
  Missing/blank values enter `unknown`. Each group has `attempts`, `successes`
  (`exit=0`), `failures` (other exits), and summed `durationMs`.

Only metadata before the `$ ` command line is parsed. Runner output cannot
supply metadata. Non-attempt files and all subdirectories, including research
and session logs, are excluded. Missing/empty runs directories produce zero
counts and an empty `byCostClass`. There is no USD estimate: `costClass` is a
configured category; configured model is not backend attestation. Success in
these aggregates means process exit zero; SQL completion and rerunnable
evidence require independent verification, as specified by the
[Wave 014 proof protocol](../how/runner-proof-real.md).
