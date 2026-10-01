# Wave 014 C — independent verification

Baseline: PR [#43](https://github.com/fabioeloi/WHW/pull/43), merged as
`5437284362dc59f3789499d5ce85fdb59d691b57`. Main CI passed on Node 22 and 24.
Scope: verify ADR 0013 / Wave 014 B; no runtime changes in C.

## Deterministic checks

Phase A passes the configured Node test suite. `doctor` finds executable
runners without invoking them; missing optional CLIs remain warnings.
All six PR gates are GO. The new sanitized fixture adds one test to the
77-test B suite; C contains 78 passing tests.

Rerun from a clean checkout with Node >=22.13:

```sh
node ./bin/whw.js sync --all
node ./bin/whw.js evaluate --phase a
node ./bin/whw.js doctor
node ./bin/whw.js gate run --tier pr
node --test tests/unit/runner-proof.test.js
node ./bin/whw.js --json metrics --out .whw/runs/wave014-verification-metrics.json
```

`tests/fixtures/runner-proof/attempts.json` preserves sanitized metadata
from the real attempts. The replay test creates isolated logs and verifies
aggregation independently from task completion. It is a deterministic
fixture, not a new model run or reproduction of model output. Raw logs,
read-only SQL verification and hashes stay in local ignored
`.whw/runs/wave014-C/`; transcripts and credentials are not published.
A clean checkout has no live run logs: its `runs` aggregate is correctly
empty. Nested research/proof archives are deliberately excluded.

## Real-run evidence

| Attempt | CLI | Requested model / effort | Child exit | WHW result | Child duration |
| --- | --- | --- | --- | --- | --- |
| Initial | 0.156.0 | gpt-6.1-sol / low | 1 | human escalation, exit 3 | 7375 ms |
| After upgrade | 0.159.3 | gpt-6.1-sol / low | 0 | process complete | 308271 ms |

The two raw metadata headers replay as two `closed` attempts, one process
success and one failure, total **315646 ms**. The second supervisor took
308336 ms and did not time out. Its final CLI message and isolated SQL
recorded a Git-permission block: no builder commit or `done` evidence.
External review, commit `4763c85` and live `whw done wave014-B` finalized
B with rerunnable test/gate evidence. The live row is `done`; this does
not rewrite the isolated run's blocked outcome.

This is **operator-assisted proof**, not autonomous commit/completion.
The runner continues to trust exit zero; C does not change that policy.
A fully autonomous proof under the managed Git sandbox remains unproven.
D must preserve this qualification rather than describing the process
success as end-to-end autonomous delivery.

The CLI reported 766722 input tokens, 710784 cached input tokens and
8556 output tokens and a reported reasoning-output field of 513 tokens. These are
client usage fields for this attempt, not benchmark comparisons or an
invoice. Billed USD is unknown. `costClass=closed` and model/effort
configuration are metadata, not provider-side model attestation.

## Rubric

Phase B was scored only after green Phase A. Technical quality 4,
originality 4, craft 4, functionality 3; weights 1.3/1.3/1/1 produce
**3.783**, above the configured 3.5 threshold: **APPROVE**.

The implementation meets the discovery/metrics/module-test scope with
zero new runtime dependencies and unchanged `src/run.js`. Functionality
gets 3 because the core works but autonomous Git/SQL completion was not
shown; operator assistance is explicit. Discovery was exercised on macOS
and Linux CI; no Windows executable-suffix proof was performed. Neither
qualification is a claim that backend availability, financial cost or
cross-platform behavior was measured comprehensively.

Next: D records the decision and sanitized log tail in ADR 0013 after C
merges and main is green. No release/tag/token revocation occurs here.
