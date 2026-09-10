# Positioning

How WHW relates to the agentic software-development landscape, using the
six-dimension taxonomy from "From Prompt to Process" (arXiv 2606.04967):
**specification, context, roles, execution, validation, portability** — plus
the dimension WHW adds: **purpose**.

## The taxonomy in one table

| Dimension      | What it asks                              | WHW's answer                                          |
| -------------- | ----------------------------------------- | ----------------------------------------------------- |
| Specification  | Is intent a durable artifact?             | `WHY.md` + ADRs + versioned `planning/*.todos.sql`    |
| Context        | Does state survive sessions?              | SQLite execution graph + `docs/plan.md` narrative     |
| Roles          | Are responsibilities separated?           | Planner / builder / evaluator / closer / autonomous-engineer |
| Execution      | Is the loop defined and resumable?        | Waves A–E, claim/done/block, `whw run` + escalation   |
| Validation     | Is "done" checked, not claimed?           | GO/NO_GO gates + two-phase evaluation + sync gates    |
| Portability    | Does it work across agents?               | Files + SQL + `AGENTS.md` + adapters; any model       |
| Purpose (WHW+) | Does work trace to a why?                 | No todo without a wave, wave without ADR, ADR without WHY |

The paper's central finding is a structural trade-off between process depth
and portability: no surveyed framework covers all six dimensions strongly.
WHW is designed to cover all six by keeping the contract primitive — files,
SQL, exit codes — instead of building on any vendor's agent API.

## Peers (what WHW borrows, what it differs on)

- **GitHub Spec Kit** — spec-driven development with an excellent CLI. Greenfield-
  optimized; specs are change-scoped rather than long-lived capability contracts.
  WHW's ADRs + programs are the long-lived counterpart, and waves carry the
  change scope.
- **OpenSpec** — lightweight, brownfield-first, ADDED/MODIFIED/REMOVED delta
  discipline. WHW agrees on deltas (addenda, never rewrites) and adds the
  execution graph plus gates.
- **BMAD-Method** — multi-persona Agent-as-Code with deep process. WHW's five
  roles are the minimal viable separation (plan / build / review / land /
  own-the-loop) with file handoffs instead of persona orchestration.
- **GSD / Ralph loops** — autonomous iteration until done. WHW's `whw run` +
  escalation ladder is the same instinct with an explicit human terminal tier
  and SQL-backed resume.
- **sdd-harness / cc-sdd** — runtime-agnostic harnesses with `AGENTS.md` as the
  "README for robots" and skill packs per tool. WHW shares the philosophy
  (canonical `AGENTS.md`, thin adapters, Agent Skills) and adds waves,
  programs, gates, and the WHY traceability rule.

## What WHW uniquely combines

1. **Purpose traceability** as a load-bearing rule, not a suggestion.
2. **Programs with exclusion charters** and inventory-gated close (scope creep
   requires a new ADR).
3. **SQL execution graph** (DAG deps, audited transitions) as the agent's
   working memory, with zero infrastructure (SQLite).
4. **Cross-document sync gates** so narrative (README/plan/ADRs) cannot drift
   from execution state.
5. **Zero-dependency, zero-vendor** operation: Node.js builtins + files + SQL.

## Non-goals (deliberate)

- WHW is not a model router, not an IDE, and not a CI provider. It shells out
  to your runners, editors, and pipelines.
- WHW does not generate code from specs by itself. It organizes whoever does —
  human or model — into a verifiable loop.
- WHW does not prescribe your stack. Gates assert *your* contracts; the harness
  only ensures you follow them.
