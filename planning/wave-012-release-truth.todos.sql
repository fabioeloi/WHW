-- Wave 012 — release-truth (ADR 0013)
-- Apply: whw sync wave-012-release-truth
-- Refs: wave012-A .. wave012-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done` (runtime also preserves
-- in_progress/blocked/cancelled). Close with `whw close wave-012-release-truth`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave012-A', 'Wave 012 A — Plan: release-truth', 'pending', 'wave-012-release-truth', 1, 'A', '0013', 'Charter ADR 0013, Proposed ADR 0014, seeds 012–016, plan.md 5W2H, note on wave007-B. Stop before B.'),
  ('wave012-B', 'Wave 012 B — Build: release-truth', 'pending', 'wave-012-release-truth', 2, 'B', '0013', 'Fold CHANGELOG 008–011 under [0.1.1] with lag note; tighten release-readiness (Unreleased empty at tag, bin without ./, git+ repository.url); release.yml notes from CHANGELOG; deterministic latest.txt; untrack evaluation-report.json; ops checkpoint policy; stale docs (§2.9). No version bump, no re-tag.'),
  ('wave012-C', 'Wave 012 C — Verify: release-truth', 'pending', 'wave-012-release-truth', 3, 'C', '0013', 'Tests + `whw gate run --tier pr` green. Prove a GO gate run leaves the tree clean of checkpoint churn.'),
  ('wave012-D', 'Wave 012 D — Decide: release-truth', 'pending', 'wave-012-release-truth', 4, 'D', '0013', 'Addenda on ADR 0010 (notes match CHANGELOG; release-readiness) and ADR 0011 (deterministic latest.txt). (ADR 0013)'),
  ('wave012-E', 'Wave 012 E — Close: release-truth', 'pending', 'wave-012-release-truth', 5, 'E', '0013', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave012-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave012-B', 'wave012-A'),
  ('wave012-C', 'wave012-B'),
  ('wave012-D', 'wave012-C'),
  ('wave012-E', 'wave012-D')
ON CONFLICT DO NOTHING;
