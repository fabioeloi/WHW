# Staged release — Wave 017

ADR 0015 changes the npm boundary: CI may stage; a maintainer approves with
2FA in Safari. A green staging job does not mean the package is public.

## npm connection

Settings for @fabioeloi/whw: GitHub Actions, organization/user fabioeloi,
repository WHW, workflow filename release.yml, environment blank. Leave
Allow npm publish and Allow npm dist-tag unchecked. Set package publishing
access to Require two-factor authentication and disallow bypass 2fa tokens
when the operator approves this security change. Existing tokens are retained
until successful publication is independently verified, then revoked with
operator confirmation. Never copy credentials into issues, logs or evidence.

## Recover 0.2.0

After the workflow merges and main is green, dispatch release.yml on main:

```sh
gh workflow run release.yml --ref main
```

Dispatch has no arbitrary source input. It resolves only refs/tags/v0.2.0,
requires commit 92f6d70a21dac2c259133bc6b76f20e0376c210e, and validates package
name/version. It verifies the original source and stages it with npm 12.1.0.
The existing GitHub Release is skipped. Do not rerun the old direct-publish job
or move the tag. Future stable tag pushes use the same staging boundary.

## Review and approve

In npm Staged Packages inspect @fabioeloi/whw@0.2.0 and its latest tag.
Download the staged tarball for inspection; compare its contents, integrity,
version and provenance against the workflow's verified source and pack record.
OIDC credentials cannot list/download/approve staged packages: use the
maintainer's interactive npm session. Approval requires 2FA, using the passkey
in Safari. Record the stage ID and approval outcome without recording codes.

After approval, verify registry version, tarball integrity and provenance;
compare GitHub Release notes with CHANGELOG at the immutable tag. Record
results with whw note wave017-C and whw note wave016-E. Failed approval or
staging blocks C; do not close on a green CI job alone. Staged versions reserve
the version number: inspect an existing stage before retrying. Rejection is
irreversible and requires operator confirmation; no automatic cleanup.

Sources: https://docs.npmjs.com/staged-publishing/ and
https://docs.npmjs.com/cli/v12/commands/npm-stage/.
