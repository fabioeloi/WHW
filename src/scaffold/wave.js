// SPDX-License-Identifier: MIT
/** `whw wave new` — scaffold a wave's planning seeds (A–E todos + done hook). */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileExists, isDir, localDate, pad3, slugify, writeText } from '../util.js';
import { loadTemplate, render } from './files.js';

/**
 * @param {string} planningDir
 * @returns {number} next wave number (max existing + 1, starting at 1)
 */
export function nextWaveNumber(planningDir) {
  if (!isDir(planningDir)) return 1;
  let max = 0;
  for (const f of readdirSync(planningDir)) {
    const m = /^wave-(\d{3,})/.exec(f);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

/**
 * @param {string} adrDir
 * @param {string} adr digits, e.g. "0009" or "9"
 * @returns {string|null} padded ADR number if a matching file exists
 */
export function resolveAdr(adrDir, adr) {
  const digits = String(adr).replace(/\D/g, '').padStart(4, '0');
  if (!isDir(adrDir)) return null;
  const found = readdirSync(adrDir).some((f) => f.startsWith(`${digits}-`));
  return found ? digits : null;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const VERBS = { A: 'Plan', B: 'Build', C: 'Verify', D: 'Decide', E: 'Close' };
const NOTES = {
  A: 'Seed planning + branch per letter. PR A: this seed file.',
  B: 'Implement the wave scope. Small PRs only.',
  C: 'Tests + `whw gate run --tier pr` green.',
  D: 'Append the ADR addendum recording the decision.',
  E: 'Run `whw close <wave>` (applies the .done.sql, runs sync gates).',
};

/**
 * @param {{ wave: string, refPrefix: string, track: string, slug: string, adr: string }} w
 * @returns {{ rows: string, deps: string }}
 */
export function buildWaveSeedSql(w) {
  const rows = LETTERS.map((letter, i) => {
    const ref = `${w.refPrefix}-${letter}`;
    const title = `Wave ${w.wave} ${letter} — ${VERBS[letter]}: ${w.slug}`;
    const note = letter === 'D' ? `${NOTES[letter]} (ADR ${w.adr})` : NOTES[letter];
    return `  ('${ref}', '${title.replace(/'/g, "''")}', 'pending', '${w.track}', ${i + 1}, '${letter}', '${w.adr}', '${note}')`;
  }).join(',\n');
  const deps = LETTERS.slice(1)
    .map((letter, i) => `  ('${w.refPrefix}-${letter}', '${w.refPrefix}-${LETTERS[i]}')`)
    .join(',\n');
  return { rows, deps };
}

const FALLBACK_TODOS = `-- Wave {{WAVE}} — {{SLUG}} (ADR {{ADR}})
-- Apply: whw sync {{TRACK}}
-- Refs: {{REF_PREFIX}}-A .. {{REF_PREFIX}}-E (chain A→B→C→D→E)

INSERT INTO todos (ref, title, status, track, step, letter, adr, notes) VALUES
{{ROWS}}
ON CONFLICT (ref) DO UPDATE SET
  title = excluded.title, track = excluded.track, step = excluded.step,
  letter = excluded.letter, adr = excluded.adr, notes = excluded.notes,
  status = CASE WHEN todos.status = 'done' THEN todos.status ELSE excluded.status END;

DELETE FROM todo_deps WHERE ref LIKE '{{REF_PREFIX}}-%';
INSERT INTO todo_deps (ref, depends_on) VALUES
{{DEPS}}
ON CONFLICT DO NOTHING;
`;

const FALLBACK_DONE = `-- Wave {{WAVE}} — {{SLUG}} close hook (applied by \`whw close {{TRACK}}\`)
UPDATE todos SET status = 'done', evidence = COALESCE(evidence, '') || ' | closed {{DATE}}'
WHERE ref LIKE '{{REF_PREFIX}}-%' AND status != 'done';
`;

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdWaveNew(positionals, ctx) {
  const rawSlug = positionals[0];
  if (!rawSlug) throw new Error('usage: whw wave new <slug> --adr NNNN');
  const slug = slugify(rawSlug);
  if (!slug) throw new Error(`invalid slug: ${JSON.stringify(rawSlug)}`);
  const adrFlag = ctx.flags.adr;
  if (!adrFlag) throw new Error('whw wave new requires --adr NNNN (no wave without an ADR)');
  const adr = resolveAdr(ctx.paths.adr, adrFlag);
  if (!adr && !ctx.flags.force) {
    throw new Error(`no ADR ${adrFlag} in ${ctx.paths.adr} (create it with \`whw adr new <slug>\`, or pass --force)`);
  }
  const n = nextWaveNumber(ctx.paths.planning);
  const wave = pad3(n);
  const track = `wave-${wave}-${slug}`;
  const refPrefix = `wave${wave}`;
  const vars = {
    WAVE: wave, TRACK: track, REF_PREFIX: refPrefix, SLUG: slug,
    ADR: adr ?? String(adrFlag).padStart(4, '0'), DATE: localDate(),
  };
  const { rows, deps } = buildWaveSeedSql({ wave, refPrefix, track, slug, adr: vars.ADR });
  const todosTpl = loadTemplate(ctx, 'wave.todos.sql', FALLBACK_TODOS);
  const doneTpl = loadTemplate(ctx, 'wave.done.sql', FALLBACK_DONE);
  const todosFile = join(ctx.paths.planning, `${track}.todos.sql`);
  const doneFile = join(ctx.paths.planning, `${track}.done.sql`);
  if (fileExists(todosFile) && !ctx.flags.force) throw new Error(`wave already exists: ${todosFile}`);
  writeText(todosFile, render(todosTpl.text, { ...vars, ROWS: rows, DEPS: deps }));
  writeText(doneFile, render(doneTpl.text, vars));
  if (ctx.json) {
    ctx.log.data({ wave, track, adr: vars.ADR, todos: todosFile, done: doneFile });
    return 0;
  }
  ctx.log.info(`created ${todosFile}`);
  ctx.log.info(`created ${doneFile}`);
  ctx.log.info(`next: whw sync ${track} && whw queue --track ${track}`);
  ctx.log.info(`branches: feat/wave-${wave}-${slug}-a … docs/wave-${wave}-${slug}-e`);
  return 0;
}
