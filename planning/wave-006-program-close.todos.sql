-- Wave 006 — program-close (ADR 0008)
-- Apply: whw sync wave-006-program-close
-- Refs: wave006-A .. wave006-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done`. Close with `whw close wave-006-program-close`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave006-A', 'Wave 006 A — Plan: program-close', 'pending', 'wave-006-program-close', 1, 'A', '0008', 'Seed planning + branch per letter. PR A: this seed file.'),
  ('wave006-B', 'Wave 006 B — Build: program-close', 'pending', 'wave-006-program-close', 2, 'B', '0008', 'Implement the wave scope. Small PRs only.'),
  ('wave006-C', 'Wave 006 C — Verify: program-close', 'pending', 'wave-006-program-close', 3, 'C', '0008', 'Tests + `whw gate run --tier pr` green.'),
  ('wave006-D', 'Wave 006 D — Decide: program-close', 'pending', 'wave-006-program-close', 4, 'D', '0008', 'Append the ADR addendum recording the decision. (ADR 0008)'),
  ('wave006-E', 'Wave 006 E — Close: program-close', 'pending', 'wave-006-program-close', 5, 'E', '0008', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave006-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave006-B', 'wave006-A'),
  ('wave006-C', 'wave006-B'),
  ('wave006-D', 'wave006-C'),
  ('wave006-E', 'wave006-D')
ON CONFLICT DO NOTHING;
