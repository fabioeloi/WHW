# WHY — WHW

> Purpose first: no wave without an ADR, no ADR without a WHY.

## Purpose

WHW (Why · How · What) exists so autonomous software delivery survives contact
with reality: models change, tools change, sessions interrupt — but versioned
intent, recorded decisions, executable checks, and an audit trail keep the
work verifiable. WHW serves solo developers and small teams shipping with AI
agents who refuse to trade speed for proof.

WHY this, and not another harness: the field has plenty of *what* (prompts,
plugins, dashboards) and *how* (loops, skills, routers), but almost nothing
that makes *purpose* load-bearing. WHW's bet is that traceability —
todo → wave → ADR → WHY — is the missing primitive, and that files + SQL are
the most durable way to carry it across models and tools.

## Non-goals

- Not a model router, IDE, CI provider, or code generator (see ADR 0001).
- Not a methodology that requires WHW's own history: numbering restarts at
  001/0001, vocabulary is fresh, and no private origin is named or needed.
- Not a gate bureaucracy: the `pr` tier stays lean by charter (ADR 0006).

## Principles

- **Purpose first.** Every wave traces to an ADR; every ADR traces here.
- **Evidence over chat.** Claims ship with gates, commits, PRs, and test output.
- **Small waves.** Five letters (A–E), five small PRs, always shippable.
- **Lean gates.** A few blocking checks with proof; no cascades as theater.
- **Continuity.** Sessions resume from SQL and files, never from memory.
- **Honest abandonment.** Cancelled work is recorded, never rewritten.

## Success looks like

- A stranger can clone WHW, run `whw doctor` + `whw gate run --tier pr`, and
  trust the verdicts without reading the code first.
- A new tool onboards by adding one adapter pointer, not by migrating state.
- Programs close with inventory proof and metrics a case study can cite.
- WHW itself is built with WHW: this repo's `planning/`, `docs/plan.md`, and
  `docs/adr/0008-program-001.md` are the living demonstration.
