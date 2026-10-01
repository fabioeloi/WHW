# Wave 015 C — consumer verification

Source: B [#48](https://github.com/fabioeloi/WHW/pull/48), implementation
`6512372`, merged `4cf7dec922626bc3b646acd7cd82849863f43ed8`.
Main CI 36852304485 passed on Node 22 and 24 before C started.
Protocol: [consumer-proof](consumer-proof.md).

## Independent local replay

On 2026-10-01, a separate consumer Git repository was initialized from the
candidate CLI, using `init --tools codex,claude`. It created its own ADR,
wave seed and SQLite state. The ordered CI-template commands `sync --all`,
`doctor`, and `gate run --tier pr` all exited zero; all PR gates were GO.
The consumer then claimed and completed its fixture A with explicit evidence.

The replay recorded two distinct committed baselines:

| Handoff | Branch | HEAD |
| --- | --- | --- |
| codex → claude | main | `684880c2843eba9303973a3a9861342fde9b9fea` |
| claude → codex | main | `fda1ad3828f76b7fb5c80466d3a6e6aed2302029` |

The intermediate commit contained the forward handoff. Each generated
document named the correct direction and corresponding short HEAD.
The replay compared every todo's ref, status and evidence after handoff
and resume with the pre-handoff SQL snapshot: unchanged, with A done and
B pending. Successful resume with and without sync returned zero and
reported all gates GO and B as the next action.

A custom failing PR gate (`exit 1`) then made both JSON and text resume
with `--no-sync` return 1, report NO_GO and still identify B. SQL statuses
and evidence remained unchanged. The replay completed 24 recorded commands.
Local raw command output, script, consumer Git objects and summary remain
in ignored `.whw/runs/wave015-C/`. These SHAs identify that local archived
run; they are not commits in WHW's public history.

## Rerunnable public verification

```sh
node --test tests/e2e/consumer.test.js
node ./bin/whw.js evaluate --phase a
node ./bin/whw.js doctor
node ./bin/whw.js gate run --tier pr
```

The checked-in e2e test creates another fresh consumer, checks the exact
ordered CI-template commands, generates both handoffs across separate
commits, and checks SQL invariants and failing resume in text/JSON.
Its regenerated SHAs may differ; assertions verify the actual corresponding
HEAD rather than a fixed hash. Phase A passed all **79 tests**. Doctor
passed with optional missing-runner warnings; all six repository PR gates GO.

## Rubric and limits

Phase B followed green Phase A: technical quality 4, originality 4,
craft 4, functionality 4; weighted average **4.0**, threshold 3.5:
**APPROVE**. Reusing the gate executor preserves checkpoints and failure
hooks, and the CLI test exercises successful and failed consumer paths.
Minor limits remain: custom gate commands can take time, and the local
replay does not independently exercise GitHub-hosted workflow provisioning.

This proves a local candidate-source consumer and migration-artifact
contract. It does not run Codex/Claude models, migrate private chats, prove
Windows compatibility, or claim a hosted consumer Actions run. The versioned
npm 0.1.1 probe at A passed, but that older published package does not contain
the new resume behavior. No release, tag or dependency change occurs here.
Next: D records this qualified result after C merges and main is green.
