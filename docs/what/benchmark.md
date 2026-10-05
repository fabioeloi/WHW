# Shift-left benchmark

`npm run benchmark` runs the same five ledger changes under `classic` and
`shift-left`, then writes `benchmarks/shift-left/out/report.json` (gitignored).
Same fixture, same cost model, same command: same verdict and the same
canonical digest. No model is called. `modelCalls`, `tokens`, and observed
human wait stay `null`.

## Scenario

The fixture is `benchmarks/shift-left/ledger/`: a domain module, an infra
module, and a `pay` API. Three fitness scripts travel with it:

- domain code must not import infra
- logs must not contain a PAN, an email, or the marker `pan`
- every `export function` in `src/api` must be named under `test/`

| Change | Signals | Class |
| ------ | ------- | ----- |
| `docs-readme` | `docs` | low |
| `rename-local` | `local-refactor`, `test-only` | low |
| `invoice-module` | `new-module`, `behavior` | medium |
| `debug-payment-log` | `pii`, `logging` | high (initial patch fails the PII fitness; a fix exists) |
| `domain-owns-table` | `architecture`, `security-boundary` | critical |

The critical change has two defects. Fitness sees the illegal import. A
direct `readTable('payments')` has no fitness rule. The driver applies the
safe tree only when D0 is already done; the classic arm applies a mechanical
fix that removes the import and leaves the read. That oracle is the diagnosis
hypothesis, not a field measurement. `costExcludingOracle` omits the escape
weight so a reader can reject the hypothesis and still see the ceremony math.
`comprehensionProven` is always `false`.

Classic review is also modeled: the driver records one `whw judge` per wave
because the A–E CLI has no approval command. Shift-left judgment is enforced
by the CLI. The report states both facts.

## Verdict

The rubric in `benchmarks/shift-left/run.js` (`verdictFor`) returns:

- `recommend-adopt` — shift-left ceremony cost is strictly lower, escaped defects are not higher, every critical wave has judgment and a walkthrough, every low wave has zero judgments, and the classic arm still closes A–E with one modeled review each
- `recommend-reject` — more escapes, a critical wave without a person, a low wave that required judgment, or a classic arm that no longer matches that contract
- `tradeoff` — shift-left is safer and not lighter
- `inconclusive` — a class does not match the scenario, or safety is not worse but ceremony is not lower

Weights live in `benchmarks/shift-left/cost-model.json`. They are
dimensionless. Changing them is a decision; do not edit them only to obtain
`recommend-adopt`. The test asserts structural invariants and that the
verdict equals `verdictFor`. It does not hardcode the word adopt.

Regenerate with:

```bash
npm run benchmark
```
