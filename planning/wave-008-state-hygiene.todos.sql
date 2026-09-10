-- Wave 008 — state-hygiene (ADR 0011)
-- Apply: whw sync wave-008-state-hygiene
-- Refs: wave008-A .. wave008-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done`. Close with `whw close wave-008-state-hygiene`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave008-A', 'Wave 008 A — Plan: state-hygiene', 'pending', 'wave-008-state-hygiene', 1, 'A', '0011', 'Seed planning + branch per letter. PR A: this seed file.'),
  ('wave008-B', 'Wave 008 B — Build: state-hygiene', 'pending', 'wave-008-state-hygiene', 2, 'B', '0011', 'Implement the wave scope. Small PRs only.'),
  ('wave008-C', 'Wave 008 C — Verify: state-hygiene', 'pending', 'wave-008-state-hygiene', 3, 'C', '0011', 'Tests + `whw gate run --tier pr` green.'),
  ('wave008-D', 'Wave 008 D — Decide: state-hygiene', 'pending', 'wave-008-state-hygiene', 4, 'D', '0011', 'Append the ADR addendum recording the decision. (ADR 0011)'),
  ('wave008-E', 'Wave 008 E — Close: state-hygiene', 'pending', 'wave-008-state-hygiene', 5, 'E', '0011', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave008-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave008-B', 'wave008-A'),
  ('wave008-C', 'wave008-B'),
  ('wave008-D', 'wave008-C'),
  ('wave008-E', 'wave008-D')
ON CONFLICT DO NOTHING;
