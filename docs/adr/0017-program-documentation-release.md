# ADR 0017 — Program: Documentation package release

<!-- whw:program slug="documentation-release" waves="019-019" -->

- **Status:** Proposed
- **Date:** 2026-10-01
- **Waves:** 019–019
- **Related:** [WHY](../../WHY.md), [ADR 0016](0016-program-documentation-adoption.md)

## Context

Wave 018 delivered verified bilingual documentation on GitHub. The operator
asked to proceed using Safari, continuing the next step of bringing those
documents to npm. A new patch release distributes that documentation without
rewriting immutable 0.2.0. Proposed version: 0.2.1.

## Decision

Charter one wave: A plan/seeds, B package metadata and changelog, C package
verification and release staging/publication verification, D accepted evidence,
E canonical close and metrics. Tests, PR/ops gates and CI must pass before each
merge; main must be green before the next letter. Tag the reviewed green B
integration for C's live release proof, then use the existing tag-triggered
OIDC workflow. Inspect the concrete artifact before npm approval in Safari.
Human passkey interaction remains with the operator. Public registry proof,
not staging job success, is required before completing C.

## Explicit exclusions

No runtime API, dependencies, runner behavior, secret/token creation, publisher
permission expansion, direct npm publish or 0.2.0 tag movement. No wave 020
without a new charter. If staging/approval fails, block C with the concrete
condition; never reject an existing stage automatically or reuse a reserved
version blindly.

## Wave map

| Wave | Slug | ADR |
| --- | --- | --- |
| 019 | documentation-release | 0017 |

## Close criteria

- [ ] Reviewed package includes bilingual adoption documentation and security policy
- [ ] Package metadata/changelog accurately identify 0.2.1 documentation patch
- [ ] Local package contents and smoke tests, PR/ops gates and CI green
- [ ] Tag target and GitHub notes verified; staging artifact reviewed before approval
- [ ] Public npm version, integrity, consumer invocation and provenance verified
- [ ] A–E integrated, evidence recorded and canonical close/main green

## References

- [Release protocol](../how/documentation-release.md)
- [Staging boundary](../how/staged-release.md)
- [Previous publication proof](../how/staged-release-verification.md)
- [Documentation proof](../how/documentation-adoption-verification.md)
