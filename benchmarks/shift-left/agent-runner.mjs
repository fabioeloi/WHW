#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * Headless Cursor Agent runner for benchmark:composer.
 * Reads the analyst prompt from $WHW_PROMPT_FILE and prints model stdout.
 * Uses $WHW_COMPOSER_BIN when set; otherwise discovers agent/cursor-agent on PATH.
 */

import { spawnSync } from 'node:child_process';
import { accessSync, constants, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';

const REQUESTED_MODEL = 'composer-2.5';
const COMPOSER_BINS = ['cursor-agent', 'agent'];

/**
 * @param {string} pathEnv
 */
function findComposerBin(pathEnv) {
  const extra = [join(homedir(), '.local', 'bin'), join(homedir(), '.cursor', 'bin')];
  const dirs = [...(pathEnv ? pathEnv.split(delimiter) : []), ...extra];
  for (const name of COMPOSER_BINS) {
    for (const dir of dirs) {
      if (!dir) continue;
      const candidate = join(dir, name);
      try {
        if (!statSync(candidate).isFile()) continue;
        accessSync(candidate, constants.X_OK);
        return candidate;
      } catch {
        /* absent */
      }
    }
  }
  return null;
}

const promptFile = process.env.WHW_PROMPT_FILE;
if (!promptFile) {
  process.stderr.write('WHW_PROMPT_FILE is required\n');
  process.exit(1);
}

const bin = process.env.WHW_COMPOSER_BIN ?? findComposerBin(process.env.PATH ?? '');
if (!bin) {
  process.stderr.write('Cursor agent binary not found (cursor-agent or agent)\n');
  process.exit(1);
}

const prompt = readFileSync(promptFile, 'utf8');
const args = ['-p', '-f', '--mode', 'ask', '--output-format', 'text', '--model', REQUESTED_MODEL, prompt];
const res = spawnSync(bin, args, {
  encoding: 'utf8',
  env: process.env,
  maxBuffer: 20 * 1024 * 1024,
  timeout: 360000,
});

if (res.stdout) process.stdout.write(res.stdout);
if (res.stderr) process.stderr.write(res.stderr);
process.exit(res.status ?? 1);
