-- Wave 005 — roles-skills-templates-docs close hook.
-- Applied ONLY by `whw close wave-005-roles-skills-templates-docs` after A–D are terminal, the ADR
-- addendum exists, and the sync gates are GO. Never apply by hand.
UPDATE todos SET status = 'done', evidence = COALESCE(evidence, '') || ' | closed 2026-09-10'
WHERE ref LIKE 'wave005-%' AND status != 'done';
