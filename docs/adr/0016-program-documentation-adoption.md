# ADR 0016 — Program: Documentation and adoption

<!-- whw:program slug="documentation-adoption" waves="018-018" -->

- **Status:** Accepted
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

## Decision

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


## Addendum Wave 018 — documentation adoption

2026-10-01. Accepted after A [#62](https://github.com/fabioeloi/WHW/pull/62),
B [#63](https://github.com/fabioeloi/WHW/pull/63) and C
[#64](https://github.com/fabioeloi/WHW/pull/64) integrated with green CI.
C main CI 36880408698 passed before this decision.

Equivalent READMEs, the documentation index and six-file pt-BR adoption
journey implement the scoped decision. English remains canonical; historical
ADRs are not translated. The public-package replay confirms ADR 0001 / wave
001 in a new repository and distinguishes scaffolding from CLI installation.
Only planning A is completed by the quickstart; close still requires A–D,
an addendum and gates. GitHub documentation precedes the next npm release.

Evidence: [verification report](../how/documentation-adoption-verification.md),
[replay](../how/documentation-adoption-replay.sh) and
[link audit](../how/documentation-adoption-links.py). C recorded 81 passing
tests, ten GO gates, 196 B-scope local targets without errors, reviewed
GitHub-rendered diagrams and four identical shell blocks. Automation received
403 from Gartner/npm web pages; public abstract/registry checks supplement
that result without bypassing security controls.

Sources are dated in [positioning](../why/positioning.md): Atlassian September
3, Gartner public abstract September 18, Beyond the Model v1 September 26.
They motivate context/governance/verification messaging; none evaluates WHW.
FORGE informs presentation only. October 1 release facts are separate from
the September 30 market-source cutoff.

Preserved limits: the real Codex run needed operator Git/SQL finalization;
requested model metadata is not backend attestation. Dispatch recovery
provenance identifies workflow main; independent bytes establish tag contents.
No benchmark, savings, compliance, universal tool compatibility or complete
autonomy claim. Gates alone do not cover all editorial links. B's fresh-CI
false positive was fixed through equivalent multiline commands, not a product
change. No API, runtime, dependency, package version, tag or publication change.

E must record metrics, canonical SQL close and final green integration.
Any wave 019 requires a new charter; proposed runner/context work stays deferred.
