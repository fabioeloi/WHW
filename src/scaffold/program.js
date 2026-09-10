// SPDX-License-Identifier: MIT
/** `whw program new` — charter a program (ADR with wave map + exclusions). */

import { join } from 'node:path';
import { fileExists, localDate, pad3, slugify, writeText } from '../util.js';
import { loadTemplate, render } from './files.js';
import { nextAdrNumber } from './adr.js';
import { nextWaveNumber } from './wave.js';

const FALLBACK_CHARTER = `# ADR {{NUMBER}} — Program: {{TITLE}}

<!-- whw:program slug="{{SLUG}}" waves="{{FIRST}}-{{LAST}}" -->

- **Status:** Proposed
- **Date:** {{DATE}}
- **Waves:** {{FIRST}}–{{LAST}} ({{COUNT}} waves)
- **Related:** WHY.md

## Context

Why this program exists. What outcome closes it?

## Explicit exclusions

Deferred fronts stay OUT until a new ADR reopens them:

| Front | Reason | Revisit in |
| ----- | ------ | ---------- |
| …     | …      | …          |

## Wave map

| Wave | Slug | ADR |
| ---- | ---- | --- |
{{WAVE_MAP}}

> Waves are numbered globally. There is **no wave {{AFTER}}** in this program —
> extension requires a new charter ADR.

## Execution

- One wave = PRs A–E (plan → build → verify → decide → close); a wave is done
  only when **E** merges.
- First wave is documentation-first: charter finalization + planning seeds.
- Final wave is the program close: inventory gate + retrospective addendum.
- Do not start the next wave until \`main\` is green.

## Close criteria

- [ ] Every wave {{FIRST}}–{{LAST}} closed via \`whw close\`
- [ ] \`whw gate run program-inventory\` GO
- [ ] Metrics snapshot recorded (\`whw metrics\`)

## References

- …

<!-- Addenda: append \`## Addendum Wave NNN — <topic>\` per wave D. -->
`;

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdProgramNew(positionals, ctx) {
  const rawSlug = positionals[0];
  if (!rawSlug) throw new Error('usage: whw program new <slug> --waves N');
  const slug = slugify(rawSlug);
  if (!slug) throw new Error(`invalid slug: ${JSON.stringify(rawSlug)}`);
  const count = Number(ctx.flags.waves);
  if (!Number.isInteger(count) || count < 1 || count > 99) {
    throw new Error('whw program new requires --waves N (1–99)');
  }
  const number = nextAdrNumber(ctx.paths.adr);
  const padded = String(number).padStart(4, '0');
  const first = nextWaveNumber(ctx.paths.planning);
  const rows = [];
  for (let i = 0; i < count; i++) {
    rows.push(`| ${pad3(first + i)} | <slug> | ${i === 0 ? padded : 'TBD'} |`);
  }
  const vars = {
    NUMBER: padded, SLUG: slug, TITLE: ctx.flags.title ?? slug, DATE: localDate(),
    STATUS: 'Proposed',
    FIRST: pad3(first), LAST: pad3(first + count - 1), AFTER: pad3(first + count),
    COUNT: String(count), WAVE_MAP: rows.join('\n'),
  };
  const { text } = loadTemplate(ctx, 'program-charter.md', FALLBACK_CHARTER);
  const file = join(ctx.paths.adr, `${padded}-program-${slug}.md`);
  if (fileExists(file)) throw new Error(`ADR already exists: ${file}`);
  writeText(file, render(text, vars));
  if (ctx.json) {
    ctx.log.data({ adr: padded, program: slug, waves: `${vars.FIRST}-${vars.LAST}`, file });
    return 0;
  }
  ctx.log.info(`created ${file} (waves ${vars.FIRST}–${vars.LAST})`);
  ctx.log.info(`next: whw wave new <slug> --adr ${padded}   (first wave is documentation-first)`);
  return 0;
}
