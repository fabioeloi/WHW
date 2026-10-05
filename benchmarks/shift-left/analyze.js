// SPDX-License-Identifier: MIT
/**
 * Advisory Composer reading of the deterministic classic vs shift-left report.
 * The model does not change verdictFor, the report digest, or process.profile.
 */

import { accessSync, constants, mkdtempSync, statSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WALKTHROUGH_HEADINGS } from '../../src/shift-left.js';
import { fileExists, readJson, readText, runCmd, runShell, writeText } from '../../src/util.js';
import { loadDotEnvLocal, resolveComposerApiKey } from './composer-auth.js';
import { CRITICAL_VARIANTS, CHANGES } from './scenario.js';
import { runBenchmark } from './run.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const OUT_DIR = join(HERE, 'out');
export const REPORT_PATH = join(OUT_DIR, 'report.json');
export const ANALYSIS_PATH = join(OUT_DIR, 'composer-analysis.json');
export const ANALYST_PATH = join(HERE, 'analyst.md');
export const CHANGE_IDS = CHANGES.map((change) => change.id);
export const RECOMMENDATIONS = ['adopt', 'reject', 'defer'];
/** Requested CLI model id. Not proof that the backend served this version. */
export const REQUESTED_MODEL = 'composer-2.5';
const COMPOSER_BINS = ['cursor-agent', 'agent'];
export const AGENT_RUNNER = join(HERE, 'agent-runner.mjs');

/**
 * @param {string} [pathEnv]
 * @param {string} [home]
 */
export function expandComposerPath(pathEnv = process.env.PATH ?? '', home = homedir()) {
  const extra = [join(home, '.local', 'bin'), join(home, '.cursor', 'bin')];
  const seen = new Set();
  const parts = [...(pathEnv ? pathEnv.split(delimiter) : []), ...extra].filter((dir) => {
    if (!dir || seen.has(dir)) return false;
    seen.add(dir);
    return true;
  });
  return parts.join(delimiter);
}

/**
 * @param {NodeJS.ProcessEnv} [base]
 */
export function composerLiveEnv(base = process.env) {
  loadDotEnvLocal();
  const home = base.HOME ?? homedir();
  const key = resolveComposerApiKey(base);
  return {
    ...base,
    PATH: expandComposerPath(base.PATH ?? '', home),
    ...(key ? { CURSOR_API_KEY: key } : {}),
  };
}

/**
 * @param {object} report
 */
export function buildAnalysisPacket(report) {
  if (!report?.profiles?.classic || !report?.profiles?.['shift-left']) {
    throw new Error('analysis packet needs report.profiles.classic and report.profiles.shift-left');
  }
  if (typeof report.assumption !== 'string' || !report.assumption.trim()) {
    throw new Error('analysis packet needs the oracle assumption');
  }
  const summarize = (profile) => ({
    totals: {
      ceremonyCost: profile.totals?.ceremonyCost ?? null,
      costExcludingOracle: profile.totals?.costExcludingOracle ?? null,
      escapedDefects: profile.totals?.escapedDefects ?? null,
      humanJudgments: profile.totals?.humanJudgments ?? null,
      reworkPreBuild: profile.totals?.reworkPreBuild ?? null,
      reworkPostBuild: profile.totals?.reworkPostBuild ?? null,
    },
    changes: (profile.changes ?? []).map((change) => ({
      id: change.id,
      expectedClass: change.expectedClass,
      letters: change.letters,
      humanJudgments: change.humanJudgments,
      ceremonyCost: change.ceremonyCost,
      reworkPreBuild: change.reworkPreBuild,
      reworkPostBuild: change.reworkPostBuild,
      escapedDefects: change.escapedDefects,
      fitnessBlockedBuild: change.fitnessBlockedBuild,
    })),
  });
  return {
    assumption: report.assumption,
    verdict: report.verdict ?? null,
    comprehensionProven: false,
    delta: report.delta ?? null,
    profiles: {
      classic: summarize(report.profiles.classic),
      'shift-left': summarize(report.profiles['shift-left']),
    },
    walkthroughQuestions: WALKTHROUGH_HEADINGS,
    criticalChange: {
      id: 'domain-owns-table',
      safe: CRITICAL_VARIANTS.safe,
      mechanicalFix: CRITICAL_VARIANTS.mechanicalFix,
    },
  };
}

/**
 * @param {object} report
 * @param {string} [instructions]
 */
export function buildAnalystPrompt(report, instructions = readText(ANALYST_PATH)) {
  const packet = buildAnalysisPacket(report);
  return `${instructions.trim()}\n\n## Measured packet\n\n\`\`\`json\n${JSON.stringify(packet, null, 2)}\n\`\`\`\n`;
}

/**
 * @param {string} text
 */
export function extractJsonObject(text) {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const source = fenced ? fenced[1] : String(text ?? '');
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('composer analysis is not JSON');
  try {
    return JSON.parse(source.slice(start, end + 1));
  } catch (err) {
    throw new Error(`composer analysis is not JSON: ${err instanceof Error ? err.message : err}`);
  }
}

/**
 * @param {any} value
 * @param {string[]} [ids]
 */
export function validateAnalysis(value, ids = CHANGE_IDS) {
  /** @type {string[]} */
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('invalid composer analysis: body must be an object');
  }
  if (typeof value.agreesWithOracle !== 'boolean') errors.push('agreesWithOracle must be boolean');
  if (typeof value.oracleReason !== 'string' || !value.oracleReason.trim()) errors.push('oracleReason must be a non-empty string');
  if (typeof value.agreesWithVerdict !== 'boolean') errors.push('agreesWithVerdict must be boolean');
  if (typeof value.verdictReason !== 'string' || !value.verdictReason.trim()) errors.push('verdictReason must be a non-empty string');
  if (!RECOMMENDATIONS.includes(value.recommendation)) {
    errors.push('recommendation must be adopt, reject, or defer');
  }
  const walk = value.criticalWalkthroughAnswerable;
  if (!walk || typeof walk !== 'object') errors.push('criticalWalkthroughAnswerable must be an object');
  else {
    for (const key of ['classic', 'shift-left']) {
      if (typeof walk[key] !== 'boolean') errors.push(`criticalWalkthroughAnswerable.${key} must be boolean`);
    }
  }
  if (!Array.isArray(value.changes)) errors.push('changes must be an array');
  else {
    const seen = new Set();
    for (const change of value.changes) {
      if (!change || typeof change.id !== 'string') {
        errors.push('change id missing');
        continue;
      }
      if (seen.has(change.id)) errors.push(`duplicate change id: ${change.id}`);
      seen.add(change.id);
      for (const field of ['loadBearing', 'theater']) {
        if (!Array.isArray(change[field]) || change[field].some((item) => typeof item !== 'string' || !item.trim())) {
          errors.push(`${change.id} ${field} must be an array of non-empty strings`);
        }
      }
    }
    for (const id of ids) {
      if (!seen.has(id)) errors.push(`missing change id: ${id}`);
    }
    for (const id of seen) {
      if (!ids.includes(id)) errors.push(`unknown change id: ${id}`);
    }
  }
  if (errors.length) throw new Error(`invalid composer analysis: ${errors.join('; ')}`);
  return value;
}

/**
 * Derive a non-interactive Composer command from `binary --help`.
 * The shell command reads `$WHW_PROMPT_FILE` and prints the analysis.
 * @param {string} bin
 * @param {string} help
 */
export function commandFromHelp(bin, help) {
  const base = bin.split('/').pop();
  if (base === 'agent' && !/cursor|composer/i.test(help)) {
    throw new Error('refusing generic agent binary without Cursor/Composer help; set WHW_COMPOSER_RUNNER');
  }
  const hasPrint = /(?:^|\s)-p,?\s|--print\b/.test(help);
  const hasModel = /--model\b/.test(help);
  if (!hasPrint || !hasModel) {
    throw new Error(`cannot derive a Composer command from ${bin} --help; set WHW_COMPOSER_RUNNER`);
  }
  if (/\s/.test(bin)) throw new Error(`composer binary path has spaces (${bin}); set WHW_COMPOSER_RUNNER`);
  const format = /--output-format\b/.test(help) ? ' --output-format text' : '';
  const trust = /(?:^|\s)-f,?\s|--force\b|--trust\b/.test(help) ? ' -f' : '';
  const ask = /--mode\b/.test(help) ? ' --mode ask' : '';
  return `${bin} -p${trust}${ask} --model ${REQUESTED_MODEL}${format} "$(cat "$WHW_PROMPT_FILE")"`;
}

/**
 * @param {string} pathEnv
 * @param {string[]} [names]
 * @returns {string|null}
 */
export function findComposerBin(pathEnv = process.env.PATH ?? '', names = COMPOSER_BINS, home = homedir()) {
  const expanded = expandComposerPath(pathEnv, home);
  for (const name of names) {
    for (const dir of expanded ? expanded.split(delimiter) : []) {
      if (!dir) continue;
      const candidate = join(dir, name);
      try {
        if (!statSync(candidate).isFile()) continue;
        accessSync(candidate, constants.X_OK);
        return candidate;
      } catch {
        /* absent or not executable */
      }
    }
  }
  return null;
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @param {{ lookup?: typeof findComposerBin, runHelp?: (bin: string) => Promise<string> }} [deps]
 * @returns {Promise<{ command: string, source: string, bin?: string }|null>}
 */
export async function discoverComposerCommand(env = process.env, deps = {}) {
  const configured = env.WHW_COMPOSER_RUNNER;
  if (typeof configured === 'string' && configured.trim()) {
    return { command: configured.trim(), source: 'env' };
  }
  const lookup = deps.lookup ?? ((path) => findComposerBin(path, COMPOSER_BINS, env.HOME ?? homedir()));
  const bin = lookup(env.PATH ?? '');
  if (!bin) return null;
  const runHelp = deps.runHelp ?? (async (candidate) => {
    const res = await runCmd(candidate, ['--help'], { timeoutMs: 15000 });
    const text = `${res.stdout}\n${res.stderr}`.trim();
    if (!text) throw new Error(`${candidate} --help produced no text (exit ${res.code})`);
    return text;
  });
  const help = await runHelp(bin);
  commandFromHelp(bin, help);
  return { command: `node "${AGENT_RUNNER}"`, source: 'help', bin };
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export async function composerAuthReady(env = process.env) {
  loadDotEnvLocal();
  if (resolveComposerApiKey(env)) return true;
  if (typeof env.CURSOR_AUTH_TOKEN === 'string' && env.CURSOR_AUTH_TOKEN.trim()) return true;
  const bin = findComposerBin(env.PATH ?? '', COMPOSER_BINS, env.HOME ?? homedir());
  if (!bin) return false;
  const res = await runCmd(bin, ['status'], { env, timeoutMs: 20000 });
  const text = `${res.stdout}\n${res.stderr}`;
  if (/\bnot logged in\b/i.test(text)) return false;
  return /^Logged in/m.test(text) || /Login successful/i.test(text);
}

/**
 * @param {string} raw
 * @param {string[]} [ids]
 */
export function parseAnalysis(raw, ids = CHANGE_IDS) {
  return validateAnalysis(extractJsonObject(raw), ids);
}

/**
 * @param {object} analysis validated model payload
 */
export function advisoryRecord(analysis) {
  return {
    ...analysis,
    model: REQUESTED_MODEL,
    advisory: true,
    changesDefaultProfile: false,
  };
}

/**
 * @param {{ prompt: string, command: string, cwd?: string, timeoutMs?: number }} opts
 * @returns {Promise<string>}
 */
export async function invokeComposer(opts) {
  const dir = mkdtempSync(join(tmpdir(), 'whw-composer-'));
  const promptFile = join(dir, 'prompt.md');
  writeText(promptFile, opts.prompt);
  const res = await runShell(opts.command, {
    cwd: opts.cwd ?? dir,
    timeoutMs: opts.timeoutMs ?? 360000,
    env: {
      ...process.env,
      ...(opts.env ?? {}),
      WHW_PROMPT_FILE: promptFile,
      ...(opts.bin ? { WHW_COMPOSER_BIN: opts.bin } : {}),
    },
  });
  if (res.code !== 0) {
    const tail = `${res.stdout}\n${res.stderr}`.trim().split('\n').slice(-8).join('\n');
    throw new Error(`composer runner exit ${res.code}${tail ? `: ${tail}` : ''}`);
  }
  return res.stdout;
}

export const MISSING_CLI = `Composer CLI not found (looked for cursor-agent and agent on PATH).
Set WHW_COMPOSER_RUNNER to a shell command that reads $WHW_PROMPT_FILE and prints the analysis JSON.
No analysis was invented.`;

/**
 * @param {{ report?: object, outFile?: string, env?: NodeJS.ProcessEnv }} [opts]
 * @returns {Promise<number>}
 */
export async function runComposerAnalysis(opts = {}) {
  const found = await discoverComposerCommand(opts.env ?? process.env);
  if (!found) {
    process.stderr.write(`${MISSING_CLI}\n`);
    return 2;
  }
  const report = opts.report ?? (fileExists(REPORT_PATH) ? readJson(REPORT_PATH) : await runBenchmark({ outFile: REPORT_PATH }));
  const prompt = buildAnalystPrompt(report);
  const raw = await invokeComposer({
    prompt,
    command: found.command,
    cwd: HERE,
    env: opts.env,
    bin: found.bin,
  });
  const record = advisoryRecord(parseAnalysis(raw));
  writeText(opts.outFile ?? ANALYSIS_PATH, `${JSON.stringify(record, null, 2)}\n`);
  return 0;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const code = await runComposerAnalysis();
  process.exit(code);
}
