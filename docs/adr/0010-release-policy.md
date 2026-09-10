# ADR 0010 — Release policy

- **Status:** Proposed
- **Date:** 2026-09-10
- **Wave:** 007
- **Related:** WHY.md, [0009](0009-program-002.md)

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
| Branch protection | `main` requires the `ci` check; no force-push |
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

<!-- Addenda: append `## Addendum Wave NNN — <topic>` per wave D, newest last. -->
