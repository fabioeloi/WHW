-- Wave 002 — sql-cli-core close hook.
-- Applied ONLY by `whw close wave-002-sql-cli-core` after A–D are terminal, the ADR
-- addendum exists, and the sync gates are GO. Never apply by hand.
UPDATE todos SET status = 'done', evidence = COALESCE(evidence, '') || ' | closed 2026-09-10'
WHERE ref LIKE 'wave002-%' AND status != 'done';
