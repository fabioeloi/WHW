<div align="center">

# WHW — Why · How · What

### An LLM- and tool-agnostic harness for autonomous, evidence-gated software delivery

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D22.13-339933?logo=node.js&logoColor=white)](package.json)
[![Zero dependencies](https://img.shields.io/badge/dependencies-zero-blue)](package.json)
[![AGENTS.md](https://img.shields.io/badge/AGENTS.md-canonical-blueviolet)](AGENTS.md)
[![Agent Skills](https://img.shields.io/badge/skills-agentskills.io%20compatible-brightgreen)](https://agentskills.io/specification)
[![Version](https://img.shields.io/badge/version-0.1.1-purple)](CHANGELOG.md)

[Manifesto](docs/why/manifesto.md) •
[Quick Start](#-quick-start) •
[How It Works](#-how-it-works) •
[CLI](docs/what/cli.md) •
[Docs](#-documentation) •
[Contributing](CONTRIBUTING.md)

[🇧🇷 Leia em português](README.pt-BR.md)

</div>

---

## 💡 The problem

Autonomous coding agents are fast but forgetful. Work lives in chat transcripts:
decisions are unrecorded, "done" is subjective, context evaporates between
sessions, and switching tools means starting over. The result at scale is
familiar — lost context, unrecorded decisions, difficult review.

```text
💬 Chat transcript ──── ❌ GAP ──── ✅ Shipped, proven, reviewable
        │                                            │
        │  • intent not tied to code                 │
        │  • status only conversational              │
        │  • no portable execution state             │
        │  • gates as theater, not evidence          │
        └────────────────────────────────────────────┘
```

## ✅ The answer

WHW (Why · How · What) is a harness that sits *over* any frontier model or
coding agent and turns isolated prompts into a **process with state, roles,
artifacts, and validation**:

```text
WHY.md ──→ 📜 ADRs ──→ 🌊 Waves (A–E) ──→ 🗄️ SQL todos ──→ 🤖 Roles ──→ ✅ Gates ──→ 📦 Evidence
  │              │              │                  │              │            │            │
  │  purpose     │  decisions   │  small PRs       │  source of   │  planner / │  GO/NO_GO  │  audit trail
  │  first       │  + charter   │  plan→close      │  truth       │  builder / │  + proof   │  + metrics
  │              │              │                  │              │  evaluator │            │
  └──────────────┴──────────────┴──────────────────┴──────────────┴────────────┴────────────┘
                              traceability: no todo without a wave,
                              no wave without an ADR, no ADR without a WHY
```

WHW is **agnostic by design**: any model (open or closed), any tool (Claude
Code, Cursor, Copilot, Codex, Gemini CLI, Aider, …), any stack. The contract is
files and SQL — tools come and go, evidence stays.

> **Inspiration note.** The Why → How → What ordering is inspired by Simon
> Sinek's *Start With Why* (2009). WHW is an independent project, not
> affiliated with or endorsed by Simon Sinek. See [ACKNOWLEDGMENTS.md](ACKNOWLEDGMENTS.md).

---

## 🚀 Quick start

Requirements: Node.js ≥ 22.13 (uses built-in `node:sqlite`), git. Zero
dependencies — no `npm install` needed.

Until `@fabioeloi/whw` is on npm (tag `v0.1.1` + `NPM_TOKEN`, ADR 0010), run
from a clone. After publish, `npx @fabioeloi/whw` is the same CLI.

```bash
# 1. Try it (clone until npm publish lands)
git clone https://github.com/fabioeloi/WHW.git
cd WHW
node ./bin/whw.js doctor

# After publish:
# npx @fabioeloi/whw doctor

# 2. Adopt it in your repo
cd your-project
node /path/to/WHW/bin/whw.js init --tools claude,cursor,codex,copilot,gemini
# After publish: npx @fabioeloi/whw init --tools claude,cursor,codex,copilot,gemini
node ./bin/whw.js doctor

# 3. Charter a program, then a wave
whw program new checkout-revamp --waves 4
whw wave new guest-checkout --adr 0009

# 4. Work the loop (human or agent — same commands)
whw sync --all        # planning/*.todos.sql → .whw/state.db
whw queue             # what is actionable right now?
whw claim wave001-A   # mark in_progress
# ... implement ...
whw done wave001-A --evidence "commit abc123, tests green"
whw gate run --tier pr
whw close wave-001-guest-checkout
whw status            # Status / Evidence / Next step
```

Prefer a guided tour? Walk through [`examples/hello-wave/`](examples/hello-wave/)
— a minimal repo that runs the whole loop in minutes.

---

## 🎯 How it works

### WHY — purpose first

Every repository starts with [`WHY.md`](WHY.md): the purpose, the non-goals,
and the principles. Architecture Decision Records ([`docs/adr/`](docs/adr/))
capture each significant decision with context, options, and consequences.
Programs are chartered by an ADR that maps waves, names explicit exclusions,
and defines the close criteria.

**Traceability rule: no todo without a wave, no wave without an ADR, no ADR
without a WHY.** Verification runs outside-in: evidence (WHAT) proves the gates
(HOW) satisfied the ADR's acceptance (WHY).

### HOW — the wave rhythm

Work ships in **waves**. Each wave is five small steps, each a PR (or an atomic
commit when solo):

| Letter | Name   | Delivers                                              |
| ------ | ------ | ----------------------------------------------------- |
| **A**  | Plan   | `planning/wave-NNN-<slug>.todos.sql` seed + deps      |
| **B**  | Build  | The implementation                                    |
| **C**  | Check  | Tests + gates green                                   |
| **D**  | Decide | ADR addendum recording what was decided and shipped   |
| **E**  | End    | Canonical close: `.done.sql`, sync gates, docs update |

A wave is `done` only when **E** merges. Waves group into **programs**; a
program's close wave runs an **inventory gate** proving every artifact exists —
and that **no wave N+1 exists without a new charter ADR**. Scope creep needs a
decision, not a shrug.

Execution state lives in SQL: `planning/*.todos.sql` seeds are versioned, and
`whw sync` loads them into `.whw/state.db` (SQLite, derived, gitignored).
Agents claim work from a dependency-aware queue — never from chat memory:

```bash
whw queue                  # actionable: in_progress first, then ready
whw claim wave002-B        # pending → in_progress
whw done wave002-B --evidence "PR #48, e2e green"
whw block wave002-C --reason "waiting on API key"
```

### WHAT — evidence, not claims

**Gates** are executable checks with GO/NO_GO verdicts and timestamped
checkpoints (`.whw/checkpoints/<gate>/latest.txt`). Two tiers keep CI honest:

- `pr` — blocking and **lean**: planning coverage, ADR linkage, wave sync,
  README sync, agent-adapter parity, secret scan.
- `ops` — on demand: program inventory, evidence quality, `release-readiness`
  (package hygiene; does not publish npm — ADR 0010).

The anti-philosophy is explicit: no gate cascades as maturity theater
(see `docs/why/principles.md`). Every gate failure names the smallest fix.

**Evaluation** is two-phase: deterministic checks (lint/tests/build) run first
at zero AI cost; only then does a model score the weighted rubric
(technical-quality 1.3, originality 1.3, craft 1.0, functionality 1.0 — 0–5,
threshold 3.5). Rejections return the top-3 fixes, not vibes.

**Reporting** closes the loop: every milestone ends with Status / Evidence /
Next step (`whw status`), and `whw metrics` snapshots reproducible numbers
(commits, PRs, ADRs, waves, gates, tests, calendar days).

### Roles — one loop, many models

| Role                  | Context strategy | Handoff files                        |
| --------------------- | ---------------- | ------------------------------------ |
| `planner`             | compaction       | spec, ADRs, wave plan                |
| `builder`             | reset per wave   | `todos.sql`, spec                    |
| `evaluator`           | reset, stateless | contract, evaluation report, rubric  |
| `closer`              | reset            | wave SQL, gates, ADR                 |
| `autonomous-engineer` | SQL is memory    | queue + `plan.md` narrative          |

Roles are tool-neutral Markdown prompts (`roles/`) plus compliant Agent Skills
(`skills/`). `whw run <role>` can invoke your configured CLIs
(`claude`, `codex`, `cursor-agent`, `gemini`, `aider`, …) through an escalation
ladder ending in a human — use it, or bring your own runner. The harness never
requires a specific model.

### Continuity — survive interruptions and tool switches

`whw resume` revalidates git + queue after a reboot or new chat (it does not
claim). `whw handoff --from cursor --to claude` emits a package with the git
baseline, queue snapshot, gate results, and next action. A live package lives
in `docs/handoff/`. Sessions resume from SQL, not from "what were we doing?".
See `docs/how/continuity.md`. Optional config `hooks` (`on_claim`, `on_done`,
`on_gate_fail`, `on_close`) fire after those events without rolling them back.

---

## 📚 Documentation

| Path                        | Contents                                                    |
| --------------------------- | ----------------------------------------------------------- |
| `WHY.md`                    | This project's purpose, non-goals, principles               |
| `AGENTS.md`                 | Canonical agent instructions (+ thin per-tool adapters)     |
| `docs/why/manifesto.md`     | The WHY/HOW/WHAT mapping                                    |
| `docs/why/principles.md`    | Purpose-first, evidence over chat, lean gates, …            |
| `docs/why/positioning.md`   | Six-dimension taxonomy; WHW vs. Spec Kit, OpenSpec, BMAD…   |
| `docs/how/`                 | Waves, programs, ADRs, todos.sql, gates, evidence, continuity, roles, escalation, evaluation, conventions |
| `docs/what/`                | CLI reference, schema, config, templates, adapters, metrics |
| `docs/adr/`                 | WHW's own decisions (0001–0008)                             |
| `docs/plan.md`              | Narrative plan with 5W2H wave entries (this repo, live)     |
| `docs/handoff/`             | Live IDE/agent migration packages (`whw handoff`)           |
| `templates/`                | WHY, AGENTS, ADR, charter, wave SQL, PR, handoff, …         |
| `examples/hello-wave/`      | Minimal end-to-end worked example                           |

---

## 🗺️ Roadmap

- `v0.1.0` — Core harness (Program 001): CLI, SQL planning, gates, roles, skills, docs.
- `v0.1.1` — Publish plumbing (Program 002 wave 007): CI syncs seeds before gates,
  `release.yml` (GitHub Release + npm with provenance), clone-first quick start.
- Next (Program 002 waves 008–011) — checkpoint hygiene, evidence-quality / WIP
  guards, real `whw run` proof, `whw resume` + config hooks, `release-readiness`
  gate and a maintenance policy.
- Later — `whw serve`, live PostgreSQL adapter, `whw migrate` importers, `whw board`,
  translations beyond pt-BR.

Ideas and PRs welcome — charter a wave and go.

---

## 🤝 Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md): claim from `whw queue`, work in
waves, keep PRs small, end milestones with Status / Evidence / Next step.
Security issues: see [SECURITY.md](SECURITY.md) — do not open public issues.

## 📄 License

[MIT](LICENSE) © 2026 Fabio Eloi. See [ACKNOWLEDGMENTS.md](ACKNOWLEDGMENTS.md)
for lineage and attributions.
