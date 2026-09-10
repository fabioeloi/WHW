-- Wave 005 — roles-skills-templates-docs (ADR 0008)
-- Apply: whw sync wave-005-roles-skills-templates-docs
-- Refs: wave005-A .. wave005-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done`. Close with `whw close wave-005-roles-skills-templates-docs`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave005-A', 'Wave 005 A — Plan: roles-skills-templates-docs', 'pending', 'wave-005-roles-skills-templates-docs', 1, 'A', '0008', 'Seed planning + branch per letter. PR A: this seed file.'),
  ('wave005-B', 'Wave 005 B — Build: roles-skills-templates-docs', 'pending', 'wave-005-roles-skills-templates-docs', 2, 'B', '0008', 'Implement the wave scope. Small PRs only.'),
  ('wave005-C', 'Wave 005 C — Verify: roles-skills-templates-docs', 'pending', 'wave-005-roles-skills-templates-docs', 3, 'C', '0008', 'Tests + `whw gate run --tier pr` green.'),
  ('wave005-D', 'Wave 005 D — Decide: roles-skills-templates-docs', 'pending', 'wave-005-roles-skills-templates-docs', 4, 'D', '0008', 'Append the ADR addendum recording the decision. (ADR 0008)'),
  ('wave005-E', 'Wave 005 E — Close: roles-skills-templates-docs', 'pending', 'wave-005-roles-skills-templates-docs', 5, 'E', '0008', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave005-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave005-B', 'wave005-A'),
  ('wave005-C', 'wave005-B'),
  ('wave005-D', 'wave005-C'),
  ('wave005-E', 'wave005-D')
ON CONFLICT DO NOTHING;
