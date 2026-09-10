// SPDX-License-Identifier: MIT
/**
 * Template loading for scaffolds.
 * Resolution order: <project>/templates/<name> (project override) >
 * <package>/templates/<name> > embedded fallback.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileExists, isDir, readText, writeText } from '../util.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Absolute path of the installed WHW package root. */
export function packageRoot() {
  return join(HERE, '..', '..');
}

/**
 * Load a template by name.
 * @param {{ root: string }} ctx project context (uses ctx.root)
 * @param {string} name path relative to templates/
 * @param {string} [fallback] embedded default when no file exists
 * @returns {{ text: string, source: string }}
 */
export function loadTemplate(ctx, name, fallback = '') {
  const projectFile = join(ctx.root, 'templates', name);
  if (fileExists(projectFile)) return { text: readText(projectFile), source: projectFile };
  const pkgFile = join(packageRoot(), 'templates', name);
  if (fileExists(pkgFile)) return { text: readText(pkgFile), source: pkgFile };
  return { text: fallback, source: '<embedded>' };
}

/**
 * Render {{PLACEHOLDER}} tokens (unknown tokens left intact).
 * @param {string} text
 * @param {Record<string, string>} vars
 */
export function render(text, vars) {
  return text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, key) =>
    Object.hasOwn(vars, key) ? vars[key] : m,
  );
}

/**
 * Write a file unless it exists (then keep, unless force).
 * @returns {'created'|'kept'|'overwritten'}
 */
export function writeManaged(path, text, force) {
  if (fileExists(path) && !force) return 'kept';
  const existed = fileExists(path);
  writeText(path, text);
  return existed ? 'overwritten' : 'created';
}

/**
 * Recursively copy a directory (files only), honoring force.
 * @param {string} src
 * @param {string} dest
 * @param {boolean} force
 * @returns {{ created: string[], kept: string[], overwritten: string[] }}
 */
export function copyTree(src, dest, force) {
  const result = { created: [], kept: [], overwritten: [] };
  if (!isDir(src)) return result;
  const walk = (rel) => {
    const absSrc = rel ? join(src, rel) : src;
    const absDest = rel ? join(dest, rel) : dest;
    mkdirSync(absDest, { recursive: true });
    for (const entry of readdirSync(absSrc, { withFileTypes: true })) {
      const next = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(next);
      } else if (entry.isFile()) {
        const st = writeManaged(join(dest, next), readText(join(src, next)), force);
        result[st].push(next);
      }
    }
  };
  walk('');
  return result;
}

export { copyFileSync };
