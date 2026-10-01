# Staged release verification — Wave 017 C

2026-10-01. ADR 0015; B merged as ebd5218 (PR #58); main CI
36861325290 passed. Local suite: 81 tests; PR CI passed Node 22 and 24.
All six PR gates were GO. Recovery validator rejects another SHA/tag,
branch refs, package identity/version mismatch and unsupported events.

## Observed publication

- npm Safari settings: fabioeloi/WHW release.yml, permissions only
  npm stage publish. No direct publish or dist-tag permission.
- OIDC workflow dispatch: https://github.com/fabioeloi/WHW/actions/runs/36861416962
- Source: v0.2.0 at 92f6d70a21dac2c259133bc6b76f20e0376c210e; tag unchanged.
- Stage: 78cfc0c6-533b-4658-8df1-aec78dcbd8e7, latest, trusted automation.
- npm automated processing completed; operator approved with Safari passkey.
- Public registry: @fabioeloi/whw@0.2.0, latest=0.2.0, 131 files.
- SHA1: a45b31701b3c3b7a1cf1c0bbb88e2c81c84062f6
- SHA256: 8b64cf931f9ee4d872322cf7352343fb2207ebfc032e719bc64232dfdff079cd
- Staged and public tarballs have identical hashes. Every regular tarball file
  was byte-compared with git show v0.2.0:path: zero differences. Extracted
  bin/whw.js --version returned 0.2.0.
- npm audit signatures in an isolated consumer: one verified registry signature
  and one verified attestation. No install scripts executed.
- GitHub Release notes equal the 0.2.0 CHANGELOG section after trimming.
- Provenance transparency log: https://search.sigstore.dev/?logIndex=3035700744

## Provenance limit

npm's standard attestation identifies the dispatch workflow on main at
ebd5218 (full SHA ebd521868c24051c33bc2d8633792e29b98ddf4f), rather than the
recovery checkout SHA. It authenticates the staging run and tarball digest.
The guard and independent file-by-file comparison establish the artifact's
v0.2.0 source. Do not claim the default attestation alone certifies that tag.
Future tag-triggered runs use their event tag/SHA. Their live behavior is
not proved by this dispatch recovery.

## Reproduce

```sh
npm test
node ./bin/whw.js gate run --tier pr
npm view @fabioeloi/whw@0.2.0 version dist --json
npm view @fabioeloi/whw dist-tags --json
# In an isolated directory:
npm install --ignore-scripts @fabioeloi/whw@0.2.0
npm audit signatures
```

Temporary maintainer CLI login was used to download the staged tarball and
then logged out. No credential values entered evidence. Legacy token
revocation and package bypass-token protection are tracked separately before
D acceptance; no historical done record is rewritten.

## Credential disposition and package protection

Safari showed success and the selected package policy requiring 2FA while
disallowing bypass tokens. OIDC permissions remained staging-only. The
operator explicitly authorized deletion of GitHub NPM_TOKEN; deletion
succeeded and gh secret list returned no secrets. npm Access Tokens showed
one WHW_init entry marked Expired, expiry 2026-09-17, and no active tokens.
This is evidence of inactive credentials, not a claim of new npm revocation.
