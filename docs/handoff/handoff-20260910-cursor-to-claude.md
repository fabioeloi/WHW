# Handoff — cursor → claude (2026-09-10)

## Objective

Wave 010 continuity-proof: prove whw resume, a live docs/handoff package, and config hooks (on_claim/on_done/on_gate_fail/on_close). Next: finish 010 B–E; do not start 011; do not tag v0.1.1.

## Git baseline

- branch: feat/wave-010-continuity-proof-b
- HEAD: e390663
- status: dirty:
  ## feat/wave-010-continuity-proof-b
   M .whw/checkpoints/adr-link/latest.txt
   M .whw/checkpoints/agents-parity/latest.txt
   M .whw/checkpoints/no-secrets/latest.txt
   M .whw/checkpoints/planning-coverage/latest.txt
   M .whw/checkpoints/readme-sync/latest.txt
   M .whw/checkpoints/wave-sync/latest.txt
   M AGENTS.md
   M CHANGELOG.md
   M README.md
   M README.pt-BR.md
   M docs/glossary.md
   M docs/how/continuity.md
   M docs/what/cli.md
   M docs/what/config.md
   M docs/what/config.schema.json
   M examples/hello-wave/README.md
   M roles/autonomous-engineer.md
   M skills/whw-handoff/SKILL.md
   M src/cli.js
   M src/close.js
   M src/config.js
   M src/doctor.js
   M src/gates/runner.js
   M src/handoff.js
   M templates/AGENTS.md
   M templates/handoff.md
   M tests/e2e/loop.test.js
   M tests/unit/config.test.js
  ?? .cursor/plans/
  ?? src/hooks.js
  ?? src/resume.js
  ?? tests/unit/hooks.test.js
  ?? tests/unit/resume.test.js
- log:
  e390663 docs(plan): start wave 010 continuity-proof (Wave 010 A)
  13cf345 Merge pull request #17 from fabioeloi/docs/wave-009-runner-proof-e
  021fe11 docs(plan): mark wave 009 closed (Wave 009 E)
  7fce964 Merge pull request #16 from fabioeloi/docs/wave-009-runner-proof-d
  644bb6d docs(adr): record runner-proof evidence (Wave 009 D)
  b297224 Merge pull request #15 from fabioeloi/test/wave-009-runner-proof-c
  246a4c3 test(run): record runner-proof verification (Wave 009 C)
  860de14 Merge pull request #14 from fabioeloi/feat/wave-009-runner-proof-b
  1f41a9c Merge remote-tracking branch 'origin/main' into feat/wave-009-runner-proof-b
  4d4743e Merge pull request #13 from fabioeloi/docs/wave-009-runner-proof-a

Verify in the target tool before continuing:

```bash
git status --short --branch
git log --oneline -n 10
```

The baseline must match (branch @ SHA, clean/dirty as above) before touching
the queue. If it diverges, stop and reconcile git first.

## Queue snapshot

- [in_progress] wave010-A — Wave 010 A — Plan: continuity-proof
- [ready] wave011-A — Wave 011 A — Plan: program-close

## Gate results

- adr-link: status=GO failures=0
- agents-parity: status=GO failures=0
- no-secrets: status=GO failures=0
- planning-coverage: status=GO failures=0
- program-inventory: status=GO failures=0
- readme-sync: status=GO failures=0
- wave-sync: status=GO failures=0

## Recent transitions

- wave010-A pending → in_progress (fabiosilva, 2026-09-10 20:04:34)
- wave009-E in_progress → done (fabiosilva, 2026-09-10 19:57:38): whw close wave-009-runner-proof
- wave009-E pending → in_progress (fabiosilva, 2026-09-10 19:57:25)
- wave009-D in_progress → done (fabiosilva, 2026-09-10 19:57:23): PR #16 https://github.com/fabioeloi/WHW/pull/16; ADR 0009 Addendum Wave 009; commit 644bb6d
- wave009-D pending → in_progress (fabiosilva, 2026-09-10 19:56:04)
- wave009-C in_progress → done (fabiosilva, 2026-09-10 19:56:03): PR #15 https://github.com/fabioeloi/WHW/pull/15; npm test 46/46; whw gate run --tier pr GO; Actions run 34523261480
- wave009-C pending → in_progress (fabiosilva, 2026-09-10 19:54:55)
- wave009-B in_progress → done (fabiosilva, 2026-09-10 19:54:49): PR #14 https://github.com/fabioeloi/WHW/pull/14; npm test 46/46; whw gate run --tier pr GO; Actions run 34523138052

## Chat-path map (local only — pointers, never transcripts)

| Tool | Session path | Confidence |
| ---- | ------------ | ---------- |
| Claude Code | `~/.claude/projects/**/*.jsonl` | local-observed |
| Codex CLI | `~/.codex/sessions/YYYY/MM/DD/*.jsonl` | local-observed |
| Cursor | `~/Library/Application Support/Cursor/User/workspaceStorage/*` (macOS; varies) | probable |
| Gemini CLI | `~/.gemini/tmp/<project_hash>/` (`/chat save` checkpoints) | official |
| Copilot CLI | `~/.copilot/session-state/*/events.jsonl` | official |
| VS Code | `~/Library/Application Support/Code/User/workspaceStorage/*/chatSessions/*` (macOS) | local-observed |
| Windsurf | under `~/.codeium/` when present; else in-app export | needs-runtime-detection |
| Aider / OpenCode | no persistent chat store; rely on git + queue + this handoff | n/a |

## Continuity checklist

1. Baseline matches.
2. `whw resume` (or `whw sync --all` → `whw queue`) — SQL is the source of truth.
3. `whw gate run --tier pr` green before new work.
4. Resume the top queue item; claim before coding.
5. Report Status / Evidence / Next step at the first milestone.
