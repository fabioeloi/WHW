// SPDX-License-Identifier: MIT
/**
 * Tool adapters: thin pointer files so every agent reads the canonical AGENTS.md.
 * Manifest: .whw/adapters.json { tools, files } — consumed by the agents-parity gate.
 */

import { join } from 'node:path';
import { fileExists, readJson, writeText } from './util.js';
import { loadTemplate, render, writeManaged } from './scaffold/files.js';

/** Adapter spec: tool -> files it owns. `native` tools read AGENTS.md without a file. */
export const ADAPTERS = {
  claude: { files: ['CLAUDE.md'], native: false },
  gemini: { files: ['GEMINI.md', '.gemini/settings.json'], native: false },
  copilot: { files: ['.github/copilot-instructions.md'], native: false },
  cursor: { files: ['.cursor/rules/whw.mdc'], native: false },
  windsurf: { files: ['.windsurfrules'], native: false },
  codex: { files: [], native: true, hint: 'Codex reads AGENTS.md natively (root + nested, 32 KiB cap).' },
  opencode: { files: [], native: true, hint: 'OpenCode reads AGENTS.md natively.' },
  aider: { files: [], native: true, hint: 'Aider: pass --read AGENTS.md (no pointer file needed).' },
};

export const DEFAULT_TOOLS = ['claude', 'gemini', 'copilot', 'cursor', 'windsurf'];

/** @param {string} csv @returns {string[]} */
export function parseTools(csv) {
  if (!csv) return [...DEFAULT_TOOLS];
  const tools = csv.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  for (const t of tools) {
    if (!ADAPTERS[t]) throw new Error(`unknown tool ${JSON.stringify(t)} (want one of ${Object.keys(ADAPTERS).join(', ')})`);
  }
  return [...new Set(tools)];
}

const FALLBACK_POINTER = (tool) => `# ${tool} instructions (WHW-managed)

> Canonical instructions: [\`AGENTS.md\`](AGENTS.md). Edit that file — not this one.

WHW loop: \`whw queue\` → \`whw claim <ref>\` → implement → \`whw done <ref> --evidence "…"\`.
End every milestone with Status / Evidence / Next step. Gates: \`whw gate run --tier pr\`.
`;

/**
 * Render the pointer body for a tool file (template override supported).
 * @param {any} ctx
 * @param {string} tool
 * @param {string} file
 */
function pointerBody(ctx, tool, file) {
  if (file.endsWith('settings.json')) return ''; // handled by mergeSettings
  const { text } = loadTemplate(ctx, `adapters/${tool}.md`, FALLBACK_POINTER(tool));
  const body = render(text, { TOOL: tool });
  if (file.endsWith('.mdc')) {
    return `---\ndescription: WHW harness — canonical instructions live in AGENTS.md\nglobs: "**/*"\n---\n\n${body}`;
  }
  return body;
}

/**
 * Merge .gemini/settings.json so Gemini CLI loads AGENTS.md (preserves other keys).
 * @param {string} abs
 * @returns {'created'|'kept'|'overwritten'}
 */
function mergeGeminiSettings(abs) {
  let current = {};
  let existed = false;
  if (fileExists(abs)) {
    existed = true;
    try {
      current = readJson(abs);
    } catch {
      current = {};
    }
  }
  current.context = { ...(current.context ?? {}), fileName: 'AGENTS.md' };
  writeText(abs, `${JSON.stringify(current, null, 2)}\n`);
  return existed ? 'overwritten' : 'created';
}

/**
 * @param {any} ctx
 * @param {string[]} tools
 * @param {boolean} force
 * @returns {{ created: string[], kept: string[], overwritten: string[], native: string[] }}
 */
export function syncAdapters(ctx, tools, force) {
  const out = { created: [], kept: [], overwritten: [], native: [] };
  /** @type {string[]} */
  const files = [];
  for (const tool of tools) {
    const spec = ADAPTERS[tool];
    if (spec.native) {
      out.native.push(tool);
      continue;
    }
    for (const file of spec.files) {
      const abs = join(ctx.root, file);
      files.push(file);
      if (file.endsWith('settings.json')) {
        out[mergeGeminiSettings(abs)].push(file);
      } else {
        out[writeManaged(abs, pointerBody(ctx, tool, file), force)].push(file);
      }
    }
  }
  writeText(join(ctx.root, '.whw', 'adapters.json'), `${JSON.stringify({ tools, files, updatedAt: new Date().toISOString() }, null, 2)}\n`);
  return out;
}

/**
 * Tools the agents-parity gate must verify (manifest > config > defaults).
 * @param {any} ctx
 * @returns {string[]}
 */
export function expectedAdapterFiles(ctx) {
  const manifest = join(ctx.root, '.whw', 'adapters.json');
  if (fileExists(manifest)) {
    try {
      const m = readJson(manifest);
      if (Array.isArray(m.files)) return m.files.filter((f) => !f.endsWith('settings.json'));
    } catch {
      /* fall through */
    }
  }
  const configured = ctx.config?.adapters?.tools;
  const tools = Array.isArray(configured) && configured.length ? configured : DEFAULT_TOOLS;
  return tools.flatMap((t) => ADAPTERS[t]?.files ?? []).filter((f) => !f.endsWith('settings.json'));
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdAdaptersSync(positionals, ctx) {
  const tools = parseTools(ctx.flags.tools ?? positionals[0] ?? '');
  const force = Boolean(ctx.flags.force);
  const res = syncAdapters(ctx, tools, force);
  if (ctx.json) {
    ctx.log.data({ tools, ...res });
    return 0;
  }
  for (const f of res.created) ctx.log.info(`created ${f}`);
  for (const f of res.overwritten) ctx.log.info(`updated ${f}`);
  for (const f of res.kept) ctx.log.info(`kept ${f} (exists; use --force to overwrite)`);
  for (const t of res.native) ctx.log.info(`native ${t}: ${ADAPTERS[t].hint}`);
  ctx.log.info(`adapters manifest: .whw/adapters.json (${tools.join(', ')})`);
  return 0;
}
