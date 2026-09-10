# ADR 0003 — Node.js with zero runtime dependencies

- **Status:** Accepted
- **Date:** 2026-09-10
- **Wave:** 001
- **Related:** [0002](0002-sqlite-default.md)

## Context

The harness must install anywhere agents run — containers, laptops, CI — with
minimal supply-chain risk and no toolchain debates.

## Decision

| Rule | Detail |
| ---- | ------ |
| Runtime | **Node.js ≥ 22.13** (first line with flag-free `node:sqlite`) |
| Dependencies | **Zero** runtime dependencies; Node builtins only (`node:sqlite`, `node:test`, `node:fs`, …) |
| Language | ESM JavaScript with JSDoc; 2-space indent; SPDX headers |
| Tests | `node:test` + `node:assert/strict`, no framework |
| Distribution | npm package `@fabioeloi/whw` (binary `whw`) + vendoring via `whw init` copy |

### Options considered

| Option | Upside | Downside |
| ------ | ------ | -------- |
| Bash + sqlite3 CLI | Ubiquitous shell | Quoting/JSON pain; Windows friction; untestable growth |
| Python | AI-tooling ubiquity | venv/pipx friction; heavier than builtins-only Node |
| Go binary | Single fast artifact | Heavier contribution curve; overkill for a file harness |
| Node zero-dep (chosen) | Builtins cover sqlite/test/glob; huge agent familiarity | Node version floor (22.13) |

## Consequences

### Positive

- Install is `npx` with no audit surface; CI is one setup-node step.
- Contributors need only Node + git.

### Negative / trade-offs

- No third-party CLI parsing, colors, or YAML — hand-rolled minimal versions.
- Tied to Node's release line for `node:sqlite` stability (see ADR 0002).

## References

- `package.json` (`engines`, zero `dependencies`), `bin/whw.js`
