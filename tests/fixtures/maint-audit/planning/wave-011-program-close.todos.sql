-- Fixture for maint-audit verification (wave 013 C).
-- Only wave011-E is applied in tests; file exists so listWaveFiles finds program-close.

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
  ('wave011-E', 'Wave 011 E — Close: program-close', 'done', 'wave-011-program-close', 5, 'E', '0012', 'fixture baseline')
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;
