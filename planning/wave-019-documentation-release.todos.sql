-- Wave 019 — documentation-release (ADR 0017)
-- Apply: whw sync wave-019-documentation-release
-- Refs: wave019-A .. wave019-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done` (runtime also preserves
-- in_progress/blocked/cancelled). Close with `whw close wave-019-documentation-release`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave019-A', 'Wave 019 A — Plan: documentation-release', 'pending', 'wave-019-documentation-release', 1, 'A', '0017', 'Seed planning + branch per letter. PR A: this seed file.'),
  ('wave019-B', 'Wave 019 B — Build: documentation-release', 'pending', 'wave-019-documentation-release', 2, 'B', '0017', 'Implement the wave scope. Small PRs only.'),
  ('wave019-C', 'Wave 019 C — Verify: documentation-release', 'pending', 'wave-019-documentation-release', 3, 'C', '0017', 'Tests + `whw gate run --tier pr` green.'),
  ('wave019-D', 'Wave 019 D — Decide: documentation-release', 'pending', 'wave-019-documentation-release', 4, 'D', '0017', 'Append the ADR addendum recording the decision. (ADR 0017)'),
  ('wave019-E', 'Wave 019 E — Close: documentation-release', 'pending', 'wave-019-documentation-release', 5, 'E', '0017', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave019-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave019-B', 'wave019-A'),
  ('wave019-C', 'wave019-B'),
  ('wave019-D', 'wave019-C'),
  ('wave019-E', 'wave019-D')
ON CONFLICT DO NOTHING;
