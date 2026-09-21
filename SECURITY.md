# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

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
- npm publish (`release.yml`) authenticates with GitHub Actions OIDC
  (`permissions.id-token: write`) and `npm publish --access public
  --provenance`. The workflow does **not** set `NODE_AUTH_TOKEN`. Do not
  commit tokens. The GitHub `NPM_TOKEN` secret remains until the first OIDC
  publish succeeds (wave 016 / `v0.2.0`); do not revoke it and do not set
  npm "require 2FA and disallow tokens" before that (ADR 0010 / 0014).
  Configure the npmjs.com trusted-publisher row (`fabioeloi` / `WHW` /
  `release.yml`, empty environment, allow **`npm publish`**) before any
  `v*` tag. Tagging is irreversible toward the registry — confirm at
  execution time. `@fabioeloi/whw@0.1.1` is already on npm.
