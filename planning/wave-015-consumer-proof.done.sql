-- Wave 015 — consumer-proof close hook.
-- Applied ONLY by `whw close wave-015-consumer-proof` after A–D are terminal, the ADR
-- addendum exists, and the sync gates are GO. Never apply by hand.
UPDATE todos SET status = 'done', evidence = COALESCE(evidence, '') || ' | closed 2026-09-10'
WHERE ref LIKE 'wave015-%' AND status != 'done';
