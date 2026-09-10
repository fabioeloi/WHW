-- SPDX-License-Identifier: MIT
-- WHW planning schema (PostgreSQL) — optional adapter for teams that already
-- run Postgres. Same tables, views, and semantics as sql/schema.sqlite.sql.
-- The default backend is SQLite (.whw/state.db); use this schema only when a
-- shared database is genuinely needed.
--
-- Idempotent seed pattern (never downgrade `done`):
--   INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
--     ('wave001-A', 'Wave 001 A — Plan …', 'pending', 'wave-001-slug', 1, 'A', '0009', '…')
--   ON CONFLICT (ref) DO UPDATE SET
--     title = EXCLUDED.title, track = EXCLUDED.track, step = EXCLUDED.step,
--     letter = EXCLUDED.letter, adr = EXCLUDED.adr, notes = EXCLUDED.notes,
--     updated_at = now(),
--     status = CASE WHEN todos.status = 'done' THEN todos.status ELSE EXCLUDED.status END;

CREATE TABLE IF NOT EXISTS todos (
  ref TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'done', 'blocked', 'cancelled')),
  track TEXT NOT NULL,
  step INTEGER NOT NULL CHECK (step BETWEEN 1 AND 999),
  letter TEXT CHECK (letter IS NULL OR letter IN ('A', 'B', 'C', 'D', 'E')),
  adr TEXT,
  notes TEXT,
  evidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS todo_deps (
  ref TEXT NOT NULL REFERENCES todos (ref) ON DELETE CASCADE,
  depends_on TEXT NOT NULL REFERENCES todos (ref) ON DELETE CASCADE,
  PRIMARY KEY (ref, depends_on),
  CHECK (ref <> depends_on)
);

CREATE TABLE IF NOT EXISTS transitions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ref TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor TEXT,
  evidence TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_todos_status ON todos (status);
CREATE INDEX IF NOT EXISTS idx_todos_track ON todos (track);
CREATE INDEX IF NOT EXISTS idx_transitions_ref ON transitions (ref);

-- Keep updated_at fresh on every UPDATE.
CREATE OR REPLACE FUNCTION whw_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_todos_updated_at ON todos;
CREATE TRIGGER trg_todos_updated_at
BEFORE UPDATE ON todos FOR EACH ROW
EXECUTE FUNCTION whw_touch_updated_at();

-- Actionable work: pending todos whose dependencies are all done/cancelled.
CREATE OR REPLACE VIEW ready AS
SELECT t.*
FROM todos t
WHERE t.status = 'pending'
  AND NOT EXISTS (
    SELECT 1
    FROM todo_deps d
    JOIN todos p ON p.ref = d.depends_on
    WHERE d.ref = t.ref
      AND p.status NOT IN ('done', 'cancelled')
  );
