# Gates and checkpoints

Gates are executable checks with GO/NO_GO verdicts. They are the difference
between "we follow the process" and "the process is enforced".

## Running gates

```bash
whw gate list              # builtin + custom, with tiers
whw sync --all             # rebuild .whw/state.db (gitignored) from planning/
whw gate run --tier pr     # blocking tier (CI runs this after sync)
whw gate run --tier ops    # on-demand tier
whw gate run <name>        # one gate (also: whw gate <name>)
whw gate run --all         # everything
```

Exit 0 = all GO; exit 1 = any NO_GO. Every run writes a checkpoint:
`.whw/checkpoints/<gate>/<gate>-<stamp>.txt` (local, gitignored) plus a
`latest.txt` copy (tracked) with `PASS` lines, `FAIL` lines, and a final
`status=GO|NO_GO failures=N`.

If `planning/*.todos.sql` seeds exist and `todos` is empty, the runner writes
an `unsynced-state` NO_GO and stops before individual gates can GO vacuously.
Rebuild with `whw sync --all`.

## The two tiers

| Tier | Meaning | Members (default) |
| ---- | ------- | ----------------- |
| `pr` | Blocking, **lean**. Must be GO to merge. | planning-coverage, adr-link, wave-sync, readme-sync, agents-parity, no-secrets |
| `ops` | On demand: closes, releases, drills. | program-inventory, evidence-quality |

The anti-philosophy is explicit: gate cascades as maturity theater are
rejected. A new blocking gate must earn its place by catching real drift with
a failure message naming the smallest fix. When in doubt, it goes to `ops`.

## Built-in gates

- **planning-coverage** — every `planning/*.todos.sql` seed is applied to
  state; wave todos carry an ADR.
- **adr-link** — every wave's ADR resolves to an existing ADR file.
- **wave-sync** — closed waves (E done) have their `.done.sql`, a `docs/plan.md`
  entry, and an ADR addendum. Narrative cannot drift from execution.
- **readme-sync** — README wave-done claims match state; local `.md` links resolve.
- **agents-parity** — expected adapter files exist and defer to `AGENTS.md`.
- **no-secrets** — no private keys, tokens, or secret assignments in tracked
  text files.
- **program-inventory** (`ops`) — waves stay inside chartered ranges; closed
  programs are fully inventoried (seeds + done hooks + terminal todos).
- **evidence-quality** (`ops`) — from wave 007 onward, `done` evidence must
  name a SHA, PR `#N`, a test/gate command (`npm test`, `node --test`,
  `whw gate`, `whw evaluate`, `whw close`), or a `.whw/checkpoints/` path.
  Program 001 rows are not rewritten (`done` is terminal).

## Custom gates

Any shell command can be a gate. Declare it in `whw.config.json`:

```json
{
  "gates": {
    "tiers": { "pr": ["planning-coverage", "my-check"] },
    "custom": [{ "name": "my-check", "command": "npm run my-check", "description": "…" }]
  }
}
```

Exit 0 = GO, anything else = NO_GO (last 15 output lines land in the
checkpoint). Only run gates from repositories you trust — `whw doctor` lists
configured custom gates without executing them.

## Writing a good gate

1. Check one thing. Name it `<domain>-<what>` (`openapi-routes`, `i18n-keys`).
2. Fail with the fix: `wave-003-x: no ## Addendum Wave 003 in 0009-*.md`.
3. Be fast enough for every PR, or be `ops`.
4. Prefer static checks (no services, no network) for `pr`.
5. Ship a test that fails the gate on purpose, then passes it.
