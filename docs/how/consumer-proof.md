# Wave 015 consumer proof

ADR: [0013](../adr/0013-program-trust-adoption.md). A defines the protocol;
B starts only after A merges, main is green and the operator gives go.

## Baseline and package probe

On 2026-10-01, main `3ef8a7b` had green CI 36845590424. In `/private/tmp`,
outside the checkout, Node 24.5.0 and npm 11.11.1 returned `0.1.1` with
exit zero for both commands below, using a dedicated temporary npm cache:

```sh
npm exec --yes --cache /private/tmp/whw-wave015-npm-cache \
  --package=@fabioeloi/whw@0.1.1 -- whw --version
npx --yes --cache /private/tmp/whw-wave015-npm-cache \
  @fabioeloi/whw@0.1.1 --version
```

The historical `whw: command not found` miss is not reproducible on this
environment. This closes the current reproduction check; it does not
establish its historical cause or prove every installation environment.
The published version probe also does not prove current source behavior.

## Fresh consumer at B

Create an isolated temporary Git repository with a local test identity.
Invoke the current checkout's absolute `bin/whw.js` with `--root` pointing
to that repository. Run `init --tools codex,claude`, then establish a Git
baseline. Keep test artifacts and SQL separate from WHW's own state.

Replay the ordered command steps in `templates/ci-whw.yml`: `sync --all`,
`doctor`, and `gate run --tier pr`. Use the local bin so this proof covers
the candidate source, not npm's previously published release. Assert the
template still contains those commands; a changed template must require
updating the replay. Check exit codes and the consumer's gate checkpoints.
Record this as a local command replay, not a hosted GitHub Actions run.

## Handoff round-trip

Use tool identifiers **codex → claude → codex**. Generate both handoff
documents in the isolated repository with explicit, distinct output paths.
Check direction, branch/HEAD, queue and transition evidence in each output.
Record both Git baselines: the second may include a deliberate intermediate
commit, whose SHA must match the second handoff. Compare SQL statuses before
and after; handoff and resume must not claim work or downgrade done rows.

This checks the migration artifact contract. It does not launch either
model, transfer private chat stores, or attest agent execution.

## Resume contract and acceptance

B adds PR gate verification to `resume` after optional synchronization.
Both text and JSON must expose gate outcomes; a NO_GO returns nonzero while
still reporting the queue and next action. `--no-sync` skips seed application,
not gate verification. Resume never claims or completes a todo.

Acceptance requires a fresh-consumer replay with all PR gates GO, a validated
round-trip with both baselines, and regression coverage for successful and
failing resume gates plus unchanged SQL statuses. Run `npm test`, doctor,
Phase A, Phase B and PR gates in C. Retain sanitized command/exit/baseline
evidence for the ADR addendum at D. No new runtime dependencies, remote
consumer repository, model calls, release/tag or token changes are included.
