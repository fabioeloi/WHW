# Acknowledgments

WHW stands on the shoulders of prior art. This file records what the project
learned from, and the terms under which ideas were reused.

## Direct lineage (MIT-licensed, same author)

- **FORGE** (`fabioeloi/FORGE`, MIT) — the Planner → Builder → Evaluator triad,
  file-driven state (`spec` / `sprint-contract` / `evaluation-report`), the
  two-phase evaluator (deterministic checks first, AI rubric second), the model
  escalation ladder, per-role context strategies (compaction vs. reset), and the
  weighted evaluation rubric (4 criteria, 0–5, threshold 3.5). Adapted and
  generalized here; no FORGE text is copied verbatim.
- **omni-architect** (`fabioeloi/omni-architect`, MIT) — the phase-chain
  orchestrator with resumable runs (`run` → checkpoint → `resume`), lifecycle
  shell hooks (`on_validation_approved`, `on_figma_complete`, `on_error`),
  config precedence (flags > env > config file > defaults), secret redaction in
  logs, the weighted validation-score pattern (criteria × weights → threshold →
  `approved`/`rejected`), and the skill-packaging conventions. Adapted and
  generalized here.

## Methodological inspiration

- **Simon Sinek, *Start With Why* (2009)** — the Why → How → What ordering is
  the inspiration for WHW's name and for the traceability rule (no todo without
  a wave, no wave without an ADR, no ADR without a WHY). No text, diagrams, or
  trademarks are reproduced. WHW is an independent project and is **not
  affiliated with or endorsed by Simon Sinek or The Optimism Company**.
- A long-running production project by the author (private) — the wave rhythm
  (plan → implement → verify → decide → close), program charters with explicit
  exclusions, SQL-backed execution state with dependency edges, GO/NO_GO gates
  with timestamped checkpoints, cross-document sync gates, and the
  Status / Evidence / Next-step reporting contract. Only the *mechanisms* were
  carried over, renamed and renumbered; no proprietary names, artifacts, SQL
  content, scripts, or identifiers appear in this repository.

## Open standards and specifications

- **AGENTS.md** — the open, Linux Foundation Agentic AI Foundation–stewarded
  convention for repository-level agent instructions. WHW adopts `AGENTS.md` as
  its canonical instruction file with thin per-tool adapters.
- **Agent Skills** (`agentskills.io/specification`) — the open `SKILL.md`
  format. WHW ships compliant skills (`name`, `description`, `license`,
  `compatibility`, `metadata`).
- **"From Prompt to Process"** (arXiv 2606.04967) — the six-dimension taxonomy
  (specification, context, roles, execution, validation, portability) used in
  `docs/why/positioning.md` to situate WHW among peer frameworks.

## Runtimes and libraries

- **Node.js** (`node:sqlite`, `node:test`) and **SQLite** — WHW's zero-dependency
  runtime. No third-party runtime dependencies are used.

## Contributing back

If you adapt WHW's mechanisms into your own project, a link back to this
repository is appreciated but not required by the MIT license.
