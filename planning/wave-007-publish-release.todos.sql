-- Wave 007 — publish-release (ADR 0010)
-- Apply: whw sync wave-007-publish-release
-- Refs: wave007-A .. wave007-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done`. Close with `whw close wave-007-publish-release`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave007-A', 'Wave 007 A — Plan: publish-release', 'pending', 'wave-007-publish-release', 1, 'A', '0010', 'Charter ADR 0009, thematic ADRs 0010–0012, seeds 007–011, plan.md 5W2H, note on wave006-E. Stop before B.'),
  ('wave007-B', 'Wave 007 B — Build: publish-release', 'pending', 'wave-007-publish-release', 2, 'B', '0010', 'Implement the wave scope. Small PRs only.'),
  ('wave007-C', 'Wave 007 C — Verify: publish-release', 'pending', 'wave-007-publish-release', 3, 'C', '0010', 'Tests + `whw gate run --tier pr` green.'),
  ('wave007-D', 'Wave 007 D — Decide: publish-release', 'pending', 'wave-007-publish-release', 4, 'D', '0010', 'Append the ADR addendum recording the decision. (ADR 0010)'),
  ('wave007-E', 'Wave 007 E — Close: publish-release', 'pending', 'wave-007-publish-release', 5, 'E', '0010', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave007-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave007-B', 'wave007-A'),
  ('wave007-C', 'wave007-B'),
  ('wave007-D', 'wave007-C'),
  ('wave007-E', 'wave007-D')
ON CONFLICT DO NOTHING;
