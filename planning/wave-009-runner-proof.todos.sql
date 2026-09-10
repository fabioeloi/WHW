-- Wave 009 — runner-proof (ADR 0009)
-- Apply: whw sync wave-009-runner-proof
-- Refs: wave009-A .. wave009-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done`. Close with `whw close wave-009-runner-proof`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave009-A', 'Wave 009 A — Plan: runner-proof', 'pending', 'wave-009-runner-proof', 1, 'A', '0009', 'Seed planning + branch per letter. PR A: this seed file.'),
  ('wave009-B', 'Wave 009 B — Build: runner-proof', 'pending', 'wave-009-runner-proof', 2, 'B', '0009', 'Implement the wave scope. Small PRs only.'),
  ('wave009-C', 'Wave 009 C — Verify: runner-proof', 'pending', 'wave-009-runner-proof', 3, 'C', '0009', 'Tests + `whw gate run --tier pr` green.'),
  ('wave009-D', 'Wave 009 D — Decide: runner-proof', 'pending', 'wave-009-runner-proof', 4, 'D', '0009', 'Append the ADR addendum recording the decision. (ADR 0009)'),
  ('wave009-E', 'Wave 009 E — Close: runner-proof', 'pending', 'wave-009-runner-proof', 5, 'E', '0009', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave009-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave009-B', 'wave009-A'),
  ('wave009-C', 'wave009-B'),
  ('wave009-D', 'wave009-C'),
  ('wave009-E', 'wave009-D')
ON CONFLICT DO NOTHING;
