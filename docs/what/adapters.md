# Adapters reference

One canonical instruction file, many tools. `AGENTS.md` at the repo root is
the source of truth; `whw adapters sync` generates thin pointer files so each
agent finds it.

## Tool matrix

| Tool | Pointer file(s) | Native? |
| ---- | --------------- | ------- |
| Claude Code | `CLAUDE.md` (`@AGENTS.md` import) | reads `CLAUDE.md` |
| Gemini CLI | `GEMINI.md` + `.gemini/settings.json` (`context.fileName`) | reads `GEMINI.md` |
| GitHub Copilot | `.github/copilot-instructions.md` | yes |
| Cursor | `.cursor/rules/whw.mdc` | yes (`AGENTS.md` + rules) |
| Windsurf | `.windsurfrules` | yes |
| Codex | — | yes (`AGENTS.md`, root + nested, 32 KiB cap) |
| OpenCode | — | yes (`AGENTS.md`) |
| Aider | — | pass `--read AGENTS.md` |

```bash
whw adapters sync                         # default five file-backed tools
whw adapters sync --tools claude,cursor   # subset
```

Every sync writes `.whw/adapters.json` (`{tools, files, updatedAt}`), which
the `agents-parity` gate verifies: each expected file must exist and reference
`AGENTS.md`. Without a manifest, the gate falls back to `adapters.tools` in
`whw.config.json`, then to the default five.

## Pointer discipline

- Pointers are WHW-managed: they carry a header saying so and contain no
  unique instructions. Unique content belongs in `AGENTS.md`.
- Regenerate (don't hand-edit) with `whw adapters sync [--force]`.
- Tool-specific behavior that `AGENTS.md` cannot express (Cursor glob-scoped
  rules, Copilot review prompts) lives in the tool's native file *in addition*
  to the pointer — and must still defer to `AGENTS.md` for process.
- Nested `AGENTS.md` files (per package/directory) are honored by most tools;
  keep the root canonical and let nested files add, not contradict.
