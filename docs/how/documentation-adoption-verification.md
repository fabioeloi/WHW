# Documentation adoption verification — Wave 018 C

2026-10-01. B integrated as `e113d5e` in [PR #63](https://github.com/fabioeloi/WHW/pull/63).
Main [CI 36879462384](https://github.com/fabioeloi/WHW/actions/runs/36879462384)
was green before C. This is a separate execution replay and editorial audit,
not a new model benchmark or a claim of independent third-party certification.

## Published-package replay

A new temporary Git repository used npm **0.2.0**, not this source checkout.
Initialization generated pointers for Claude/Cursor/Copilot/Gemini and native
Codex, plus roles, skills and templates. It did not copy bin/src. Program
`adoption` generated ADR `0001`; `first-change` generated wave `001`.
The fixture edited WHY, charter context/wave map and plan before execution.

`doctor`, `sync --all`, `queue`, `claim wave001-A`, six PR gates,
`done wave001-A --evidence ...`, `status`, four ops gates, `resume`,
`handoff --from codex --to claude` and final queue all exited zero.
A was done with real artifact/command evidence; B remained pending/ready.
Resume reran PR gates without claiming B. The handoff recorded the direction
and an explicitly uncommitted baseline. It did not run either model.

Rerun from a WHW checkout (Node ≥22.13, npm, Git, POSIX shell, registry access):

```sh
sh docs/how/documentation-adoption-replay.sh
```

The script retains its disposable directory for inspection, modifies only that
fixture and never publishes. It intentionally verifies the planning milestone,
not a fabricated five-letter implementation. `close` prerequisites are covered
by the existing behavioral suite: `node --test tests/unit/close.test.js`.

Registry recheck: version 0.2.0, SHA1
`a45b31701b3c3b7a1cf1c0bbb88e2c81c84062f6`. Tag v0.2.0 remains
`92f6d70a21dac2c259133bc6b76f20e0376c210e`. No package or tag mutation.

## Navigation and rendering

At B/C review, 14 changed Markdown documents contained **196 local targets**;
all files/directories and heading anchors resolved, including accented pt-BR
anchors. No local errors. Reproduce (Python 3, from repo root):

```sh
python3 docs/how/documentation-adoption-links.py e72e33a
```

The helper audits inline Markdown links outside fenced examples; it does not
replace browser rendering or guarantee arbitrary future Markdown syntax.
62 distinct external destinations were checked: 60 returned HTTP 200.
Gartner and npm web pages returned HTTP 403 to automation. Gartner's public
abstract was readable through the web reader; the npm registry API and rendered
npm badge confirmed 0.2.0. These are access restrictions, not evidence of a
missing destination. No security challenge was bypassed.

GitHub main preview was inspected for both READMEs: centered header, working
CI/npm badges, tables and navigation. The architecture and operational Mermaid
iframes rendered successfully in both languages, with block/NO_GO branches,
evidence and human review/approval nodes. Accent-bearing anchors matched
GitHub-generated IDs. The long operational flow offers GitHub zoom/dialog
controls; it is not a static text-only fallback.

## Parity and capability audit

Four shell blocks are byte-identical across both READMEs. Each has two Mermaid
flows and the same 12 section purposes (including navigation). Reviewed parity:
Node/npm/Git prerequisites, generated numbers, A-only completion, package versus
checkout commands, terminal E contract, no automatic claim, compatibility
layers, proof limitations, release boundary and contribution/security policy.
pt-BR guides retain CLI identifiers and a consistent glossary, explicitly
labeling English technical references.

| Claim | Checked authority | Finding |
| --- | --- | --- |
| SQL queue and state transitions | [SQL transitions](../../src/planning/transitions.js), [queue](../../src/planning/queue.js) and SQL schema; existing suite | Process state, not hosted collaboration or hidden model memory |
| Adapter availability | [Adapters](../../src/adapters.js), adapter reference and fixture pointers | File support separated from inference proof |
| Resume and handoff | [Resume](../../src/resume.js), [handoff](../../src/handoff.js), consumer e2e and replay | No auto-claim; no private chat migration |
| Runner integration | [Runner](../../src/run.js), doctor discovery and wave 014 proof | Configured external command; operator-assisted Git/SQL completion |
| Release security | [Workflow](../../.github/workflows/release.yml) and wave 017 verification | Staging-only OIDC with human approval; dispatch provenance limit preserved |
| Governance/context positioning | Dated primary sources in positioning | External research; no WHW benchmark, savings or compliance result |

Atlassian (September 3), Gartner public abstract (September 18), and
Beyond the Model v1 (September 26) meet the September 30 publication cutoff.
FORGE was used for presentation only. October 1 release observations are dated
separately. No unsupported peer rankings or superiority claims remain.

## Deterministic verification and failure history

`npm test`: **81 passed, 0 failed**. All six PR and four ops gates GO.
B initially failed CI because the README gate's line-based heuristic interpreted
version-pinned `done wave001-A` as a completed-wave claim; the existing local
DB already had wave001-E done and masked it. A multiline shell command fixed
the ambiguity in both languages without changing the gate or CLI. A clean
seed-only state and subsequent B CI passed. This documents why fresh-state
verification matters; passing the gate alone is not a full editorial audit.

No new product tests mirror document wording. The replay/link helpers are
explicit audit artifacts; no runtime dependency, API or product behavior changed.
