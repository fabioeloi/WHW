-- SPDX-License-Identifier: MIT
-- WHW planning schema (SQLite) — execution state source of truth.
--
-- Seeds live in versioned planning/*.todos.sql files and are applied with
-- `whw sync`. This database (.whw/state.db) is DERIVED state: it can always
-- be rebuilt from the seeds. Never edit it by hand; use `whw claim|done|...`
-- so every transition is audited in `transitions`.
--
-- Idempotent seed pattern (never downgrade `done`; `whw sync` also restores
-- in_progress/blocked/cancelled after apply):
--   INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
--     ('wave001-A', 'Wave 001 A — Plan …', 'pending', 'wave-001-slug', 1, 'A', '0009', '…')
--   ON CONFLICT (ref) DO UPDATE SET
--     title = excluded.title, track = excluded.track, step = excluded.step,
--     letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
--     updated_at = datetime('now'),
--     status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

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
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS todo_deps (
  ref TEXT NOT NULL REFERENCES todos (ref) ON DELETE CASCADE,
  depends_on TEXT NOT NULL REFERENCES todos (ref) ON DELETE CASCADE,
  PRIMARY KEY (ref, depends_on),
  CHECK (ref <> depends_on)
);

CREATE TABLE IF NOT EXISTS transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  actor TEXT,
  evidence TEXT,
  at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_todos_status ON todos (status);
CREATE INDEX IF NOT EXISTS idx_todos_track ON todos (track);
CREATE INDEX IF NOT EXISTS idx_transitions_ref ON transitions (ref);

-- Keep updated_at fresh on every UPDATE.
CREATE TRIGGER IF NOT EXISTS trg_todos_updated_at
AFTER UPDATE ON todos FOR EACH ROW
BEGIN
  UPDATE todos SET updated_at = datetime('now') WHERE ref = NEW.ref;
END;

-- Actionable work: pending todos whose dependencies are all done/cancelled.
CREATE VIEW IF NOT EXISTS ready AS
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
