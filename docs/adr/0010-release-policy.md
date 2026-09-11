# ADR 0010 — Release policy

- **Status:** Accepted
- **Date:** 2026-09-10
- **Wave:** 007
- **Related:** WHY.md, [0009](0009-program-002.md), [0013](0013-program-trust-adoption.md)

## Context

README step 1 (`npx @fabioeloi/whw doctor`) and the consumer CI template
(`npx -y @fabioeloi/whw@latest`) fail: the package is unpublished. CHANGELOG
links to `releases/tag/v0.1.0` but no GitHub Release exists. `main` has no
branch protection, Actions pin deprecated Node-20 action runtimes, and the
pt-BR README drifted (no Roadmap). Publishing without a policy will recreate
the "tag exists, install does not" gap.

## Decision

| Rule | Detail |
| ---- | ------ |
| Version | Ship **v0.1.1** for the post-001 CI fix + this program's publish work. Never re-tag v0.1.0 |
| npm | `@fabioeloi/whw` published from CI on tag, with provenance. Confirm credentials at execution time — publish is irreversible |
| GitHub Release | Every `v*` tag gets a Release whose notes match CHANGELOG |
| Workflow | `.github/workflows/release.yml` publishes on tag; Dependabot watches GitHub Actions |
| Branch protection | `main` requires `whw (node 22)` and `whw (node 24)` (the matrix jobs that already exist). Workflow also emits a `ci` aggregator for a future single context. Force-push disabled |
| Actions | Pin `actions/checkout` and `actions/setup-node` to versions that do not target deprecated Node 20 |
| README truth | Quick start must resolve (`npx` or documented git-clone fallback until the first publish lands). Remove the `node_modules/.bin` line. Sync `README.pt-BR.md` Roadmap |
| Topics | Set GitHub topics to match `package.json` keywords (subset) |

### Options considered

| Option | Upside | Downside |
| ------ | ------ | -------- |
| Re-tag v0.1.0 | Looks like the original ship | Rewrites history; npm still empty |
| Manual `npm publish` from a laptop | Fast | No provenance; not dogfood |
| CI publish on tag (chosen) | Repeatable, provenanced, matches "evidence over chat" | Needs npm token / OIDC setup |

## Consequences

### Positive

- A stranger can follow README and get a working CLI.
- Releases are artifacts, not chat claims.

### Negative / trade-offs

- First publish needs operator confirmation (npm 2FA / trusted publishing).
- Branch protection slightly slows hotfix flow — that is the point.

## References

- [CHANGELOG.md](../../CHANGELOG.md)
- [templates/ci-whw.yml](../../templates/ci-whw.yml)

## Addendum Wave 007 — publish-release

Shipped: `.github/workflows/release.yml` (GitHub Release on `v*` tags, then
`npm publish --provenance` if `NPM_TOKEN` is set), Dependabot for Actions,
`actions/checkout@v5` + `actions/setup-node@v5`, clone-first README + pt-BR
Roadmap, package `0.1.1`, GitHub topics, `main` protection (required matrix
checks, no force-push). Evidence: PR #1 (A, merged), PR #3 (B, reopened after
#2's base was deleted), Actions
https://github.com/fabioeloi/WHW/actions/runs/34518046761 green. **npm publish
and tag `v0.1.1` are still blocked on operator confirmation of `NPM_TOKEN`.**
Follow-ups: wave 008 hygiene; tag only after that confirmation.

## Addendum Wave 012 — release-truth

GitHub Release notes now match CHANGELOG: `release.yml` runs
`release-readiness`, then `src/changelog.js` extracts the `## [version]`
section and `gh release create --notes-file` (no `--generate-notes`).
`release-readiness` additionally requires `[Unreleased]` empty when `HEAD`
is tagged `v<version>`, `package.json` `bin` paths without `./`, and
`repository.url` in `git+https://` / `git+ssh://` form. Waves 008–011 were
folded under `[0.1.1]` with a lag note; no re-tag, no 0.1.2; next tag is
**v0.2.0** (016 E). `@fabioeloi/whw@0.1.1` is already on npm. Evidence: PRs
[#32](https://github.com/fabioeloi/WHW/pull/32),
[#33](https://github.com/fabioeloi/WHW/pull/33),
[#34](https://github.com/fabioeloi/WHW/pull/34); `npm test` 60/60;
`whw gate run --tier pr` GO. Follow-up: wave 013 trusted publishing (OIDC).

<!-- Addenda: append `## Addendum Wave NNN — <topic>` per wave D, newest last. -->
