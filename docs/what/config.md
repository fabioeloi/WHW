# Config reference

`whw.config.json` at the project root. Precedence, highest first:
**CLI flags > `WHW_*` env vars > `whw.config.json` > built-in defaults.**
Machine schema: [`config.schema.json`](config.schema.json).

## Full example

```json
{
  "project": "My Project",
  "dirs": {
    "planning": "planning",
    "adr": "docs/adr",
    "plan": "docs/plan.md",
    "checkpoints": ".whw/checkpoints",
    "state": ".whw/state.db",
    "roles": "roles",
    "templates": "templates",
    "skills": "skills"
  },
  "gates": {
    "tiers": {
      "pr": ["planning-coverage", "adr-link", "wave-sync", "readme-sync", "agents-parity", "no-secrets"],
      "ops": ["program-inventory", "evidence-quality"]
    },
    "custom": [
      { "name": "openapi-routes", "command": "npm run check:routes", "description": "Spec matches handlers" }
    ]
  },
  "evaluate": {
    "phaseA": ["node --test \"tests/**/*.test.js\""],
    "threshold": 3.5,
    "criteria": [
      { "id": "technical-quality", "weight": 1.3 },
      { "id": "originality", "weight": 1.3 },
      { "id": "craft", "weight": 1.0 },
      { "id": "functionality", "weight": 1.0 }
    ]
  },
  "conventions": {
    "branch": "{type}/wave-{nnn}-{slug}-{letter}",
    "commit": "{type}({scope}): {summary} (Wave {nnn} {letter})",
    "waveLetters": ["A", "B", "C", "D", "E"]
  },
  "adapters": { "tools": ["claude", "gemini", "copilot", "cursor", "windsurf"] },
  "runners": { "default": null },
  "escalation": { "tiers": [], "maxFailuresDefault": 2 }
}
```

## Sections

- **dirs** — relocatable layouts (monorepos: point `planning`/`adr` per package
  via nested configs — nearest `whw.config.json` wins per `--root`).
- **gates.tiers** — tier → gate names. `pr` should stay lean (see
  `docs/how/gates.md`). Custom gates join tiers by name.
- **gates.custom** — `{name, command, description}` shell gates. Exit 0 = GO.
  Only from repos you trust.
- **evaluate.phaseA** — deterministic shell commands for `whw evaluate --phase a`.
- **evaluate.threshold / criteria** — rubric tuning for Phase B.
- **conventions** — branch/commit patterns (documentary; enforced by review,
  not by parser — keep them readable).
- **adapters.tools** — fallback tool list for the `agents-parity` gate when no
  `.whw/adapters.json` manifest exists.
- **runners.default** — shell command for `whw run` (env: `WHW_PROMPT_FILE`,
  `WHW_ROLE`, `WHW_REF`, `WHW_ROOT`, `WHW_ATTEMPT`, `WHW_TIER`).
- **escalation** — ladder tiers `[{name, runner, maxFailures} | {name, human}]`.

## Environment overrides

| Variable | Overrides |
| -------- | --------- |
| `WHW_PROJECT` | `project` |
| `WHW_PLANNING` / `WHW_ADR` / `WHW_PLAN` / `WHW_CHECKPOINTS` / `WHW_STATE` | matching `dirs.*` |
| `WHW_RUNNER` | `runners.default` |

`whw doctor` prints the resolved config file path and warns when falling back
to defaults.
