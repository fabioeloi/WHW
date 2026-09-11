-- Wave 015 — consumer-proof (ADR 0013)
-- Apply: whw sync wave-015-consumer-proof
-- Refs: wave015-A .. wave015-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done` (runtime also preserves
-- in_progress/blocked/cancelled). Close with `whw close wave-015-consumer-proof`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave015-A', 'Wave 015 A — Plan: consumer-proof', 'pending', 'wave-015-consumer-proof', 1, 'A', '0013', 'Name the two tools for the handoff round-trip. Reproduce or close the `npx @fabioeloi/whw@0.1.1` `whw: command not found` miss.'),
  ('wave015-B', 'Wave 015 B — Build: consumer-proof', 'pending', 'wave-015-consumer-proof', 2, 'B', '0013', 'e2e: fresh temp repo via `init`, run templates/ci-whw.yml steps against the local bin, pr gates GO. Round-trip handoff. Add `gate run --tier pr` to `whw resume`.'),
  ('wave015-C', 'Wave 015 C — Verify: consumer-proof', 'pending', 'wave-015-consumer-proof', 3, 'C', '0013', 'Tests + `whw gate run --tier pr` green. Record both handoff baselines.'),
  ('wave015-D', 'Wave 015 D — Decide: consumer-proof', 'pending', 'wave-015-consumer-proof', 4, 'D', '0013', 'ADR 0013 addendum: consumer path proven; resume now includes pr gates. (ADR 0013)'),
  ('wave015-E', 'Wave 015 E — Close: consumer-proof', 'pending', 'wave-015-consumer-proof', 5, 'E', '0013', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave015-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave015-B', 'wave015-A'),
  ('wave015-C', 'wave015-B'),
  ('wave015-D', 'wave015-C'),
  ('wave015-E', 'wave015-D')
ON CONFLICT DO NOTHING;
