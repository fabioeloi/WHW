-- Wave 018 — documentation-adoption close hook.
-- Applied ONLY by `whw close wave-018-documentation-adoption` after A–D are terminal, the ADR
-- addendum exists, and the sync gates are GO. Never apply by hand.
UPDATE todos SET status = 'done', evidence = COALESCE(evidence, '') || ' | closed 2026-10-01'
WHERE ref LIKE 'wave018-%' AND status != 'done';
