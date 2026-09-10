-- Wave 003 — scaffolds-gates (ADR 0006)
-- Apply: whw sync wave-003-scaffolds-gates
-- Refs: wave003-A .. wave003-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done`. Close with `whw close wave-003-scaffolds-gates`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave003-A', 'Wave 003 A — Plan: scaffolds-gates', 'pending', 'wave-003-scaffolds-gates', 1, 'A', '0006', 'Seed planning + branch per letter. PR A: this seed file.'),
  ('wave003-B', 'Wave 003 B — Build: scaffolds-gates', 'pending', 'wave-003-scaffolds-gates', 2, 'B', '0006', 'Implement the wave scope. Small PRs only.'),
  ('wave003-C', 'Wave 003 C — Verify: scaffolds-gates', 'pending', 'wave-003-scaffolds-gates', 3, 'C', '0006', 'Tests + `whw gate run --tier pr` green.'),
  ('wave003-D', 'Wave 003 D — Decide: scaffolds-gates', 'pending', 'wave-003-scaffolds-gates', 4, 'D', '0006', 'Append the ADR addendum recording the decision. (ADR 0006)'),
  ('wave003-E', 'Wave 003 E — Close: scaffolds-gates', 'pending', 'wave-003-scaffolds-gates', 5, 'E', '0006', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave003-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave003-B', 'wave003-A'),
  ('wave003-C', 'wave003-B'),
  ('wave003-D', 'wave003-C'),
  ('wave003-E', 'wave003-D')
ON CONFLICT DO NOTHING;
