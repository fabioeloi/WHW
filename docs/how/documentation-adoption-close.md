# Documentation adoption close — Wave 018 E

2026-10-01. ADR 0016; A–D integrated in PRs
[#62](https://github.com/fabioeloi/WHW/pull/62),
[#63](https://github.com/fabioeloi/WHW/pull/63),
[#64](https://github.com/fabioeloi/WHW/pull/64) and
[#65](https://github.com/fabioeloi/WHW/pull/65).
D main [CI 36880743145](https://github.com/fabioeloi/WHW/actions/runs/36880743145)
passed before E began. Final wave completion requires E integration with green CI.

## Status

`whw close wave-018-documentation-adoption` completed through the CLI:
A–D terminal, ADR addendum present, four sync gates GO, E changed to done.
The local SQL queue is empty. No direct database edits or forced close.
English and pt-BR READMEs, documentation index, adoption journey, positioning,
release/security truth and verification artifacts are delivered.

## Evidence

- [Verification report](documentation-adoption-verification.md): public 0.2.0
  consumer replay, links, GitHub rendering, parity, sources and limits.
- `npm test`: 81 passed, zero failures. Six PR and four ops gates GO.
- [Metrics snapshot](../../.whw/metrics.json): baseline D HEAD `2a3625b`,
  16 ADRs, 18 waves closed, 90/90 todos done, ten GO gate checkpoints.
  Git counters describe the pre-E snapshot, not the final merge commit.
- Metrics heuristically count 86 test declarations across 23 files; actual
  executed suite count is 81. These are different measures, not added tests.
- The public package remains 0.2.0 with SHA1
  `a45b31701b3c3b7a1cf1c0bbb88e2c81c84062f6`; immutable tag
  `92f6d70a21dac2c259133bc6b76f20e0376c210e` remains unchanged.

Rerun in a WHW checkout:

```sh
npm test
node ./bin/whw.js sync --all
node ./bin/whw.js gate run --tier pr
node ./bin/whw.js gate run --tier ops
node ./bin/whw.js status --track wave-018-documentation-adoption
node ./bin/whw.js metrics
python3 docs/how/documentation-adoption-links.py e72e33a
```

The operational DB records A–D artifact/test evidence and E canonical-close
evidence; public PRs and reports preserve the verifiable record. Metrics and
checkpoints are observations, not autonomous-delivery or benchmark claims.

## Next step

Integrate E only after green CI, then verify main. No npm republish or tag
change: package documentation follows the next separately authorized release.
Runner postconditions, stronger context persistence and further platform
proofs remain proposals requiring a new charter. No wave 019 is authorized
by ADR 0016.
