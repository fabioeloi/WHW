// SPDX-License-Identifier: MIT
/** `whw wave new` — scaffold a wave's planning seeds (A–E todos + done hook). */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { classify, lettersFor, parseSignals, policyFor, processProfile, writeWaveRisk } from '../risk.js';
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

const VERBS = {
  A: 'Plan', D0: 'Design', B: 'Build', C: 'Verify', D: 'Decide', W: 'Walkthrough', E: 'Close',
};
const NOTES = {
  A: 'Seed planning and the wave risk file.',
  D0: 'Write docs/design/wave-NNN.md before Build.',
  B: 'Implement the wave scope. Small increments only.',
  C: 'Tests, fitness, and conformance gates.',
  D: 'Record the decision. Human judgment only when the risk policy requires it.',
  W: 'Write docs/walkthrough/wave-NNN.md (six questions).',
  E: 'Run whw close (applies the .done.sql, runs sync gates).',
};

/**
 * @param {{ wave: string, refPrefix: string, track: string, slug: string, adr: string }} w
 * @returns {{ rows: string, deps: string }}
 */
export function buildWaveSeedSql(w) {
  const letters = w.letters ?? ['A', 'B', 'C', 'D', 'E'];
  const rows = letters.map((letter, i) => {
    const ref = `${w.refPrefix}-${letter}`;
    const verb = VERBS[letter] ?? letter;
    const title = `Wave ${w.wave} ${letter} — ${verb}: ${w.slug}`;
    const note = (NOTES[letter] ?? 'Wave letter.').replaceAll('NNN', w.wave);
    const withAdr = letter === 'D' ? `${note} (ADR ${w.adr})` : note;
    return `  ('${ref}', '${title.replace(/'/g, "''")}', 'pending', '${w.track}', ${i + 1}, '${letter}', '${w.adr}', '${withAdr.replace(/'/g, "''")}')`;
  }).join(',\n');
  const deps = letters.slice(1)
    .map((letter, i) => `  ('${w.refPrefix}-${letter}', '${w.refPrefix}-${letters[i]}')`)
    .join(',\n');
  return { rows, deps };
}

const FALLBACK_TODOS = `-- Wave {{WAVE}} — {{SLUG}} (ADR {{ADR}})
-- Apply: whw sync {{TRACK}}
-- Refs: {{REF_PREFIX}} chain {{CHAIN}}

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
  const profile = processProfile(ctx.config);
  const flagged = parseSignals(ctx.flags.signals);
  const signals = flagged.length ? flagged : parseSignals(ctx.config?.process?.signals);
  let riskClass = null;
  if (profile === 'shift-left') {
    riskClass = classify(signals);
  }
  const policy = riskClass ? policyFor(riskClass) : null;
  const letters = lettersFor(profile, riskClass);
  const n = nextWaveNumber(ctx.paths.planning);
  const wave = pad3(n);
  const track = `wave-${wave}-${slug}`;
  const refPrefix = `wave${wave}`;
  const vars = {
    WAVE: wave, TRACK: track, REF_PREFIX: refPrefix, SLUG: slug,
    ADR: adr ?? String(adrFlag).padStart(4, '0'), DATE: localDate(),
    CHAIN: letters.join('→'),
  };
  const { rows, deps } = buildWaveSeedSql({ wave, refPrefix, track, slug, adr: vars.ADR, letters });
  const todosFile = join(ctx.paths.planning, `${track}.todos.sql`);
  const doneFile = join(ctx.paths.planning, `${track}.done.sql`);
  if (fileExists(todosFile) && !ctx.flags.force) throw new Error(`wave already exists: ${todosFile}`);
  writeWaveRisk(ctx.paths.planning, {
    wave,
    slug,
    track,
    profile,
    signals,
    class: riskClass,
    letters,
    humanJudgment: policy?.humanJudgment ?? null,
    fitnessBeforeBuild: policy?.fitnessBeforeBuild ?? false,
    designBeforeBuild: policy?.designBeforeBuild ?? false,
    walkthrough: policy?.walkthrough ?? false,
  });
  const todosTpl = loadTemplate(ctx, 'wave.todos.sql', FALLBACK_TODOS);
  const doneTpl = loadTemplate(ctx, 'wave.done.sql', FALLBACK_DONE);
  writeText(todosFile, render(todosTpl.text, { ...vars, ROWS: rows, DEPS: deps }));
  writeText(doneFile, render(doneTpl.text, vars));
  if (ctx.json) {
    ctx.log.data({
      wave, track, adr: vars.ADR, profile, class: riskClass, letters, signals,
      todos: todosFile, done: doneFile,
    });
    return 0;
  }
  ctx.log.info(`created ${todosFile}`);
  ctx.log.info(`created ${doneFile}`);
  ctx.log.info(`profile: ${profile}${riskClass ? ` · risk: ${riskClass}` : ''} · chain: ${letters.join('→')}`);
  ctx.log.info(`next: whw sync ${track} && whw queue --track ${track}`);
  return 0;
}
