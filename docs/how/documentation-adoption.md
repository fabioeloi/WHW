# Documentation adoption — wave 018

## Gap inventory and editorial map

| Gap | Delivery | Verification |
| --- | --- | --- |
| Candidate release wording, outdated roadmap | Both READMEs, plan, security | Registry and immutable release evidence |
| Consumer examples use checkout CLI / wrong ADR | Both READMEs, pt-BR quickstart | Fresh public-package replay |
| Unequal languages, no adoption navigation | docs index, pt-BR journey | Commands, warnings and capabilities parity |
| Broad tool/agent promises | Compatibility and evidence tables | Adapter code, runner configuration, public proofs |
| Unsupported peer comparisons | Positioning with primary sources | Dated source and claim audit |
| Narrow existing link gate | Full changed-document link/anchor audit | Verification report |

## Bilingual structure

Both READMEs: introduction, value, audience, quickstart, architecture,
A–E loop, continuity, compatibility, evidence and limits, documentation,
roadmap and contribution. Use identical CLI identifiers and equivalent
warnings. pt-BR journey: overview/index, quickstart, concepts, operations,
security and troubleshooting. References explicitly identify English.

Glossary: wave = onda; gate = verificação (gate); runner = executor (runner);
claim = assumir uma tarefa; evidence = evidência; handoff = transferência;
staging = preparação para aprovação. Keep command names unchanged.

## Acceptance protocol

Replay init, program/wave generation, sync, queue, claim, done with reproducible
evidence, gates and resume using `npx @fabioeloi/whw@0.2.0` in a temporary Git
repository. Inspect GitHub-rendered English/pt-BR READMEs and Mermaid flows.
Audit changed local links and anchors, external references, language parity
and capability boundaries independently of the existing gate. Run npm test
and PR/ops gates for each merge. Record C evidence in a verification report.

No npm publication: GitHub documentation updates precede the next package
release. Preserve operator assistance and dispatch provenance limitations
from the existing runner and staged-release proofs.
