-- Wave 002 — sql-cli-core (ADR 0005)
-- Apply: whw sync wave-002-sql-cli-core
-- Refs: wave002-A .. wave002-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done`. Close with `whw close wave-002-sql-cli-core`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave002-A', 'Wave 002 A — Plan: sql-cli-core', 'pending', 'wave-002-sql-cli-core', 1, 'A', '0005', 'Seed planning + branch per letter. PR A: this seed file.'),
  ('wave002-B', 'Wave 002 B — Build: sql-cli-core', 'pending', 'wave-002-sql-cli-core', 2, 'B', '0005', 'Implement the wave scope. Small PRs only.'),
  ('wave002-C', 'Wave 002 C — Verify: sql-cli-core', 'pending', 'wave-002-sql-cli-core', 3, 'C', '0005', 'Tests + `whw gate run --tier pr` green.'),
  ('wave002-D', 'Wave 002 D — Decide: sql-cli-core', 'pending', 'wave-002-sql-cli-core', 4, 'D', '0005', 'Append the ADR addendum recording the decision. (ADR 0005)'),
  ('wave002-E', 'Wave 002 E — Close: sql-cli-core', 'pending', 'wave-002-sql-cli-core', 5, 'E', '0005', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave002-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave002-B', 'wave002-A'),
  ('wave002-C', 'wave002-B'),
  ('wave002-D', 'wave002-C'),
  ('wave002-E', 'wave002-D')
ON CONFLICT DO NOTHING;
