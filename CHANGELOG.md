# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `maint-audit` ops gate: after the last closed `program-close` wave, every
  non-merge commit subject must carry `(Wave NNN L)`, or start with
  `chore(deps)` / `chore(maint)` (ADR 0012 / 0014).

### Changed

- `release.yml` npm job publishes with GitHub Actions OIDC (`id-token:
  write`) and no longer sets `NODE_AUTH_TOKEN`. The `NPM_TOKEN` secret
  stays until the first OIDC publish (wave 016 / `v0.2.0`). Configure the
  npm trusted-publisher row before tagging. SECURITY.md documents the path.
- README quick start uses `npx @fabioeloi/whw` now that `0.1.1` is on npm
  ([#28](https://github.com/fabioeloi/WHW/issues/28)).
- Consumer CI template (`templates/ci-whw.yml` and `whw init` fallback) pins
  `actions/checkout@v7` and `actions/setup-node@v7`, matching this repo
  ([#30](https://github.com/fabioeloi/WHW/issues/30)).
- `release-readiness` requires an empty `[Unreleased]` when `HEAD` is tagged
  `v<version>`, `package.json` `bin` paths without `./`, and `repository.url`
  in `git+https://` form.
- GitHub Release notes come from the matching CHANGELOG section
  (`--notes-file`); `release.yml` runs `release-readiness` before `gh release
  create`.
- Gate `latest.txt` is deterministic (no timestamps) so a GO run leaves the
  tree clean. `.whw/evaluation-report.json` is gitignored (derived). `ops`
  `latest.txt` files are tracked consistently with `pr`.

## [0.1.1] - 2026-09-10

The 0.1.1 tarball already included waves 008–011 (`resume`, hooks,
`evidence-quality`, `release-readiness`). This section lagged the tarball
and was folded here in wave 012.

### Added

- Program 002 charter (ADR 0009) and waves 007–011 (publish, hygiene, runner
  proof, continuity, close).
- `.github/workflows/release.yml`: on `v*` tags, run tests + PR gates, create a
  GitHub Release, then `npm publish --access public --provenance` (requires
  `NPM_TOKEN`; confirm before tagging — ADR 0010).
- Dependabot updates for GitHub Actions (weekly).
- `release-readiness` ops gate: when `package.json` exists, name/semver/license,
  `LICENSE`, `README.md`, CHANGELOG heading, and `bin` paths must agree. Does
  not publish npm or create tags.
- `whw resume [--no-sync]`: git baseline, optional `sync --all`, queue, next
  step. Does not claim. AGENTS.md resume protocol as one command.
- Config `hooks` (`on_claim`, `on_done`, `on_gate_fail`, `on_close`): post-event
  shell commands. Non-zero exit is logged; the transition is not rolled back.
- Live `docs/handoff/` package (`whw handoff --from cursor --to claude`).
- `evidence-quality` ops gate: from wave 007 onward, `done` evidence must name
  a SHA, PR `#N`, test/gate command, or checkpoint path (ADR 0011).
- `whw claim --force-wip` to override the one-claim-per-actor guard.
- `whw run` unit tests for `composePrompt`, escalation, and stub open-weight →
  closed CLIs. Optional `model` / `costClass` on escalation tiers (logged with
  `durationMs`). Open-model examples (Ollama, llama.cpp, Aider) in
  `docs/how/escalation.md`. `.whw/runs/` is gitignored. `whw run` now reaches
  the `human` tier immediately when the previous tier is exhausted.

### Fixed

- CI now runs `whw sync --all` before doctor and PR gates so a fresh checkout
  (no gitignored `state.db`) is not a false `planning-coverage` NO_GO.
- `whw doctor` warns when planning seeds exist and the state DB has 0 todos.
- README quick start: clone + `node ./bin/whw.js` until npm publish lands;
  removed the `node_modules/.bin` line. `README.pt-BR.md` gains a Roadmap.
- Gate runner NO_GO `unsynced-state` when planning seeds exist and `todos` is
  empty, before individual gates can GO vacuously.
- `whw sync` preserves `in_progress`, `blocked`, and `cancelled` (not only
  `done`), so re-applying seeds cannot unclaim work.

### Changed

- CI and the consumer template pin `actions/checkout@v5` and
  `actions/setup-node@v5` (Node 24 runtime).
- Package version 0.1.1.
- Gitignore timestamped checkpoint copies; track `.whw/checkpoints/**/latest.txt`
  only. Scaffold `GITIGNORE_BLOCK` matches.

## [0.1.0] - 2026-09-10

### Added

- Initial public release of WHW (Why · How · What).
- WHY/HOW/WHAT traceability model: `WHY.md` → program charter ADR → thematic
  ADRs → waves (PRs A–E) → SQL todos → gates → evidence → metrics.
- Wave contract: A (plan/SQL seed) → B (implement) → C (verify) → D (decide/ADR
  addendum) → E (canonical close); programs chartered by an ADR with explicit
  exclusions and an inventory gate; no wave N+1 without a new charter.
- `whw` CLI (Node.js ≥ 22.13, zero runtime dependencies, `node:sqlite`):
  `init`, `doctor`, `adapters sync`, `adr new`, `program new`, `wave new`,
  `sync`, `queue`, `claim`, `done`, `block`, `cancel`, `note`, `status`,
  `gate list|run`, `evaluate`, `close`, `metrics`, `handoff`, `run`.
- SQL planning schema (`todos`, `todo_deps`, `transitions`, `ready` view) for
  SQLite by default with a PostgreSQL adapter schema; idempotent seeds that
  never downgrade `done`.
- Gate runner with `pr` (blocking, lean) and `ops` (on-demand) tiers,
  GO/NO_GO checkpoints under `.whw/checkpoints/<gate>/latest.txt`, and
  built-ins: `planning-coverage`, `adr-link`, `program-inventory`, `wave-sync`,
  `readme-sync`, `agents-parity`, `no-secrets`; custom shell gates via config.
- Two-phase evaluation: Phase A deterministic checks → `evaluation-report.json`;
  Phase B weighted rubric (technical-quality 1.3, originality 1.3, craft 1.0,
  functionality 1.0; 0–5; threshold 3.5) as a model-agnostic prompt + score ingest.
- Agent roles (`planner`, `builder`, `evaluator`, `closer`,
  `autonomous-engineer`) with per-role context strategies and handoff files.
- Agent Skills (`skills/whw-*/SKILL.md`) compliant with agentskills.io.
- Canonical `AGENTS.md` with thin adapters for Claude Code, Gemini CLI, GitHub
  Copilot, Cursor, Windsurf, and Codex.
- Templates for WHY, AGENTS, ADR, program charter, wave SQL, 5W2H plan entries,
  PRs, handoffs, status reports, and evaluation criteria.
- Documentation set: `docs/why` (manifesto, principles, positioning),
  `docs/how` (waves, programs, ADRs, todos.sql, gates, evidence, continuity,
  roles, escalation, evaluation, conventions), `docs/what` (CLI, schema,
  config, templates, adapters, metrics), and WHW's own ADRs 0001–0008.
- Worked example (`examples/hello-wave`) and `node:test` unit + end-to-end suites.
- Portuguese translation: `README.pt-BR.md`.

[0.1.1]: https://github.com/fabioeloi/WHW/releases/tag/v0.1.1
[0.1.0]: https://github.com/fabioeloi/WHW/releases/tag/v0.1.0
