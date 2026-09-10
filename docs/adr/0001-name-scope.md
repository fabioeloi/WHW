# ADR 0001 — Name and scope: WHW, an agnostic delivery harness

- **Status:** Accepted
- **Date:** 2026-09-10
- **Wave:** 001
- **Related:** WHY.md, [0007](0007-licensing-attribution.md)

## Context

Autonomous coding agents need process with state, but existing harnesses bind
to vendors, models, or stacks. WHW needs a name and a crisp scope: what it is,
what it refuses to be, and how it credits its inspirations without infringing
them.

## Decision

| Rule | Detail |
| ---- | ------ |
| Name | **WHW** (Why · How · What). Never "Golden Circle" / "Start With Why" in product naming, badges, or trademarks |
| What it is | A harness: waves, ADRs, SQL planning, gates, roles, skills — files and SQL in, evidence out |
| What it is not | Not a model router, not an IDE, not a CI provider, not a code generator |
| Agnosticism | Any model (open/closed), any tool (via `AGENTS.md` + adapters), any stack (gates assert user contracts) |
| Inspiration credit | Sinek's Why→How→What ordering credited as inspiration with a non-affiliation disclaimer; no text or marks reproduced |

### Options considered

| Option | Upside | Downside |
| ------ | ------ | -------- |
| Vendor-native harness (one IDE/CLI) | Deeper integration | Betrays portability; dies with the vendor's API |
| Model-specific prompts | Higher peak quality | Fragments with every release; untestable matrix |
| Files + SQL contract (chosen) | Portable, testable, durable | Less magic; users bring their own runners |

## Consequences

### Positive

- The contract survives model and tool churn.
- Scope disputes resolve by pointing here.

### Negative / trade-offs

- WHW cannot do what only deep integration can (inline completions, IDE UI).
  That is intentional.

## References

- `docs/why/manifesto.md`, `docs/why/positioning.md`

## Addendum Wave 001 — repo-scaffold

Shipped: repo hygiene (LICENSE MIT, READMEs EN+pt-BR, ACKNOWLEDGMENTS,
CHANGELOG, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY), `package.json`
(`@fabioeloi/whw`, zero deps, Node ≥ 22.13), `.gitignore`, `.editorconfig`,
`whw.config.json`; branch renamed to `main`. Evidence: file tree + `whw wave
new` smoke tests. Follow-ups: none.
