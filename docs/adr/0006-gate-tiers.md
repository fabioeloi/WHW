# ADR 0006 — Gate tiers: lean blocking PR, on-demand ops

- **Status:** Accepted
- **Date:** 2026-09-10
- **Wave:** 003
- **Related:** [0005](0005-wave-contract.md), `docs/how/gates.md`

## Context

Gates enforce the process, but every required check taxes every PR. Too few
and drift wins; too many and engineers route around them ("CI theater").
WHW needs a tiering policy with a bias.

## Decision

| Rule | Detail |
| ---- | ------ |
| `pr` tier | **Blocking and lean**: planning-coverage, adr-link, wave-sync, readme-sync, agents-parity, no-secrets. Must be GO to merge |
| `ops` tier | **On demand**: program-inventory (closes), plus project-specific gates (releases, drills) |
| Admission | A new `pr` gate must catch real drift and fail with the smallest fix; otherwise it is `ops` |
| Custom gates | Shell commands in `whw.config.json` (exit 0 = GO); listed by `whw doctor`, never auto-trusted |
| Proof | Every run writes `.whw/checkpoints/<gate>/latest.txt` (committed) |

### Options considered

| Option | Upside | Downside |
| ------ | ------ | -------- |
| Single tier, everything blocking | Maximum enforcement | Slow PRs; theater pressure; bypass culture |
| Advisory-only gates | Zero friction | Zero enforcement; drift undetected |
| Lean-pr + ops (chosen) | Fast merges, deep checks where they matter | Requires discipline to keep `pr` small (this ADR is the discipline) |

## Consequences

### Positive

- CI stays fast; closes and releases stay rigorous.
- Gate failures are actionable by construction.

### Negative / trade-offs

- `ops` gates only work if someone runs them — the closer role and program
  close criteria own that obligation.

## References

- `src/gates/runner.js`, `src/gates/builtin/`, `roles/closer.md`

## Addendum Wave 003 — scaffolds-gates

Shipped: `init`/`adr`/`program`/`wave`/`adapters` scaffolds, gate runner with
`pr`/`ops` tiers, 7 built-ins, custom shell gates, GO/NO_GO checkpoints.
Evidence: fresh-scaffold `gate run --tier pr` all GO; `node:sqlite` warning
suppression verified. Follow-ups: none.
