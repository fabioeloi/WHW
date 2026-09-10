-- Wave 004 — close-evaluate-run close hook.
-- Applied ONLY by `whw close wave-004-close-evaluate-run` after A–D are terminal, the ADR
-- addendum exists, and the sync gates are GO. Never apply by hand.
UPDATE todos SET status = 'done', evidence = COALESCE(evidence, '') || ' | closed 2026-09-10'
WHERE ref LIKE 'wave004-%' AND status != 'done';
