-- Wave 014 — runner-proof-real (ADR 0013)
-- Apply: whw sync wave-014-runner-proof-real
-- Refs: wave014-A .. wave014-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done` (runtime also preserves
-- in_progress/blocked/cancelled). Close with `whw close wave-014-runner-proof-real`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave014-A', 'Wave 014 A — Plan: runner-proof-real', 'pending', 'wave-014-runner-proof-real', 1, 'A', '0013', 'Confirm which agent CLI is installed for the real run. doctor should detect installed runners.'),
  ('wave014-B', 'Wave 014 B — Build: runner-proof-real', 'pending', 'wave-014-runner-proof-real', 2, 'B', '0013', '`whw run builder --ref wave014-B` with a real CLI; unit tests for handoff.js, close.js, metrics.js, adapters.js; surface costClass in `whw metrics`.'),
  ('wave014-C', 'Wave 014 C — Verify: runner-proof-real', 'pending', 'wave-014-runner-proof-real', 3, 'C', '0013', 'Tests + `whw gate run --tier pr` green. Keep `.whw/runs/*.log` tail for the D addendum (runs/ is gitignored).'),
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
