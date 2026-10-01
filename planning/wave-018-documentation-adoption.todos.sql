-- Wave 018 — documentation-adoption (ADR 0016)
-- Apply: whw sync wave-018-documentation-adoption
-- Refs: wave018-A .. wave018-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done` (runtime also preserves
-- in_progress/blocked/cancelled). Close with `whw close wave-018-documentation-adoption`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave018-A', 'Wave 018 A — Plan: documentation-adoption', 'pending', 'wave-018-documentation-adoption', 1, 'A', '0016', 'Seed planning + branch per letter. PR A: this seed file.'),
  ('wave018-B', 'Wave 018 B — Build: documentation-adoption', 'pending', 'wave-018-documentation-adoption', 2, 'B', '0016', 'Implement the wave scope. Small PRs only.'),
  ('wave018-C', 'Wave 018 C — Verify: documentation-adoption', 'pending', 'wave-018-documentation-adoption', 3, 'C', '0016', 'Tests + `whw gate run --tier pr` green.'),
  ('wave018-D', 'Wave 018 D — Decide: documentation-adoption', 'pending', 'wave-018-documentation-adoption', 4, 'D', '0016', 'Append the ADR addendum recording the decision. (ADR 0016)'),
  ('wave018-E', 'Wave 018 E — Close: documentation-adoption', 'pending', 'wave-018-documentation-adoption', 5, 'E', '0016', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave018-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave018-B', 'wave018-A'),
  ('wave018-C', 'wave018-B'),
  ('wave018-D', 'wave018-C'),
  ('wave018-E', 'wave018-D')
ON CONFLICT DO NOTHING;
