// SPDX-License-Identifier: MIT
/** `whw adr new` — create the next numbered Architecture Decision Record. */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileExists, isDir, localDate, slugify } from '../util.js';
import { loadTemplate, render } from './files.js';

/**
 * @param {string} adrDir
 * @returns {number} next ADR number (max existing + 1, starting at 1)
 */
export function nextAdrNumber(adrDir) {
  if (!isDir(adrDir)) return 1;
  let max = 0;
  for (const f of readdirSync(adrDir)) {
    const m = /^(\d{4})-/.exec(f);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

const FALLBACK_ADR = `# ADR {{NUMBER}} — {{TITLE}}

- **Status:** Proposed
- **Date:** {{DATE}}
- **Wave:** TBD
- **Related:** WHY.md

## Context

Why this decision is needed. What forces are at play?

## Decision

What we decided, stated plainly.

| Rule | Detail |
| ---- | ------ |
| …    | …      |

## Consequences

### Positive

- …

### Negative / trade-offs

- …

## References

- …

<!-- Addenda: append \`## Addendum Wave NNN — <topic>\` per wave D. -->
`;

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdAdrNew(positionals, ctx) {
  const rawSlug = positionals[0];
  if (!rawSlug) throw new Error('usage: whw adr new <slug> [--title T]');
  const slug = slugify(rawSlug);
  if (!slug) throw new Error(`invalid slug: ${JSON.stringify(rawSlug)}`);
  const number = nextAdrNumber(ctx.paths.adr);
  const padded = String(number).padStart(4, '0');
  const file = join(ctx.paths.adr, `${padded}-${slug}.md`);
  if (fileExists(file)) throw new Error(`ADR already exists: ${file}`);
  const { text } = loadTemplate(ctx, 'adr.md', FALLBACK_ADR);
  const title = ctx.flags.title ?? slug;
  const { writeText } = await import('../util.js');
  writeText(file, render(text, { NUMBER: padded, SLUG: slug, TITLE: title, DATE: localDate(), STATUS: 'Proposed' }));
  if (ctx.json) {
    ctx.log.data({ adr: padded, file });
    return 0;
  }
  ctx.log.info(`created ${file}`);
  ctx.log.info(`next: charter waves with \`whw wave new <slug> --adr ${padded}\``);
  return 0;
}
