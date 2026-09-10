# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[0.1.0]: https://github.com/fabioeloi/WHW/releases/tag/v0.1.0
