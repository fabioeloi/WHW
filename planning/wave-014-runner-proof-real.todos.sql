-- Wave 014 — runner-proof-real (ADR 0013)
-- Apply: whw sync wave-014-runner-proof-real
-- Refs: wave014-A .. wave014-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done` (runtime also preserves
-- in_progress/blocked/cancelled). Close with `whw close wave-014-runner-proof-real`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave014-A', 'Wave 014 A — Plan: runner-proof-real', 'pending', 'wave-014-runner-proof-real', 1, 'A', '0013', 'Codex CLI 0.156.0 installed, ChatGPT login observed 2026-10-01; select gpt-6.1-sol / low. Plan docs/how/runner-proof-real.md. Stop before B; no inference at A.'),
  ('wave014-B', 'Wave 014 B — Build: runner-proof-real', 'pending', 'wave-014-runner-proof-real', 2, 'B', '0013', 'Follow docs/how/runner-proof-real.md: isolated real Codex builder run, fresh session, gpt-6.1-sol / low, one attempt with external 20-minute deadline; doctor PATH discovery; tests for handoff/close/metrics/adapters; additive costClass aggregates with explicit unknowns. No nested runners/subagents. Independently verify SQL done/evidence, diff, tests and gates; CLI exit 0 alone is insufficient.'),
  ('wave014-C', 'Wave 014 C — Verify: runner-proof-real', 'pending', 'wave-014-runner-proof-real', 3, 'C', '0013', 'npm test, doctor, Phase A and PR gates green; isolated metrics snapshot and independent SQL/evidence postconditions per docs/how/runner-proof-real.md. Retain real-run logs and sanitized tail for D; no fabricated inference proof.'),
  ('wave014-D', 'Wave 014 D — Decide: runner-proof-real', 'pending', 'wave-014-runner-proof-real', 4, 'D', '0013', 'ADR 0013 addendum with the run log tail (CLI, exit, durationMs, costClass). (ADR 0013)'),
  ('wave014-E', 'Wave 014 E — Close: runner-proof-real', 'pending', 'wave-014-runner-proof-real', 5, 'E', '0013', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave014-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave014-B', 'wave014-A'),
  ('wave014-C', 'wave014-B'),
  ('wave014-D', 'wave014-C'),
  ('wave014-E', 'wave014-D')
ON CONFLICT DO NOTHING;
