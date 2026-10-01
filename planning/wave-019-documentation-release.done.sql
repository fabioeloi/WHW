-- Wave 019 — documentation-release close hook.
-- Applied ONLY by `whw close wave-019-documentation-release` after A–D are terminal, the ADR
-- addendum exists, and the sync gates are GO. Never apply by hand.
UPDATE todos SET status = 'done', evidence = COALESCE(evidence, '') || ' | closed 2026-10-01'
WHERE ref LIKE 'wave019-%' AND status != 'done';
