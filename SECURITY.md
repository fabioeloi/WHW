# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
| 0.2.x   | Yes       |

WHW is pre-1.0: APIs and file layouts may change in minor releases. The
[Changelog](CHANGELOG.md) documents breaking changes.

## Reporting a vulnerability

**Do not open a public issue.** Email the maintainer address listed on the
GitHub profile with:

- a description of the vulnerability and its impact,
- steps to reproduce (proof of concept welcome),
- affected versions/commits, if known.

You will receive an acknowledgment within 72 hours. Fixes are released as soon
as practical, and reporters are credited in the release notes unless they prefer
otherwise.

## Scope notes

- WHW executes **custom shell gates** from `whw.config.json` and lifecycle
  scripts. Only run gates from repositories you trust, and review `whw.config.json`
  before `whw gate run --all` in an unfamiliar checkout (`whw doctor` prints
  the resolved custom gates without running them).
- The optional `whw run` agent runner shells out to third-party CLIs you
  configure. It never downloads or installs runners.
- WHW's log writer redacts object keys matching `/token|secret|password/i` and
  known token values, but redaction is defense-in-depth — never paste real
  secrets into prompts, todos, or evidence fields.
- `.whw/state.db` is derived local state and is gitignored by default. Do not
  commit it: evidence belongs in versioned `planning/*.todos.sql`,
  checkpoint files, and commit messages.
- This repository's `release.yml` uses GitHub Actions OIDC
  (`permissions.id-token: write`) and `npm stage publish --access public
  --provenance`. The trusted publisher grants staging only; direct publish
  and dist-tag permissions are disabled. An operator reviews and approves
  publication on npm with 2FA/passkey. The workflow does not set
  `NODE_AUTH_TOKEN`; never commit credentials.
- Version 0.2.0 was published on 2026-10-01. The GitHub `NPM_TOKEN` secret
  was subsequently deleted with operator authorization; npm package policy
  requires 2FA and disallows bypass tokens. These are verified repository
  settings, not automatic security guarantees for WHW consumers.
- Dispatch recovery attestation identifies the workflow main commit rather
  than the checked-out release tag. Independent file comparison established
  0.2.0 source contents. See [release verification](docs/how/staged-release-verification.md)
  and [staging runbook](docs/how/staged-release.md) for evidence and limits.
  Tag-triggered future publication remains a separate live verification.
- Approval and release operations affect the public registry. Review the
  exact version, artifact and destination before approving a staged release.
