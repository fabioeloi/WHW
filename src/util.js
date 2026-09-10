// SPDX-License-Identifier: MIT
/** Shared filesystem, process, and formatting helpers (zero dependencies). */

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/** @param {string} p @returns {boolean} */
export function fileExists(p) {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

/** @param {string} p @returns {boolean} */
export function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** @param {string} p @returns {string} */
export function readText(p) {
  return readFileSync(p, 'utf8');
}

/** @param {string} p @returns {any} */
export function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

/**
 * Write text, creating parent directories. Ends file with exactly one newline.
 * @param {string} p
 * @param {string} text
 */
export function writeText(p, text) {
  mkdirSync(dirname(p), { recursive: true });
  const normalized = text.endsWith('\n') ? text : `${text}\n`;
  writeFileSync(p, normalized, 'utf8');
}

/** @param {string} s @returns {string} kebab-case slug */
export function slugify(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** @param {number} n @returns {string} zero-padded to 3+ digits */
export function pad3(n) {
  return String(n).padStart(3, '0');
}

/** @param {number} n @returns {string} zero-padded to 4 digits */
export function pad4(n) {
  return String(n).padStart(4, '0');
}

/** @returns {string} UTC stamp like 20260910T143000Z */
export function utcStamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

/** @returns {string} local date like 2026-09-10 */
export function localDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Run a command without a shell.
 * @param {string} cmd
 * @param {string[]} [args]
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, timeoutMs?: number }} [opts]
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
 */
export function runCmd(cmd, args = [], opts = {}) {
  return new Promise((resolvePromise) => {
    execFile(
      cmd,
      args,
      {
        cwd: opts.cwd,
        env: opts.env ?? process.env,
        timeout: opts.timeoutMs ?? 120000,
        maxBuffer: 10 * 1024 * 1024,
        windowsHide: true,
      },
      (err, stdout, stderr) => {
        resolvePromise({
          code: err?.code ?? 0,
          stdout: String(stdout ?? ''),
          stderr: err && !('code' in err) ? `${stderr ?? ''}\n${err.message}` : String(stderr ?? ''),
        });
      },
    );
  });
}

/**
 * Run a shell snippet (used for custom gates — only from trusted repos).
 * @param {string} script
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, timeoutMs?: number }} [opts]
 */
export function runShell(script, opts = {}) {
  const shell = process.platform === 'win32' ? 'cmd.exe' : 'sh';
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', script] : ['-c', script];
  return runCmd(shell, args, opts);
}

/**
 * List files in a directory (recursive), returning paths relative to dir.
 * @param {string} dir
 * @returns {string[]}
 */
export function listFilesRecursive(dir) {
  if (!isDir(dir)) return [];
  /** @type {string[]} */
  const out = [];
  const walk = (rel) => {
    const abs = rel ? join(dir, rel) : dir;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const next = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(next);
      else if (entry.isFile()) out.push(next);
    }
  };
  walk('');
  return out.sort();
}

/**
 * Find the enclosing repo/project root: nearest ancestor containing
 * whw.config.json, .git, or package.json. Falls back to startDir.
 * @param {string} startDir
 */
export function findRoot(startDir) {
  let dir = resolve(startDir);
  for (;;) {
    if (
      fileExists(join(dir, 'whw.config.json')) ||
      fileExists(join(dir, '.git')) ||
      fileExists(join(dir, 'package.json'))
    ) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return resolve(startDir);
    dir = parent;
  }
}

/**
 * Run a git command, returning trimmed stdout (empty string on failure).
 * @param {string[]} args
 * @param {string} cwd
 */
export async function git(args, cwd) {
  const res = await runCmd('git', args, { cwd });
  return res.code === 0 ? res.stdout.trim() : '';
}

/** @param {string} cwd @returns {Promise<boolean>} */
export async function isGitRepo(cwd) {
  const res = await runCmd('git', ['rev-parse', '--git-dir'], { cwd });
  return res.code === 0;
}
