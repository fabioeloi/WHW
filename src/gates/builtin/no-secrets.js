// SPDX-License-Identifier: MIT
/** Gate: static secret scan over tracked text files (never commit secrets). */

import { statSync } from 'node:fs';
import { join } from 'node:path';
import { isGitRepo, listFilesRecursive, readText, runCmd } from '../../util.js';

// Patterns require a substantial secret body so docs/config keys don't match.
const PATTERNS = [
  { id: 'private-key', re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/ },
  { id: 'github-token', re: /\b(ghp|gho|github_pat)_[A-Za-z0-9]{16,}/ },
  { id: 'aws-key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: 'slack-token', re: /\bxox[bpras]-[A-Za-z0-9-]{12,}/ },
  { id: 'stripe-live', re: /\bsk_live_[A-Za-z0-9]{12,}/ },
  { id: 'bearer-assignment', re: /\b(password|passwd|secret|api[_-]?key|auth[_-]?token)\s*[:=]\s*['"][^'"]{8,}['"]/i },
  { id: 'connection-secret', re: /:\/\/[^/\s:]+:[^/\s@]{4,}@/ },
];

const SKIP_DIRS = new Set(['.git', 'node_modules', '.cursor', '.vscode', '.idea']);
const SKIP_FILES = new Set(['package-lock.json', 'go.sum']);

export const name = 'no-secrets';
export const description = 'No private keys, tokens, or secret assignments in tracked text files.';

/**
 * @param {any} ctx
 */
export async function run(ctx) {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const details = [];
  let files;
  if (await isGitRepo(ctx.root)) {
    const res = await runCmd('git', ['ls-files', '-z'], { cwd: ctx.root });
    files = res.code === 0 ? res.stdout.split('\0').filter(Boolean) : [];
  } else {
    files = listFilesRecursive(ctx.root);
  }
  let scanned = 0;
  for (const rel of files) {
    const top = rel.split('/')[0];
    if (SKIP_DIRS.has(top) || SKIP_FILES.has(rel.split('/').pop())) continue;
    if (rel.startsWith('.whw/state.db')) continue;
    const abs = join(ctx.root, rel);
    let size = 0;
    try {
      size = statSync(abs).size;
    } catch {
      continue;
    }
    if (size > 1024 * 1024) continue;
    let text;
    try {
      text = readText(abs);
    } catch {
      continue;
    }
    if (text.includes('\0')) continue; // binary
    scanned++;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const p of PATTERNS) {
        if (p.re.test(lines[i])) {
          failures.push(`${rel}:${i + 1} matches ${p.id}`);
          if (failures.length >= 20) {
            failures.push('… (capped at 20 hits)');
            return { status: 'NO_GO', failures, details };
          }
        }
      }
    }
  }
  details.push(`scanned ${scanned} text file(s), no hits`);
  return { status: failures.length ? 'NO_GO' : 'GO', failures, details };
}
