# ADRs

Architecture Decision Records are WHW's durable memory: why the system looks
the way it does. Code shows what is; ADRs show what was considered and why
this won.

## Format

`whw adr new <slug>` writes `docs/adr/NNNN-<slug>.md` (numbers global,
zero-padded, never reused):

```md
# ADR NNNN — Title

- **Status:** Proposed | Accepted | Rejected | Superseded by NNNN
- **Date:** YYYY-MM-DD
- **Wave:** first implementing wave (or TBD)
- **Related:** links

## Context
## Decision (rules table for contracts; options table for choices)
## Consequences (Positive + Negative/trade-offs)
## References
## Addendum Wave MMM — <topic> (per wave D, newest last)
```

One decision per ADR. Cross-link liberally. Record rejected options with
reasons — the options table is the point.

## Lifecycle

- **Proposed** — written, awaiting its first wave.
- **Accepted** — first wave landed; the decision is live.
- **Rejected** — decided against; no wave may cite it.
- **Superseded by NNNN** — replaced; the new ADR cites the old one.

Status flips happen in wave D letters with an addendum explaining the change.
History is appended, never rewritten.

## Addenda (wave D)

Each implementing wave appends exactly one addendum to its serving ADR:

```md
## Addendum Wave 003 — <topic>

Shipped: <scope>. Evidence: <commits/PRs/checkpoints>. Follow-ups: <…>.
```

The `wave-sync` gate requires closed waves to have an addendum naming the
wave number. The addendum is where "we decided X, then learned Y" lives —
the narrative no diff can carry.

## Program charters vs. thematic ADRs

- **Charter** (`NNNN-program-<slug>.md`): outcome, exclusions, wave map,
  close criteria. Written by `whw program new`.
- **Thematic**: one decision each, created in waves B–D as the program learns.
  The charter's wave map records the pairing.

## When to write one

Anything consequential, hard to reverse, or likely to be questioned later:
stack and schema choices, API contracts, process rules, scope cuts, security
boundaries, program charters. Trivia (naming, formatting) belongs in
`AGENTS.md`, not in an ADR.
