# ADR 0018 — Opt-in shift-left profile and comparison benchmark

- **Status:** Proposed
- **Date:** 2026-10-05
- **Wave:** experiment (not a chartered product wave)
- **Related:** [0005](0005-wave-contract.md), [0006](0006-gate-tiers.md), [risk review](../how/risk-review.md), [benchmark](../what/benchmark.md)

## Context

The default WHW contract is one A–E chain and the same conformance gates for
every wave. That keeps continuity and evidence, and it also spends the same
ceremony on a README change as on an architectural boundary. A diagnosis of
that shape asked for earlier design on dangerous changes, human review only
where the risk justifies it, executable fitness rules, and a measured
comparison before anyone treats the new shape as the default.

## Decision

| Rule | Detail |
| ---- | ------ |
| Default | `process.profile` stays `classic` when omitted. This repo does not set the key. Existing A–E closes, `pr` gates, and tests stay the control arm |
| Opt-in | `shift-left` classifies `--signals` (highest wins) and seeds a different chain: low `A→B→C→E`, medium `A→B→C→D→E` with D cancellable when fitness is GO, high `A→D0→B→C→D→E`, critical adds `W` |
| Judgment | `whw judge` writes an attestation. Heading checks and fitness are conformance. An attestation is not proof of understanding (`comprehensionProven` stays false) |
| Fitness | Project shell rules in `fitness[]`. High and critical shift-left refuse `claim` of B while they are NO_GO. Letter C runs them on `done` for every profile when rules exist |
| Learning | Shift-left `whw close` also requires `## Learning Wave NNN` (discovered, failed assumption, rule to adjust) |
| Comparison | `npm run benchmark` runs both profiles on the same ledger fixture and writes a verdict. The verdict does not change the default profile |
| Claim order | `whw claim` now refuses while a SQL dependency is not `done` or `cancelled`, matching the ready queue. Ordered waves are unchanged |

### Options considered

| Option | Upside | Downside |
| ------ | ------ | -------- |
| Replace A–E in place | One process | Destroys the control arm; adoption would be a rewrite, not a decision |
| Document the idea only | No code risk | Nothing to measure |
| Opt-in profile plus a simulated comparison (chosen) | Classic stays reproducible; the report is regenerable | The oracle is a hypothesis, not a field result |

## Consequences

### Positive

- Low-risk waves can close without `whw judge`. Critical waves cannot start Build without D0, and cannot close without a walkthrough and a learning section.
- The same five changes produce both arms, so the delta is the process rather than a different backlog.

### Negative / trade-offs

- Fresh databases accept letters `D0` and `W`. An existing `.whw/state.db` keeps its old check until it is deleted and `whw sync` rebuilds it.
- Classic universal review in the benchmark is modeled by the driver. The classic CLI still has no approval command, so the report says so.
- Weights are dimensionless. They are not hours, tokens, or money. Retuning them to force `recommend-adopt` would be a different decision and must be visible in the cost-model diff.

## References

- `src/risk.js`, `src/shift-left.js`, `src/fitness.js`, `benchmarks/shift-left/`
