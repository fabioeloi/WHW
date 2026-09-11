# ADR 0014 — Trusted publishing (OIDC)

- **Status:** Proposed
- **Date:** 2026-09-10
- **Wave:** 013
- **Related:** WHY.md, [0010](0010-release-policy.md), [0012](0012-maintenance-policy.md), [0013](0013-program-trust-adoption.md)

## Context

`@fabioeloi/whw@0.1.1` published from GitHub Actions with
`npm publish --access public --provenance` and `NODE_AUTH_TOKEN` from repo
secret `NPM_TOKEN`. The first attempt failed `EOTP` (token required a
one-time password). The operator replaced it with a bypass-2FA automation
token. npm is restricting those tokens for account changes now and will
remove direct publish from them around January 2027. Trusted publishing
(OIDC) is available because the package already exists. The workflow already
sets `id-token: write`.

ADR 0012's maint exception requires an open GitHub issue labeled `maint`.
Dependabot PRs [#5](https://github.com/fabioeloi/WHW/pull/5) and
[#6](https://github.com/fabioeloi/WHW/pull/6) merged as `chore(deps)` with
the `maint` *label* on the PR, not an issue — a hole the 013 addendum to
0012 must close.

## Decision

Proposed (Accepted at wave 013 D):

| Rule | Detail |
| ---- | ------ |
| Identity | GitHub Actions OIDC is the only publish identity. Configure npm trusted publisher with the 013 A field table below. Drop `NODE_AUTH_TOKEN` from the npm job |
| Tokens | After the first successful OIDC publish (wave 016 / `v0.2.0`), revoke the automation token and set the package to require 2FA and disallow tokens |
| Provenance | Keep `--provenance` (or npm's default under trusted publishing) |
| Maint / Dependabot | `chore(deps)` from Dependabot is maint when the PR carries label `maint`, one dependency per PR, and the matrix is green. An `ops` `maint-audit` gate lists non-trailer commits since the last program close |
| Proof | Wave 013 ships the workflow + docs; wave 016's `v0.2.0` tag is the OIDC proof. Do not revoke `NPM_TOKEN` before that publish succeeds |

### Options considered

| Option | Upside | Downside |
| ------ | ------ | -------- |
| Keep bypass-2FA token | Already works | Deprecated path; stolen token publishes forever |
| Staged publish + human 2FA | Extra review | Blocks unattended tag→npm, fights ADR 0010's CI publish |
| Trusted publishing / OIDC (chosen) | Short-lived, workflow-bound, provenance | First OIDC publish waits on 016; npm UI must match filename `release.yml` exactly; new publishers after 2026-09-03 default to stage-only |

## Consequences

### Positive

- Publish identity matches "evidence over chat": the workflow file is the
  credential.
- Dependabot stops looking like process debt.

### Negative / trade-offs

- Two-step proof (013 config, 016 publish) means `NPM_TOKEN` stays until 016 E.
- npm does not verify the trusted-publisher form at save time; a typo only
  fails at tag.

## Confirmed at Wave 013 A

npm trusted publisher form for `@fabioeloi/whw` (Settings → Trusted
publishing → GitHub Actions). All fields are case-sensitive; npm does **not**
validate them until publish. Filename is **not** a path.

| Field | Value |
| ----- | ----- |
| Organization or user | `fabioeloi` |
| Repository | `WHW` |
| Workflow filename | `release.yml` |
| Environment name | *(leave empty — `release.yml` has no `environment:`)* |
| Allowed actions | Must include **`npm publish` (direct)**. After 2026-09-03 new publishers default to `npm stage publish` only; this workflow runs `npm publish`, not `npm stage publish` |

Also confirmed:

- `permissions.id-token: write` is already set on `release.yml`.
- `package.json` `repository.url` is `git+https://github.com/fabioeloi/WHW.git` (must match the GitHub repo).
- Publish job uses GitHub-hosted `ubuntu-latest` + Node **24** (npm CLI ≥ 11.5.1; trusted publishing also wants Node ≥ 22.14 — the job is 24, not the package `engines` floor of 22.13).
- Self-hosted runners are unsupported.
- Operator UI on npmjs.com is required before the first OIDC tag (016). Git cannot create the trusted-publisher row.
- Do **not** set "Require two-factor authentication and disallow tokens" and do **not** revoke `NPM_TOKEN` until 016's OIDC publish succeeds.

`maint-audit` (013 B): `ops` builtin. `git log` since the last **program** close (011 E merge `3e1563c`, then 016 E). NO_GO when a commit subject lacks `(Wave NNN L)` unless it is `chore(deps)` (Dependabot, one dep, `maint` label) or `chore(maint)`.

## References

- [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers/)
- [.github/workflows/release.yml](../../.github/workflows/release.yml)
- [SECURITY.md](../../SECURITY.md)

<!-- Addenda: append `## Addendum Wave NNN — <topic>` per wave D, newest last. -->
