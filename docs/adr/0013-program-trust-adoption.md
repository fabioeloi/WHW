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

<!-- Addenda: append `## Addendum Wave NNN — <topic>` per wave D, newest last. -->
