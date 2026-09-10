-- Wave 001 — repo-scaffold (ADR 0001)
-- Apply: whw sync wave-001-repo-scaffold
-- Refs: wave001-A .. wave001-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done`. Close with `whw close wave-001-repo-scaffold`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave001-A', 'Wave 001 A — Plan: repo-scaffold', 'pending', 'wave-001-repo-scaffold', 1, 'A', '0001', 'Seed planning + branch per letter. PR A: this seed file.'),
  ('wave001-B', 'Wave 001 B — Build: repo-scaffold', 'pending', 'wave-001-repo-scaffold', 2, 'B', '0001', 'Implement the wave scope. Small PRs only.'),
  ('wave001-C', 'Wave 001 C — Verify: repo-scaffold', 'pending', 'wave-001-repo-scaffold', 3, 'C', '0001', 'Tests + `whw gate run --tier pr` green.'),
  ('wave001-D', 'Wave 001 D — Decide: repo-scaffold', 'pending', 'wave-001-repo-scaffold', 4, 'D', '0001', 'Append the ADR addendum recording the decision. (ADR 0001)'),
  ('wave001-E', 'Wave 001 E — Close: repo-scaffold', 'pending', 'wave-001-repo-scaffold', 5, 'E', '0001', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave001-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave001-B', 'wave001-A'),
  ('wave001-C', 'wave001-B'),
  ('wave001-D', 'wave001-C'),
  ('wave001-E', 'wave001-D')
ON CONFLICT DO NOTHING;
