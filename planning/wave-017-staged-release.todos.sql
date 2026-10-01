-- Wave 017 — staged-release (ADR 0015)
-- Apply: whw sync wave-017-staged-release
-- Refs: wave017-A .. wave017-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done` (runtime also preserves
-- in_progress/blocked/cancelled). Close with `whw close wave-017-staged-release`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave017-A', 'Wave 017 A — Plan: staged-release', 'pending', 'wave-017-staged-release', 1, 'A', '0015', 'Charter ADR 0015, seed A–E and document immutable 0.2.0 recovery. Plan-only PR A.'),
  ('wave017-B', 'Wave 017 B — Build: staged-release', 'pending', 'wave-017-staged-release', 2, 'B', '0015', 'Stage-only release.yml with dispatch recovery pinned to v0.2.0 SHA, supported npm version, validation, least privilege and operator runbook. No tag mutation or automatic approval.'),
  ('wave017-C', 'Wave 017 C — Verify: staged-release', 'pending', 'wave-017-staged-release', 3, 'C', '0015', 'Test invalid recovery refs and package metadata; suite and PR gates GO. Capture staging separately from operator 2FA approval; verify registry integrity/provenance and release notes.'),
  ('wave017-D', 'Wave 017 D — Decide: staged-release', 'pending', 'wave-017-staged-release', 4, 'D', '0015', 'Accept or reject ADR 0015 using actual staging and publication proof; record credential disposition.'),
  ('wave017-E', 'Wave 017 E — Close: staged-release', 'pending', 'wave-017-staged-release', 5, 'E', '0015', 'Close after accepted publication proof, inventory and metrics; do not downgrade prior waves.')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave017-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave017-B', 'wave017-A'),
  ('wave017-C', 'wave017-B'),
  ('wave017-D', 'wave017-C'),
  ('wave017-E', 'wave017-D')
ON CONFLICT DO NOTHING;
