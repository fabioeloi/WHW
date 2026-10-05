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

## Composer reading

`npm run benchmark:composer` asks Composer 2.5 (`--model composer-2.5`) to
read that report. The `model` field is the id that was requested, not proof
that the backend served that version. The command
does not re-run the waves, does not edit `verdictFor`, and does not change
`process.profile`. The opinion is written beside the report at
`benchmarks/shift-left/out/composer-analysis.json` (gitignored) and may
disagree with `recommend-adopt`. `comprehensionProven` stays false. This is
not a second productivity measurement.

The runner is a shell command with `WHW_PROMPT_FILE`, same contract as
`whw run`. Set `WHW_COMPOSER_RUNNER` to override it. If `cursor-agent` (or a
Cursor `agent` binary whose help names Composer) is missing, the command
exits 2 and does not invent an analysis. `npm test` checks the JSON contract
with a recorded reply and does not call the model. `WHW_COMPOSER_LIVE=1`
runs one live call and checks that all five change ids come back; the
recommendation text is not pinned. The live path uses
`benchmarks/shift-left/agent-runner.mjs` (`--model composer-2.5`, `--mode ask`,
`-f`) and discovers `cursor-agent` / `agent` under `~/.local/bin` as well as
`PATH`. Authenticate first (`agent login`) or set `CURSOR_API_KEY` (Cloud Agent
runtime secret). Then:

```bash
npm run test:composer:live
```
