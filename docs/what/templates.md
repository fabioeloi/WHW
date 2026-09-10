# Templates reference

`templates/` ships the starting point for every WHW document. Scaffolds
resolve templates in order: **project `templates/` override → package
`templates/` → embedded fallback** — so projects can customize wording
without forking the CLI.

## Scaffold inputs

| Template | Used by | Placeholders |
| -------- | ------- | ------------ |
| `WHY.md` | `whw init` | `PROJECT`, `DATE` |
| `AGENTS.md` | `whw init` | `PROJECT` |
| `README.md` | `whw init` (only when missing) | `PROJECT` |
| `plan.md` | `whw init` | `PROJECT` |
| `adr.md` | `whw adr new` | `NUMBER`, `SLUG`, `TITLE`, `DATE`, `STATUS` |
| `program-charter.md` | `whw program new` | `NUMBER`, `SLUG`, `TITLE`, `DATE`, `STATUS`, `FIRST`, `LAST`, `AFTER`, `COUNT`, `WAVE_MAP` |
| `wave.todos.sql` | `whw wave new` | `WAVE`, `TRACK`, `REF_PREFIX`, `SLUG`, `ADR`, `DATE`, `ROWS`, `DEPS` |
| `wave.done.sql` | `whw wave new` | `WAVE`, `TRACK`, `REF_PREFIX`, `SLUG`, `DATE` |
| `pull_request_template.md` | `whw init` | (static) |
| `ci-whw.yml` | `whw init` | (static) |
| `handoff.md` | `whw handoff` | `FROM`, `TO`, `DATE`, `OBJECTIVE`, `BRANCH`, `HEAD`, `STATUS_CLEAN`, `LOG`, `QUEUE`, `GATES`, `TRANSITIONS`, `CHAT_PATHS` |
| `adapters/*.md` | `whw adapters sync` | `TOOL` |

Unknown `{{TOKENS}}` are left intact by the renderer.

## Manual templates (copy-paste)

| Template | Purpose |
| -------- | ------- |
| `plan-wave-5w2h.md` | Wave entry skeleton for `docs/plan.md` (`WAVE`, `SLUG`, `ADR` filled by hand) |
| `status-report.md` | Status / Evidence / Next step (+ Blocked variant) for manual reports |
| `evaluation-criteria.md` | The 0–5 rubric behind Phase B scoring |

## Customizing

Copy any template into your project's `templates/` and edit freely — the CLI
prefers yours. Keep the placeholder names and the `whw:program` marker shape;
gates parse those. `whw init` never overwrites your `templates/` without
`--force`.
