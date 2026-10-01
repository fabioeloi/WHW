# Positioning — September 2026

WHW organizes work for humans and coding agents through purpose, decisions,
SQL execution state and rerunnable evidence. The audience is developers and
technical leaders who need continuity and reviewable delivery.

## External context (publication cutoff: 2026-09-30)

| Primary source | Date | Relevant observation | Boundary |
| --- | --- | --- | --- |
| [Atlassian: The Agentic Pivot](https://www.atlassian.com/blog/company-news/the-agentic-pivot) | 2026-09-03 | Delivery needs context, a system of record and accountability around code | Vendor research; its survey results are not WHW outcomes |
| [Gartner: Build the AI Coding Harness](https://www.gartner.com/en/documents/8399181) | 2026-09-18 | Public abstract emphasizes context, controls and verification | Only the public abstract was consulted; no claim about the full paid report |
| [Beyond the Model](https://arxiv.org/abs/2609.32459v1) | 2026-09-26 | Harness effects depend on model and task; components can help or hurt | External empirical study; WHW was not evaluated |

Our inference from these sources: durable context and explicit verification
are useful adoption messages. They motivate evaluation of WHW; they do not
prove a performance improvement. No external percentages are transferred to
WHW, and no endorsement by these organizations is implied.

## Concrete adoption cases

| Need | WHW mechanism | Implementation / proof |
| --- | --- | --- |
| Resume interrupted work | Git baseline, SQL queue and PR gates | [Resume implementation](../../src/resume.js), [consumer proof](../how/consumer-proof-verification.md) |
| Change tools | Canonical instruction files and handoff package | [Adapters](../what/adapters.md), [handoff implementation](../../src/handoff.js) |
| Trace a decision | WHY → charter ADR → wave → evidence | [Programs](../how/programs.md), [this project's ADRs](../adr/) |
| Review delivery | Independent checks, gate checkpoints and recorded evidence | [Gates](../how/gates.md), [evidence](../how/evidence.md) |

The SQL database is local execution state, not a hosted multi-user coordination
service. Files carry process context, not private conversations or a model's
hidden state. Tool pointers do not prove successful inference with every tool.

## Presentation reference

[FORGE](https://github.com/fabioeloi/FORGE) supplies the author's reference
for centered headings, badges, navigation, Mermaid and tables. WHW adopts
that presentation vocabulary with claims grounded in its own implementation.
This is not a runtime integration, feature comparison or superiority claim.
No unsupported rankings of peer projects are retained.

## Proof and proposals

The [operator-assisted runner proof](../how/runner-proof-real.md) demonstrates
reviewed implementation with human Git/SQL finalization after a sandbox block.
The [staged-release proof](../how/staged-release-verification.md) records
publication on 2026-10-01, outside the market-source cutoff: OIDC staging and
human approval, with the dispatch provenance limitation stated explicitly.

Stronger context persistence, generic runner postconditions and additional
platform/model proofs require new charters and acceptance criteria. WHW does
not claim complete autonomy, financial savings, enterprise compliance or
measured benchmark gains. It provides process contracts whose effectiveness
must be assessed against the adopting project's requirements.
