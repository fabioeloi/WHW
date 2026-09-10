-- Wave 013 — trusted-publish (ADR 0014)
-- Apply: whw sync wave-013-trusted-publish
-- Refs: wave013-A .. wave013-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done` (runtime also preserves
-- in_progress/blocked/cancelled). Close with `whw close wave-013-trusted-publish`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave013-A', 'Wave 013 A — Plan: trusted-publish', 'pending', 'wave-013-trusted-publish', 1, 'A', '0014', 'Confirm npm trusted-publisher fields (owner fabioeloi, repo WHW, workflow release.yml). Do not revoke NPM_TOKEN yet.'),
  ('wave013-B', 'Wave 013 B — Build: trusted-publish', 'pending', 'wave-013-trusted-publish', 2, 'B', '0014', 'OIDC-only npm job (drop NODE_AUTH_TOKEN); SECURITY.md; ADR 0012 Dependabot addendum; ops maint-audit gate listing non-trailer commits since last close.'),
  ('wave013-C', 'Wave 013 C — Verify: trusted-publish', 'pending', 'wave-013-trusted-publish', 3, 'C', '0014', 'Tests + `whw gate run --tier pr` green. maint-audit GO on a fixture; do not tag.'),
  ('wave013-D', 'Wave 013 D — Decide: trusted-publish', 'pending', 'wave-013-trusted-publish', 4, 'D', '0014', 'Accept ADR 0014; addendum on ADR 0012 (Dependabot label=maint, one dep per PR). Proof of OIDC publish waits for 016 / v0.2.0. (ADR 0014)'),
  ('wave013-E', 'Wave 013 E — Close: trusted-publish', 'pending', 'wave-013-trusted-publish', 5, 'E', '0014', 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE 'wave013-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
  ('wave013-B', 'wave013-A'),
  ('wave013-C', 'wave013-B'),
  ('wave013-D', 'wave013-C'),
  ('wave013-E', 'wave013-D')
ON CONFLICT DO NOTHING;
