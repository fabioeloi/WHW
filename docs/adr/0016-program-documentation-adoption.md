# ADR 0016 — Program: Documentation and adoption

<!-- whw:program slug="documentation-adoption" waves="018-018" -->

- **Status:** Proposed
- **Date:** 2026-10-01
- **Waves:** 018–018
- **Related:** [WHY.md](../../WHY.md)

## Context

WHY commits WHW to portable, evidence-gated delivery. The public documentation
still describes 0.2.0 as a candidate and includes checkout-only commands in
consumer examples. Developers and technical leaders need a verified adoption
path in English and Brazilian Portuguese. FORGE supplies a visual reference,
not evidence of WHW capabilities. Market positioning uses sources published
through 2026-09-30; release facts are recorded with their actual dates.

## Decision proposed

English remains canonical. Provide equivalent READMEs and a complete pt-BR
adoption journey, with explicitly English technical references. Separate
available adapters, configured runners, verified scenarios and future work.
Use a sober centered header, verifiable badges, navigation, two Mermaid
flows and concise tables. Every capability claim needs implementation or
public proof; external research remains external research.

## Explicit exclusions

No API, runtime, dependency, npm version, tag, website or campaign changes.
Do not republish 0.2.0 or translate historical ADRs. Do not promise complete
autonomy, financial savings, enterprise compliance or benchmark gains.
No wave 019 without a new charter ADR.

## Wave map

| Wave | Slug | ADR |
| --- | --- | --- |
| 018 | documentation-adoption | 0016 |

## Execution

A charter, SQL seeds and editorial map; B documentation; C independent
consumer replay, links, parity, claims and GitHub rendering; D accepted
ADR with evidence and limits; E metrics and canonical close. Each letter
is a separate PR. PR and ops gates, tests and CI must pass before merge;
main must be green before the next letter.

## Close criteria

- [ ] Equivalent English/pt-BR READMEs and complete adoption journey
- [ ] Public 0.2.0 examples replayed in a fresh temporary repository
- [ ] Changed links/anchors, GitHub diagrams, parity and claims reviewed
- [ ] A–E integrated; SQL evidence recorded; wave closed; main green
- [ ] Metrics and PR/ops gates recorded

## References

- [Editorial map](../how/documentation-adoption.md)
- [FORGE](https://github.com/fabioeloi/FORGE)
- [Atlassian: The Agentic Pivot](https://www.atlassian.com/blog/company-news/the-agentic-pivot)
- [Gartner: Coding Harness](https://www.gartner.com/en/documents/8399181) — public abstract only
- [Beyond the Model](https://arxiv.org/abs/2609.32459) — external research
