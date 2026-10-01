# Wave 014 — real runner proof

Planning contract (014 A), 2026-10-01. Authority: [ADR 0013](../adr/0013-program-trust-adoption.md), [WHY](../../WHY.md), and the Wave 014 SQL seeds. Implementation begins at B after A merges, main is green, and the operator gives the implementation go.

## Selected CLI and observed prerequisites

- Codex CLI `0.156.0` was found on PATH; `codex --version`, `codex exec --help` and `codex login status` were checked at A.
- Login status reported ChatGPT authentication. This confirms local authentication state, not entitlement to a particular model or a successful inference request.
- Claude, Gemini and Ollama executables were also found. Their authentication, local models and backend availability were not checked; they are not fallback runners for this proof.
- Node `24.5.0`, builtin SQLite and git passed `node ./bin/whw.js doctor`.
- WHW currently has no configured default runner. `doctor` does not yet detect installed agent CLIs. A selects the runner; B adds read-only discovery.
- Requested model: `gpt-6.1-sol`; requested reasoning effort: `low`, preserving the operator preference. No model substitution on failure.

Recheck versions and authentication at B; do not inspect or copy credential files. The installed CLI help is the version-specific command reference. Official references: [non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode), [configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference).

## Build scope

| Area | Expected implementation | Acceptance |
| --- | --- | --- |
| `src/doctor.js`, `tests/unit/doctor.test.js` | Add read-only discovery of known runner executables on PATH. Report presence/absence separately from configured commands. | Fixture PATH finds an executable, excludes absent/non-executable entries, and handles no runners without failing ordinary doctor. Never execute arbitrary configured shell commands, trigger inference/login, or claim authentication/backend health. |
| `src/metrics.js`, new `tests/unit/metrics.test.js` | Add additive run-log aggregates by `costClass`, preserving current fields. Specify processed/malformed/unknown counts and aggregation rules in the CLI reference. | Isolated logs with known classes, blank/missing class, malformed records, success/failure and empty directory yield deterministic aggregates; unknown is explicit. Do not derive USD from a class or equate configured model with backend attestation. Exclude research/session subdirectories from WHW attempt-log counts. |
| New `tests/unit/handoff.test.js` | Verify git baseline, queue/evidence pointers, output path and no-git fallback in temporary repositories. | Behavioral assertions on meaningful sections; transcripts remain local pointers. No snapshots containing personal paths. |
| New `tests/unit/close.test.js` | Verify refused close for nonterminal A–D, missing addendum and red sync gate; successful close and repeated close. | Refused close leaves state nonterminal; success records E transition/evidence; repeat is idempotent and never downgrades done. |
| New `tests/unit/adapters.test.js` | Verify canonical pointers/native adapters and settings merge. | Existing Gemini keys preserved, manifest matches managed files, unknown tool rejected, native adapters do not require pointer files. |
| `docs/what/` references, this protocol | Document discovery and run aggregates, exact proof commands and sanitized outcome. | Definitions distinguish executable presence, CLI authentication, process exit, SQL completion and configured metadata. |

Runtime remains Node >=22.13 with zero runtime dependencies. Do not broaden `src/run.js` semantics to enforce universal postconditions in this wave. Runner hardening from the CLM assessment requires a versioned policy in a later charter; here acceptance is checked independently by the operator/evaluator.

## Real run procedure (B)

1. Confirm A merged and main green. Create `feat/wave-014-runner-proof-real-b` and claim `wave014-B`. Work from an isolated checkout so the runner cannot touch unrelated untracked material. Sync the existing seeds in that checkout; claim there through WHW, never edit the DB directly. The live operator DB and proof checkout DB are separate; record both outcomes and do not copy a DB over the live state.
2. Create a local ignored config overlay, `.whw/runs/wave014-config.json`. Preserve the repository config and add one tier followed by human. No global default runner change and no API key setup is required by this protocol.

```json
{
  "escalation": {
    "tiers": [
      {
        "name": "codex-proof",
        "runner": "codex exec --ignore-user-config --sandbox workspace-write --json -m gpt-6.1-sol -c model_reasoning_effort=\"low\" - < \"$WHW_PROMPT_FILE\"",
        "model": "gpt-6.1-sol",
        "costClass": "closed",
        "maxFailures": 1
      },
      { "name": "human", "human": true }
    ]
  }
}
```

Use a fresh exec session, not `resume` or `fork`. Preview the composed prompt before executing:

```sh
node ./bin/whw.js --config .whw/runs/wave014-config.json run builder --ref wave014-B --dry-run
node ./bin/whw.js --config .whw/runs/wave014-config.json --json run builder --ref wave014-B --max-attempts 1 --task 'Implement only Wave 014 B from docs/how/runner-proof-real.md and the SQL seed. Use the existing claim. Do not launch nested runners or subagents, push, merge, publish, create new waves, or change credentials/configuration outside the checkout. Verify tests and PR gates, commit scoped work, and record whw done with rerunnable evidence. Stop before C.'
```

3. Use an external supervisor with a 20-minute wall-clock deadline; terminate the entire child process group on timeout and retain partial logs. WHW currently allows up to one hour per shell invocation, so `--max-attempts 1` alone is not a time limit. Do not use approval/sandbox bypass flags. If required permissions, model availability or authentication prevent the run, record the concrete blocker and stop; no silent retries or fallback model.
4. Save CLI version, baseline SHA, sanitized command/config, requested model/effort, start/end/duration, exit, prompt hash and output artifact paths under ignored `.whw/runs/`. Preserve JSONL usage if available; absent values and billed price are unknown. `costClass=closed` describes configured runner category, not financial cost.
5. Independently verify code diff, test exit, gates and proof checkout SQL (`wave014-B` done with nonempty rerunnable evidence). A CLI exit zero or generated `complete` message alone does not satisfy acceptance. Check for escaped scope, nested runs or unwanted state changes.
6. Transfer only reviewed commits/files from the proof checkout to the B delivery branch. Record the verified artifacts via `whw done wave014-B --evidence ...` in the live operator checkout once B acceptance holds. Create the B PR; do not claim C until B merges and main is green.

## Verification and decision (C/D)

C runs `npm test`, `node ./bin/whw.js doctor`, `node ./bin/whw.js gate run --tier pr`, and `node ./bin/whw.js --json metrics --out .whw/runs/wave014-metrics.json`. Evaluate A through the configured deterministic checks. Unit fixtures supplement the actual run; they do not replace it.

D appends `## Addendum Wave 014` to ADR 0013 with PRs A–C, CLI version, requested/reported model if observable, effort, exit, durationMs, costClass, a sanitized log tail and independent SQL/test/gate evidence. Include failed attempts/timeouts if any. Local ignored artifact paths alone are insufficient public evidence: commit a sanitized summary in the addendum and reference the exact reviewed code/test commands. Make no claim of benchmark improvement, measured USD or backend attestation.

E uses `whw close` only after A–D merge, main is green, plan links and addendum are complete. No tag, npm publish or token revocation occurs in Wave 014.

## Explicit exclusions

CLM context editing, note/history persistence fixes, aggregate evaluation policy changes, generic runner postcondition enforcement, additional models/tiers, benchmarks and new runtime dependencies are outside this charter. The CLM assessment informs evidence checks but does not authorize extending program 003 beyond waves 012–016.
