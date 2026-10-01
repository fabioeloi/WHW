# Wave 016 — program close protocol

Charter: [ADR 0013](../adr/0013-program-trust-adoption.md), waves 012–016.
Wave 015 E merged in [#51](https://github.com/fabioeloi/WHW/pull/51),
`4c63930`; main CI 36856221566 passed. No wave 017 is authorized here.

## B — prepare the candidate

Set package version to 0.2.0, move release changes into the dated 0.2.0
CHANGELOG section, add discovery/metrics and gated resume/consumer proof
entries, and keep Unreleased empty. Update README release context without
claiming that a pending package is already published.

Correct evidence-quality recognition of the documented source CLI command
`node ./bin/whw.js gate run --tier pr`. The Wave 014 A evidence already
contains that real command, but the current regex only recognizes `whw gate`.
Add focused positive/negative coverage; do not rewrite terminal evidence or
accept arbitrary notes/placeholders. The independent actual PR #42 and SHA
remain noted on A. This is an inventory-validation bug fix within this close.

Verify maintenance commits `2d6387a`, `769dda9`, `18f6e5c`, `348a3fc`,
`0eaeca7` from Git, then list them in the ADR 0012 close-hygiene addendum.
No tag, publish or token revocation occurs in B.

## C/D/E — audit, decide, close

C runs configured Phase A and rubric, doctor, PR and ops gates, program
inventory and a metrics snapshot. Inspect npm pack contents without
publishing; verify release notes come from the 0.2.0 CHANGELOG section.
D accepts ADR 0013's delivered engineering decisions and records the
retrospective with explicit operator-assisted runner and local consumer
qualifications. Publication evidence remains pending until observed.

E closes canonically, reruns inventory and metrics, publishes and integrates
the close PR on green gates, and awaits green main. Only then prepare the
exact v0.2.0 tag target for operator confirmation required by the charter.
Observe OIDC publishing and GitHub notes before marking publication criteria
met; revoke NPM_TOKEN only after proven OIDC publish and authorized removal.
No unverified registry, publisher configuration or credential claim is allowed.
