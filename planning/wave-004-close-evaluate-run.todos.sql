-- Wave 004 — close-evaluate-run (ADR 0004)
-- Apply: whw sync wave-004-close-evaluate-run
-- Refs: wave004-A .. wave004-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done`. Close with `whw close wave-004-close-evaluate-run`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave004-A', 'Wave 004 A — Plan: close-evaluate-run', 'pending', 'wave-004-close-evaluate-run', 1, 'A', '0004', 'Seed planning + branch per letter. PR A: this seed file.'),
  ('wave004-B', 'Wave 004 B — Build: close-evaluate-run', 'pending', 'wave-004-close-evaluate-run', 2, 'B', '0004', 'Implement the wave scope. Small PRs only.'),
  ('wave004-C', 'Wave 004 C — Verify: close-evaluate-run', 'pending', 'wave-004-close-evaluate-run', 3, 'C', '0004', 'Tests + `whw gate run --tier pr` green.'),
  ('wave004-D', 'Wave 004 D — Decide: close-evaluate-run', 'pending', 'wave-004-close-evaluate-run', 4, 'D', '0004', 'Append the ADR addendum recording the decision. (ADR 0004)'),
  ('wave004-E', 'Wave 004 E — Close: close-evaluate-run', 'pending', 'wave-004-close-evaluate-run', 5, 'E', '0004', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave004-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave004-B', 'wave004-A'),
  ('wave004-C', 'wave004-B'),
  ('wave004-D', 'wave004-C'),
  ('wave004-E', 'wave004-D')
ON CONFLICT DO NOTHING;
