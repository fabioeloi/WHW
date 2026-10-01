# Documentation release — wave 019

Distribute wave 018's documentation through patch 0.2.1. Keep pinned 0.2.0
adoption examples as verified reproducible examples; distinguish them from
the new release's package version. No runtime changes are intended.

## A–E contract

| Letter | Delivery | Acceptance |
| --- | --- | --- |
| A | ADR 0017, SQL, release protocol | Version scope and human approval boundary |
| B | 0.2.1 metadata/changelog; include security policy | Pack inspection, tests, gates, green integration |
| C | Independent package smoke test and live tag-triggered staging | Exact source target, tarball/provenance review, Safari approval and public registry proof |
| D | Accepted ADR evidence and limits | Separate observed publication from future guarantees |
| E | Close, plan links and metrics | A–D merged, canonical close, green E/main |

## Artifact review

Use `npm pack --json --pack-destination` in a temporary directory. Confirm
README, README.pt-BR, docs index, all six pt-BR guides and SECURITY.md are in
the tarball; inspect package identity/version, executable bin and absence of
credentials/private data. Smoke-test the extracted CLI in a disposable consumer
with init, program/wave, sync, queue and PR gates. Compare src/bin/sql against
0.2.0 to separate earlier fixes already present in the immutable source from
any new changes; this patch must not change runtime behavior.

After B integration and green main, record the exact full SHA, create immutable
v0.2.1 and push it. Tag-triggered release.yml runs verification, GitHub Release
and npm stage publish through OIDC. Dispatch remains reserved for original
0.2.0 recovery; do not dispatch it to publish 0.2.1.

Inspect the stage in Safari. Download/review exact tarball, check pack/source
contents and attestation's workflow/tag/source identity before approval. Request
operator passkey/Touch ID interaction if prompted, without asking for codes.
After approval check registry latest/version/hash, signatures/provenance and
`npx @fabioeloi/whw@0.2.1 --version`; compare release notes with tagged CHANGELOG.
If access or approval blocks verification, record `whw block wave019-C` and
preserve the stage. C cannot be done merely because CI staged a package.
