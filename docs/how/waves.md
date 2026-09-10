# Waves

A **wave** is the unit of execution: one reviewable increment delivered in
five letters, A through E. Each letter is a small PR (or an atomic commit in
solo/no-remote flows). A wave is `done` only when **E** merges.

## The contract

```mermaid
flowchart LR
  A["A — Plan\ntodos.sql seed + deps"] --> B["B — Build\nimplementation"]
  B --> C["C — Check\ntests + gates"]
  C --> D["D — Decide\nADR addendum"]
  D --> E["E — Close\nwhw close"]
```

| Letter | Name   | Delivers | Typical branch |
| ------ | ------ | -------- | -------------- |
| **A**  | Plan   | `planning/wave-NNN-<slug>.todos.sql` (+ `.done.sql` hook) | `feat/wave-NNN-<slug>-a` |
| **B**  | Build  | The implementation, minimal and conventional | `feat/wave-NNN-<slug>-b` |
| **C**  | Check  | Green tests + `pr` gates + evaluation verdict | `test/wave-NNN-<slug>-c` |
| **D**  | Decide | `## Addendum Wave NNN` in the serving ADR | `docs/wave-NNN-<slug>-d` |
| **E**  | End    | `whw close` (asserts, applies `.done.sql`, audits E) | `docs/wave-NNN-<slug>-e` |

Commits carry the trailer `(Wave NNN L)`, e.g.
`feat(gates): add no-secrets gate (Wave 002 C)`.

## Lifecycle commands

```bash
whw wave new <slug> --adr NNNN   # scaffold seeds (refuses without an ADR)
whw sync <track>                 # load seeds into .whw/state.db
whw queue --track <track>        # A is ready; B–E wait on the chain
whw claim waveNNN-A              # …work…
whw done waveNNN-A --evidence "commit abc, seed reviewed"
# … B, C, D …
whw close wave-NNN-<slug>        # asserts + applies .done.sql + audits E
```

The seed chain is A→B→C→D→E: each letter becomes `ready` only when its
predecessor is `done` (or `cancelled`). Parallel letters are a smell — if B
does not need A, they are two waves.

## Sizing

- One wave = one increment a reviewer can hold in their head. When in doubt,
  split: two small waves beat one medium wave.
- More than five letters of work means more than one wave — charter the next.
- The first wave of a program is documentation-first (charter + seeds); the
  last is the program close (inventory + retrospective).

## States and reversibility

- `pending` → `in_progress` → `done`, with `blocked` (waiting, with reason)
  and `cancelled` (abandoned honestly, with reason) as first-class states.
- `done` is terminal and never downgraded — re-seeding preserves it. To
  revisit shipped work, charter a new wave that cites the old one.
- `blocked` must name the cause and the smallest unblock action; it is a
  signal, not a parking lot.

## Anti-patterns

| Smell | Fix |
| ----- | --- |
| Letters B–E all `ready` at once | The seed chain was edited — restore A→B→C→D→E |
| Wave open for weeks | Split the remainder into a new wave; close this one |
| "Done" without evidence | Reopen the letter (via a new wave) — evidence is the done |
| Code in PR A, planning in PR B | Letters are ordered; keep each letter's scope |
