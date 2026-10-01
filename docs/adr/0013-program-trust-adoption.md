# ADR 0013 — Program: Trust & Adoption

<!-- whw:program slug="trust-adoption" waves="012-016" -->

- **Status:** Proposed
- **Date:** 2026-09-10
- **Waves:** 012–016 (5 waves)
- **Related:** WHY.md, [0009](0009-program-002.md), [0010](0010-release-policy.md), [0011](0011-derived-state.md), [0012](0012-maintenance-policy.md), [0014](0014-trusted-publish.md)

> Keep the `whw:program` marker intact — `whw gate run program-inventory`
> reads it. There is **no wave 017** in this program: extension requires
> a new charter ADR.

## Context

Program 002 (waves 007–011) closed on 2026-09-10. A plan × implementation
review plus today's first npm publish found the *surface* of 007–011 in git
and `@fabioeloi/whw@0.1.1` on the registry, but new dogfood gaps in how WHW
treats itself: the 0.1.1 tarball ships features CHANGELOG still calls
Unreleased; `release.yml` writes GitHub notes from the PR list, not CHANGELOG
(ADR 0010); publish rides a bypass-2FA `NPM_TOKEN` npm is deprecating; ADR
0012 does not cover Dependabot; `whw run` was proven only with stubs;
checkpoint `latest.txt` timestamps dirty every PR; the consumer
`npx @fabioeloi/whw init` path was never executed end-to-end.

ADR 0012 requires a charter (or a wave in the active program) within one
working day of `chore(maint)` so the exception does not become the path.
Five post-close commits landed today (`2d6387a`, `769dda9`, `18f6e5c`,
`348a3fc`, `0eaeca7`). This program is that charter.

Outcome: strangers can trust `npx @fabioeloi/whw@latest`, CHANGELOG matches
the tarball, publish is OIDC, Dependabot is inside the maintenance policy,
and WHW has proven a real runner plus a fresh-repo consumer. Ships **v0.2.0**
at close (semver minor: `resume`, hooks, and the 008–011 gates are features
already in 0.1.1's tarball). `main` is green at `bf1f149`.

## Explicit exclusions

Deferred fronts stay OUT until a new ADR reopens them:

| Front | Reason | Revisit in |
| ----- | ------ | ---------- |
| `whw serve` (HTTP queue API) | Needs auth design; not required for trust | Next program |
| Live PostgreSQL adapter | Schema ships; no proven consumer | On first request |
| `whw migrate` importers | No validated source formats | On demand |
| `whw board` / `in_review` status | Kanban view is a later UX layer | Later |
| Multi-track dependency visualization | Nice-to-have after trust | Later |
| Translations beyond pt-BR | Cost without readers | On demand |
| Re-tag / rewrite of v0.1.1 | Honest history; fold CHANGELOG under `[0.1.1]` with a note; next tag is **v0.2.0** | Never |
| More `chore(maint)` as the delivery path | That is the hole this charter closes | Never |

## Wave map

| Wave | Slug | ADR |
| ---- | ---- | --- |
| 012 | release-truth | [0010](0010-release-policy.md) + [0011](0011-derived-state.md) addenda |
| 013 | trusted-publish | [0014](0014-trusted-publish.md) |
| 014 | runner-proof-real | [0013](0013-program-trust-adoption.md) |
| 015 | consumer-proof | [0013](0013-program-trust-adoption.md) |
| 016 | program-close | [0013](0013-program-trust-adoption.md) |

Waves 012–015 build; 016 closes (inventory + metrics + retrospective +
`v0.2.0`). Thematic ADR 0014 is Proposed until wave 013 D. Waves 012 D
addenda land on 0010 and 0011.

## Execution

- One wave = PRs A–E (plan → build → verify → decide → close); a wave is done
  only when **E** merges. **Real PRs against `origin`**, branch
  `feat/wave-NNN-<slug>-<letter>` (docs/test/chore as the type requires).
- First wave (012 A) is documentation-first: this charter + planning seeds +
  `docs/plan.md`. Implementation (012 B) waits on an explicit operator go.
- Final wave is the program close: inventory gate + retrospective addendum +
  operator-confirmed `v0.2.0` tag (OIDC publish is the 013 proof).
- Do not start the next wave until `main` is green.
- Branch/commit conventions: `docs/how/conventions.md`.
- Historic evidence strings are **not rewritten** (`done` is terminal). Retro
  findings land as `whw note` (wave007-B: PR #2 superseded by #3).
- CHANGELOG is folded into `[0.1.1]` with a lag note; no 0.1.2, no re-tag.
- Trusted publishing replaces `NPM_TOKEN`; the token is revoked only after
  016's OIDC publish succeeds.
- Confirm at 014 A which agent CLI is installed for the real runner proof.

## Close criteria

- [ ] Every wave 012–016 closed via `whw close`
- [ ] `whw gate run program-inventory` GO
- [ ] `whw metrics --out .whw/metrics.json` recorded and linked below
- [ ] `@fabioeloi/whw@0.2.0` on npm via OIDC (no `NODE_AUTH_TOKEN` in
      `release.yml`); GitHub Release notes match CHANGELOG
- [ ] ADR 0014 Accepted; ADR 0012 addendum covers Dependabot
- [ ] ADR 0012 close-hygiene lists maint SHAs `2d6387a`, `769dda9`,
      `18f6e5c`, `348a3fc`, `0eaeca7`

## References

- Review: `.cursor/plans/whw_review_and_program_003_cdac715f.plan.md`
- Program 002 charter: [0009](0009-program-002.md)
- Public repo: https://github.com/fabioeloi/WHW
- npm: https://www.npmjs.com/package/@fabioeloi/whw
- Release: https://github.com/fabioeloi/WHW/releases/tag/v0.1.1

## Addendum Wave 012 — release-truth

Thematic decisions landed on [0010](0010-release-policy.md) (CHANGELOG notes,
`release-readiness` rules) and [0011](0011-derived-state.md) (deterministic
`latest.txt`, gitignored evaluation report). Wave 012 A–C: PRs
[#32](https://github.com/fabioeloi/WHW/pull/32),
[#33](https://github.com/fabioeloi/WHW/pull/33),
[#34](https://github.com/fabioeloi/WHW/pull/34). This letter records the
contract; close is 012 E. Next: 013 trusted-publish.

## Addendum Wave 013 — trusted-publish

Thematic decisions on [0014](0014-trusted-publish.md) (OIDC publish path,
`maint-audit`) and [0012](0012-maintenance-policy.md) (Dependabot as maint).
Wave 013 A–C: PRs
[#37](https://github.com/fabioeloi/WHW/pull/37),
[#38](https://github.com/fabioeloi/WHW/pull/38),
[#39](https://github.com/fabioeloi/WHW/pull/39). ADR 0014 Accepted at D.
OIDC proof and token revocation at 016 / `v0.2.0`. Next: 014 runner-proof-real.

## Wave 014 planning contract (A)

On 2026-10-01, Codex CLI 0.156.0 was observed on PATH with ChatGPT login;
Node 24.5.0 and builtin SQLite passed doctor. The proof selects the
operator-requested `gpt-6.1-sol` with `low` reasoning. Authentication is
not inference proof. [Protocol](../how/runner-proof-real.md) defines an
isolated fresh-session run at B, one attempt, external 20-minute deadline,
read-only runner discovery, additive costClass metrics and module tests.
Success requires independent SQL/evidence, diff, tests and gates, beyond
process exit zero. B waits for A merge, green main and implementation go.
No new dependencies, CLM benchmark or persistence-policy changes are
included. Acceptance and the sanitized real-run outcome belong at D.
Planning delivery: [#42](https://github.com/fabioeloi/WHW/pull/42).

<!-- Addenda: append `## Addendum Wave NNN — <topic>` per wave D, newest last. -->

## Addendum Wave 014 — real runner proof with operator assistance

Decision (2026-10-01): accept the shipped runner discovery, additive
attempt metrics and module coverage, and retain the real run as
**operator-assisted proof**. Do not describe it as autonomous task delivery.
The independent [verification](../how/runner-proof-verification.md) passed
78 tests, PR gates and Phase A; Phase B approved at 3.783 (4/4/4/3).

The initially selected PATH executable was Codex CLI 0.156.0. Its real
attempt rejected `gpt-6.1-sol` with HTTP 400. After the operator-authorized
CLI update, version 0.159.3 accepted the same requested model and `low`
reasoning with the existing login. No model fallback was used.

Sanitized outcome tail (abridged metadata, not a verbatim transcript):

```text
CLI=codex 0.156.0 model=gpt-6.1-sol effort=low costClass=closed
exit=1 durationMs=7375
outcome=HTTP 400 model rejection; no implementation

CLI=codex 0.159.3 model=gpt-6.1-sol effort=low costClass=closed
exit=0 durationMs=308271
outcome=code produced; sandbox blocked Git write; no builder commit/done
completion=operator-assisted review, commit and live SQL evidence
```

Both attempts total 315646 ms. The second supervisor completed within the
20-minute deadline (308336 ms, no timeout). The public
[fixture](../../tests/fixtures/runner-proof/attempts.json) and
[replay test](../../tests/unit/runner-proof.test.js) preserve the distinction
between process success and task completion. Raw local transcripts stay
under ignored `.whw/runs/`; no credentials or full transcripts are published.

Consequences: `src/run.js` still trusts exit zero, so callers must independently
check Git, SQL evidence, tests and gates. Autonomous Git/SQL completion in
the managed sandbox remains unproven; changing runner completion policy
requires a separately chartered scope. Configured model and costClass are
metadata, not backend attestation; billed USD is unknown. No CLM benchmark,
new runtime dependency, release, tag or token revocation belongs to this wave.

Evidence: A [#42](https://github.com/fabioeloi/WHW/pull/42),
B [#43](https://github.com/fabioeloi/WHW/pull/43) (implementation `4763c85`,
merged `5437284`), C [#44](https://github.com/fabioeloi/WHW/pull/44)
(verification `8da5191`, merged `cdd2cf4`; main CI 36843465872 green).
The program charter remains Proposed until Wave 016 D. Next: canonical
Wave 014 E close after this addendum merges and main is green.
