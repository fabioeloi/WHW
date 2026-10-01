# Wave 016 C — candidate audit

Candidate B [#53](https://github.com/fabioeloi/WHW/pull/53), `0c29851`,
merged `0f4109394bcb2e958024b38f99673885b01fb256`. Main CI 36857051783
passed on Node 22/24 before C. Protocol: [program-close-016](program-close-016.md).

Phase A passed **79 tests**, six PR gates GO and four ops gates GO.
Phase B scored 4/4/4/4: weighted **4.0 — APPROVE**, threshold 3.5.
The evidence-quality fix accepts the documented source gate/evaluate/close
commands and rejects unrelated CLI commands; terminal evidence was preserved.

## Package and notes

`npm pack --ignore-scripts --cache /private/tmp/whw-wave016-pack-cache`
produced a 0.2.0 candidate: **129 files**, **134069 bytes** compressed,
**406854 bytes** unpacked. The default npm cache was inaccessible under the
sandbox; the dedicated temporary cache succeeded without changing its ownership.

Tarball SHA-256:
`4b076e3ad440b5870db471037c3a698774d1a80729ada961f64b063bc1d3042f`.
It contains `bin/whw.js`, `src/resume.js`, `sql/schema.sqlite.sql`,
`templates/ci-whw.yml` and CHANGELOG. No `.whw/`, `.cursor/`, `.git/` or
`tests/` entries were included. The extracted CLI returned `0.2.0` with
exit zero. A separate consumer initialized from the extracted package,
created an ADR and wave, synchronized its seeds and passed all six PR gates.
Attempting sync before creating seeds correctly failed; the real seeded
consumer path was then checked.

Release notes were generated with:

```sh
node src/changelog.js --version 0.2.0 --out .whw/runs/wave016-C/release-notes.md
```

Notes SHA-256:
`681b3af78cdef5888cd31483e63d6ebc1d7ebc8abf73a9ec7933fb8e2db9c6ff`.
They include the new resume behavior and exclude the older 0.1.1 section.
The release workflow uses that extractor and has no NODE_AUTH_TOKEN in its
npm job. This is code inspection and local preparation, not OIDC publication.
The archived tarball predates this C document; final release packing must be
audited again against the final tag rather than assuming this hash is final.

## Inventory snapshot and limits

The local snapshot `.whw/runs/wave016-C/metrics.json` recorded 14 ADRs,
16 seeds/waves, 80 todos, 77 done, 15 closed waves, and 10/10 GO checkpoints
before C was completed. Static metrics counted 84 test cases; the actual
Node test runner executed 79. Static case counts are not executed-test counts.
Git timing fields reflect the local checkout and are not a project-age claim.
Nested archived runner logs are excluded from direct-attempt aggregates.

Rerun `whw evaluate --phase a`, doctor, PR/ops gates, metrics, npm pack and
the notes extractor for fresh evidence. Raw artifacts remain in ignored
`.whw/runs/wave016-C/`. No registry publish, hosted OIDC result, tag, token
revocation or Windows proof is claimed. D records the retrospective; E
rechecks closed-program inventory and metrics before release confirmation.
