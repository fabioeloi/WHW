# ADR 0007 — Licensing and attribution policy

- **Status:** Accepted
- **Date:** 2026-09-10
- **Wave:** 001
- **Related:** [0001](0001-name-scope.md), `ACKNOWLEDGMENTS.md`, `LICENSE`

## Context

WHW unifies mechanisms learned from prior work (two MIT repos by the author,
one private production project) and an idea from a 2009 book. The codebase
must be cleanly MIT-licensable with honest attribution and zero proprietary
carryover.

## Decision

| Rule | Detail |
| ---- | ------ |
| License | **MIT**, `Copyright (c) 2026 Fabio Eloi`; SPDX headers on source files |
| MIT lineage | FORGE + omni-architect patterns adapted with credit in `ACKNOWLEDGMENTS.md`; no verbatim copies |
| Book inspiration | Sinek's Why→How→What credited as inspiration only, with non-affiliation disclaimer; no text/marks reproduced |
| Private origin | Only *mechanisms* carried over, renamed and renumbered; no product/host/schema names, SQL content, scripts, or identifiers. Cited in docs solely as "a long-running production project by the author" |
| Hygiene gates | `no-secrets` in the `pr` tier + a pre-publish grep for origin identifiers before the first public push |
| Third-party standards | AGENTS.md convention, Agent Skills spec, taxonomy paper cited in `ACKNOWLEDGMENTS.md` |

### Options considered

| Option | Upside | Downside |
| ------ | ------ | -------- |
| Copyleft (GPL) | Forces openness downstream | Friction for harness adoption inside companies |
| MIT without attribution file | Shorter | Loses the lineage story; weaker inspiration hygiene |
| MIT + ACKNOWLEDGMENTS + hygiene gates (chosen) | Adoptable, honest, verifiable | Requires pre-publish discipline (gated, not hoped) |

## Consequences

### Positive

- Anyone can adopt, fork, or embed WHW with one license file.
- Provenance questions resolve by pointing at `ACKNOWLEDGMENTS.md` + this ADR.

### Negative / trade-offs

- MIT permits closed forks — accepted; adoption beats control for a harness.

## References

- `LICENSE`, `ACKNOWLEDGMENTS.md`, `src/gates/builtin/no-secrets.js`
