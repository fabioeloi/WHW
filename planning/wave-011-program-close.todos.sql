-- Wave 011 — program-close (ADR 0012)
-- Apply: whw sync wave-011-program-close
-- Refs: wave011-A .. wave011-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done`. Close with `whw close wave-011-program-close`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave011-A', 'Wave 011 A — Plan: program-close', 'pending', 'wave-011-program-close', 1, 'A', '0012', 'Plan in progress: release-readiness ops gate, ADR 0012 Accepted, inventory, metrics, retrospective. Do not tag v0.1.1.'),
  ('wave011-B', 'Wave 011 B — Build: program-close', 'pending', 'wave-011-program-close', 2, 'B', '0012', 'Implement release-readiness (local package hygiene; npm stays unconfirmed). Docs + tests.'),
  ('wave011-C', 'Wave 011 C — Verify: program-close', 'pending', 'wave-011-program-close', 3, 'C', '0012', 'Tests + `whw gate run --tier pr` green.'),
  ('wave011-D', 'Wave 011 D — Decide: program-close', 'pending', 'wave-011-program-close', 4, 'D', '0012', 'Append the ADR addendum recording the decision. (ADR 0012)'),
  ('wave011-E', 'Wave 011 E — Close: program-close', 'pending', 'wave-011-program-close', 5, 'E', '0012', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave011-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave011-B', 'wave011-A'),
  ('wave011-C', 'wave011-B'),
  ('wave011-D', 'wave011-C'),
  ('wave011-E', 'wave011-D')
ON CONFLICT DO NOTHING;
