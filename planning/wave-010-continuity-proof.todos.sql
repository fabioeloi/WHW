-- Wave 010 — continuity-proof (ADR 0009)
-- Apply: whw sync wave-010-continuity-proof
-- Refs: wave010-A .. wave010-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done`. Close with `whw close wave-010-continuity-proof`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave010-A', 'Wave 010 A — Plan: continuity-proof', 'pending', 'wave-010-continuity-proof', 1, 'A', '0009', 'Plan in progress: whw resume, live docs/handoff, hooks on_claim/on_done/on_gate_fail/on_close. ADR 0009.'),
  ('wave010-B', 'Wave 010 B — Build: continuity-proof', 'pending', 'wave-010-continuity-proof', 2, 'B', '0009', 'Implement resume + hooks + committed handoff. Tests for each.'),
  ('wave010-C', 'Wave 010 C — Verify: continuity-proof', 'pending', 'wave-010-continuity-proof', 3, 'C', '0009', 'Tests + `whw gate run --tier pr` green.'),
  ('wave010-D', 'Wave 010 D — Decide: continuity-proof', 'pending', 'wave-010-continuity-proof', 4, 'D', '0009', 'Append the ADR addendum recording the decision. (ADR 0009)'),
  ('wave010-E', 'Wave 010 E — Close: continuity-proof', 'pending', 'wave-010-continuity-proof', 5, 'E', '0009', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave010-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave010-B', 'wave010-A'),
  ('wave010-C', 'wave010-B'),
  ('wave010-D', 'wave010-C'),
  ('wave010-E', 'wave010-D')
ON CONFLICT DO NOTHING;
