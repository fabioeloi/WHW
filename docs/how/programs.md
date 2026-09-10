# Programs

A **program** is a bounded set of waves chartered by an ADR: it names the
outcome, the wave map, what is explicitly excluded, and how it closes.
Programs turn roadmaps into contracts.

## Charter anatomy

`whw program new <slug> --waves N` writes `docs/adr/NNNN-program-<slug>.md`:

- **Context** — why the program exists, what outcome closes it.
- **Explicit exclusions** — deferred fronts (P0/P2) with reasons and a revisit
  rule. PRs reopening these are rejected until a new ADR says otherwise.
- **Wave map** — wave → slug → thematic ADR, filled as waves are chartered.
- **Execution rules** — A–E rhythm, doc-first wave 1, close wave N, green-main rule.
- **Close criteria** — all waves closed, inventory gate GO, metrics snapshot.
- **Machine marker** — `<!-- whw:program slug="…" waves="AAA-BBB" -->`, which
  the `program-inventory` gate reads. Keep it intact.

## The boundary rule

> There is no wave BBB+1 in this program — extension requires a new charter ADR.

Waves are numbered globally and sequentially. When a program's range is
exhausted, the next work charters a successor program (a new ADR citing the
old one), it does not "extend" the range. This is enforced, not suggested:
`program-inventory` fails waves outside every chartered range.

## Thematic ADRs

The charter is wave 1's deliverable. Waves 2+ typically introduce focused
**thematic ADRs** (one decision each) in their B–D letters; implementation
waves cite them. The charter's wave map records which wave serves which ADR,
so the decision trail reads forward (charter → themes → waves) and backward
(wave → ADR → WHY).

## Closing a program

The close wave (last in range) is a normal wave whose B letter runs the
inventory work and whose D letter writes the retrospective addendum:

1. `whw close wave-BBB-<slug>` for the final wave.
2. `whw gate run program-inventory` — asserts every wave in range has its
   seeds, done hooks, and terminal todos (only enforced once the close wave's
   E is done; open programs get range checks only).
3. `whw metrics --out .whw/metrics.json` — snapshot linked from the addendum.

## Sizing and cadence

- 3–8 waves per program is the sweet spot. One wave needs no program (the
  inventory gate passes vacuously with no charters); ten waves need two programs.
- Charter one program ahead at most. Charters describe committed work, not dreams.
- Exclusions are reviewed at every program close: revisit, re-defer with a new
  reason, or promote into the next charter.
