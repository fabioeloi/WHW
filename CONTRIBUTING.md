# Contributing to WHW

Thanks for your interest in contributing. WHW is developed *with* WHW, so the
contribution flow below is both process and dogfood.

## Ground rules

- Be kind and assume good intent. The [Code of Conduct](CODE_OF_CONDUCT.md)
  applies to all interactions.
- Every change needs a **WHY**: link the issue, ADR, or wave it serves. PRs
  without a stated reason are sent back.
- Keep PRs small and single-letter: one wave letter (A–E) per PR where
  practical. Large PRs get asked to split into waves.
- Never commit secrets, tokens, private keys, or personal data. The
  `no-secrets` gate enforces this in CI.

## Development setup

Requirements: Node.js ≥ 22.13 (uses built-in `node:sqlite`), git.

```bash
git clone https://github.com/fabioeloi/WHW.git
cd WHW
node ./bin/whw.js doctor     # verify toolchain
node --test "tests/**/*.test.js"           # unit + e2e suites
node ./bin/whw.js sync --all # build .whw/state.db from planning/
node ./bin/whw.js queue      # see actionable work
```

No `npm install` is needed: WHW has zero runtime dependencies.

## Working in waves

1. **Find or charter work.** Pick a `ready` todo from `whw queue`, or charter a
   new wave: `whw wave new <slug> --adr NNNN`. New programs need a charter ADR
   first (`whw program new <slug> --waves N`).
2. **Claim before coding.** `whw claim <ref>` marks `in_progress`. One claim at
   a time per agent.
3. **Implement on a branch.** `feat/wave-003-my-slug-b`, commits
   `type(scope): summary (Wave 003 B)`. See `docs/how/conventions.md`.
4. **Verify.** `whw gate run --tier pr` and `node --test "tests/**/*.test.js"` must be green.
5. **Record the decision.** Wave D appends an ADR addendum; wave E runs
   `whw close <wave>` (applies `.done.sql`, runs sync gates).
6. **Report.** Every milestone ends with Status / Evidence / Next step
   (`whw status --track <track>` renders the template).

### Commit types

`feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `ci` — followed by scope and
the wave trailer, e.g. `feat(gates): add no-secrets gate (Wave 002 C)`.

## Pull requests

- Fill in `.github/pull_request_template.md` completely, including the
  Validation Evidence checklist.
- CI runs `npm test`, `whw doctor`, and `whw gate run --tier pr` on Node 22/24.
- A maintainer reviews for WHY-clarity, scope fit, tests, and docs. Expect
  review within a few days.

## Adding a gate, role, or skill

- **Gate:** add a builtin under `src/gates/builtin/` (pure function returning
  `{ status, failures, details }`) or document a custom shell gate in
  `whw.config.json`. Add unit tests and a `docs/how` section.
- **Role:** add `roles/<name>.md` following the existing frontmatter
  (`name`, `description`, `model: any`, `tools`, `context_strategy`,
  `context_handoff`), plus a `docs/how` subsection.
- **Skill:** add `skills/<name>/SKILL.md` compliant with
  [agentskills.io/specification](https://agentskills.io/specification)
  (`name` matches the directory, `description` states what + when).

## Style

- Markdown: one sentence per line where readable, fenced code blocks with
  language tags, mermaid diagrams for flows.
- JavaScript: ESM, 2-space indent, no dependencies, JSDoc on exported
  functions, `// SPDX-License-Identifier: MIT` header on every source file.
- SQL: lowercase keywords, `IF NOT EXISTS` guards, idempotent seeds with
  `ON CONFLICT ... DO UPDATE` that never downgrade `done`.

## Security issues

Do **not** open public issues for vulnerabilities. See [SECURITY.md](SECURITY.md).
