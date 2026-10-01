# ADR 0015 — Program: Secure Release

<!-- whw:program slug="secure-release" waves="017-017" -->

- **Status:** Accepted
- **Date:** 2026-10-01
- **Waves:** 017–017
- **Related:** WHY.md, [0013](0013-program-trust-adoption.md), [0014](0014-trusted-publish.md)

## Context

WHY.md requires reproducible, evidence-gated delivery. Program 003 closed its
engineering scope, but npm publication of 0.2.0 remains unproven. Tag v0.2.0
points to 92f6d70a21dac2c259133bc6b76f20e0376c210e; its GitHub Release exists.
Run 36858567547 failed npm publish with E404. Safari settings showed no trusted
publisher. The operator requested staged publishing after reviewing npm's
warning about direct publishing access.

OIDC removes long-lived credentials; staging adds human presence before a
version goes live. Automation must not possess direct publish or dist-tag
permissions. An approved staging job is not evidence of public publication.

## Wave map

| Wave | Slug | ADR |
| --- | --- | --- |
| 017 | staged-release | 0015 |

No wave 018 belongs to this program; extension requires another charter.

## Decision proposed

- Keep release.yml as the authorized OIDC workflow; replace direct publication
  with staging using an explicitly selected npm version supporting npm stage.
- Add workflow_dispatch recovery for v0.2.0, validating the exact existing tag
  SHA, package name/version and release readiness. Never move or recreate tags.
- Use the same validation path for future tag-triggered releases. Separate
  GitHub Release creation from recovery so an existing release is not recreated.
- Restrict workflow permissions to contents:read except the GitHub Release job,
  and id-token:write only on the staging job. No NODE_AUTH_TOKEN fallback.
- npm connection: fabioeloi/WHW, release.yml, no environment, both optional
  actions unchecked. Creation requires operator confirmation and interactive 2FA.
- Review the staged tarball, provenance, commit and gates; operator approves
  with a passkey in Safari. Verify registry version, integrity and release notes
  after approval. Revoke identified legacy credentials only after proven success
  and explicit confirmation for irreversible deletion.

## Execution

One wave has PRs A–E. A charters and seeds; B implements workflow and runbook;
C verifies negative recovery cases and observes staging/publication separately;
D accepts or rejects based on evidence; E closes only after accepted proof.
User's proceed authorizes this scope; A merges on green gates before B starts.
Existing done evidence is terminal; append retrospective notes instead.

## Exclusions

No runtime dependencies, version bump, retagging, historical evidence rewrite,
automated approval, credential creation, or unrelated security redesign.

## Close criteria

- [ ] Workflow stages with OIDC and cannot publish directly through its npm grant
- [ ] Recovery stages the immutable v0.2.0 source; operator approval publishes it
- [ ] Registry, integrity, provenance and CHANGELOG notes independently verified
- [ ] Legacy credential disposition recorded without exposing secret values
- [ ] A–E merged, PR gates GO, inventory GO and metrics recorded

## References

- https://docs.npmjs.com/staged-publishing/
- https://docs.npmjs.com/trusted-publishers/
- https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/
- https://github.com/fabioeloi/WHW/actions/runs/36858567547

<!-- Addenda: append per wave D. -->

## Addendum Wave 017 — staged publication accepted

Accepted 2026-10-01. A [#57](https://github.com/fabioeloi/WHW/pull/57),
B [#58](https://github.com/fabioeloi/WHW/pull/58), C
[#59](https://github.com/fabioeloi/WHW/pull/59) merged with green CI.
[Verification](../how/staged-release-verification.md) records 81 passing
tests, guarded recovery, stage-only OIDC, operator passkey approval, byte
identity to v0.2.0, public latest=0.2.0 and verified signature/attestation.
The recovery attestation identifies workflow main; the independent file
comparison establishes tag contents. Future tag-triggered execution remains
untested live. No claim of automated approval or tag-only attestation is made.

Safari confirmed package protection requiring 2FA and disallowing bypass
tokens. After explicit operator authorization, the GitHub NPM_TOKEN secret
was deleted; the secret inventory is empty. npm's token inventory showed one
legacy WHW_init token, already expired on 2026-09-17, and no active tokens.
An expired token was not newly revoked; its inactive disposition is recorded.
The temporary inspection CLI session was logged out. No credential values
were retained in evidence. No deletion of the expired npm history was needed.

The 016 publication criterion is now satisfied via recovery staging plus
operator approval; its terminal SQL evidence is supplemented by notes.
E will record inventory/metrics and close the wave, without retagging.
