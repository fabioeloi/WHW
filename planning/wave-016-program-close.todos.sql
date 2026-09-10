-- Wave 016 — program-close (ADR 0013)
-- Apply: whw sync wave-016-program-close
-- Refs: wave016-A .. wave016-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done` (runtime also preserves
-- in_progress/blocked/cancelled). Close with `whw close wave-016-program-close`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave016-A', 'Wave 016 A — Plan: program-close', 'pending', 'wave-016-program-close', 1, 'A', '0013', 'Bump package.json to 0.2.0 + CHANGELOG heading in B, not here. Operator go required before tagging. Do not revoke NPM_TOKEN until OIDC publish succeeds.'),
  ('wave016-B', 'Wave 016 B — Build: program-close', 'pending', 'wave-016-program-close', 2, 'B', '0013', 'package.json 0.2.0, CHANGELOG, README. Maint SHA list for ADR 0012 close-hygiene. No tag in this letter.'),
  ('wave016-C', 'Wave 016 C — Verify: program-close', 'pending', 'wave-016-program-close', 3, 'C', '0013', '`whw gate run --tier pr` GO; `whw gate run --tier ops` GO; `whw metrics --out .whw/metrics.json`.'),
  ('wave016-D', 'Wave 016 D — Decide: program-close', 'pending', 'wave-016-program-close', 4, 'D', '0013', 'Accept ADR 0013; list maint SHAs 2d6387a, 769dda9, 18f6e5c, 348a3fc, 0eaeca7. Retrospective. (ADR 0013)'),
  ('wave016-E', 'Wave 016 E — Close: program-close', 'pending', 'wave-016-program-close', 5, 'E', '0013', '`whw close`; operator tags v0.2.0 after E merges (OIDC publish is the 013 proof); then revoke NPM_TOKEN.')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave016-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave016-B', 'wave016-A'),
  ('wave016-C', 'wave016-B'),
  ('wave016-D', 'wave016-C'),
  ('wave016-E', 'wave016-D')
ON CONFLICT DO NOTHING;
