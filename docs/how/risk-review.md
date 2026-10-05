# Risk review (shift-left)

The default profile is `classic`: every wave is A–E, signals are stored and
ignored, and `whw close` still requires A–D plus an ADR addendum. Nothing in
this document changes that default.

Set `"process": { "profile": "shift-left" }` to route each new wave by
signals. `whw wave new <slug> --adr NNNN --signals a,b` (or
`process.signals` when the flag is omitted). Unknown signals fail closed.
The highest class wins.

| Class | Signals | Chain | Human judgment | Before Build |
| ----- | ------- | ----- | -------------- | ------------ |
| low | `docs`, `local-refactor`, `test-only` | A → B → C → E | never | — |
| medium | `behavior`, `schema`, `new-module` | A → B → C → D → E | only when fitness is not GO (`whw cancel` D otherwise) | — |
| high | `auth`, `payment`, `pii`, `infra`, `logging` | A → D0 → B → C → D → E | always, before D is done | design checkpoint and fitness GO |
| critical | `architecture`, `security-boundary`, `destructive-migration`, `blast-radius` | high chain plus W before E | always | design checkpoint, fitness GO, and a walkthrough before close |

## Conformance and judgment

Builtin and custom gates are `kind: conformance`. They check executable
properties. `whw judge <wave> --decision approve|reject --note TEXT` writes
`docs/judgment/wave-NNN.md` and a ceremony fact of `kind: judgment`. The file
proves that a decision was recorded. It does not prove that a person
understood the system.

D0 requires `docs/design/wave-NNN.md` (`templates/design-checkpoint.md`).
W requires `docs/walkthrough/wave-NNN.md` (`templates/walkthrough.md`).
Those heading checks are conformance of the artifact contract.

## Fitness

`fitness[]` holds project shell commands (`{id, command}`). WHW does not ship
universal domain rules. `whw fitness run` executes them. Shift-left high and
critical also run them inside `whw claim` of B and refuse the claim on NO_GO.
`whw done` of letter C runs them for every profile when the list is non-empty.

## Close as learning

Shift-left close still requires the addendum and the sync gates. It also
requires `## Learning Wave NNN` with the labels `Discovered`,
`Failed assumption`, and `Rule to adjust`.

## Ceremony facts

`claim`, `done`, `gate`, `judge`, and `close` append one JSON object per line
to `.whw/ceremony.jsonl`. There is no timestamp. The file is derived state.
The benchmark applies [cost-model.json](../../benchmarks/shift-left/cost-model.json);
the harness does not convert the log into hours.

## Database

Letters `D0` and `W` are accepted by databases created with the current
schema. `CREATE TABLE IF NOT EXISTS` does not alter a database that already
exists. Delete `.whw/state.db` and run `whw sync --all` before the first
shift-left wave in an older checkout.

`whw claim` refuses while a SQL dependency is still open, for both profiles.
That matches the ready queue. Finish or cancel the predecessor first.
