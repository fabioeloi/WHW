-- Wave 013 — trusted-publish (ADR 0014)
-- Apply: whw sync wave-013-trusted-publish
-- Refs: wave013-A .. wave013-E (chain A→B→C→D→E)
-- Idempotent: re-syncing never downgrades `done` (runtime also preserves
-- in_progress/blocked/cancelled). Close with `whw close wave-013-trusted-publish`.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave013-A', 'Wave 013 A — Plan: trusted-publish', 'pending', 'wave-013-trusted-publish', 1, 'A', '0014', 'Confirm npm form: user fabioeloi, repo WHW, filename release.yml, empty environment, allow npm publish (not stage-only). Do not revoke NPM_TOKEN. Stop before B.'),
  ('wave013-B', 'Wave 013 B — Build: trusted-publish', 'pending', 'wave-013-trusted-publish', 2, 'B', '0014', 'Drop NODE_AUTH_TOKEN from npm job; keep id-token write; SECURITY.md OIDC path; builtin maint-audit ops gate (since 3e1563c); ADR 0012 Dependabot addendum drafted (Accepted at D). Operator must save npm trusted-publisher row before any tag.'),
  ('wave013-C', 'Wave 013 C — Verify: trusted-publish', 'pending', 'wave-013-trusted-publish', 3, 'C', '0014', 'Tests + `whw gate run --tier pr` green. maint-audit GO on a fixture (trailer vs chore(deps) vs naked commit). Do not tag, do not revoke token.'),
  ('wave013-D', 'Wave 013 D — Decide: trusted-publish', 'pending', 'wave-013-trusted-publish', 4, 'D', '0014', 'Accept ADR 0014; ADR 0012 addendum: Dependabot chore(deps)+maint label is maint, one dep per PR. OIDC proof waits for 016 / v0.2.0. (ADR 0014)'),
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
