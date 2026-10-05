// SPDX-License-Identifier: MIT
/**
 * Cursor Agent authentication helpers for benchmark:composer live runs.
 * Hosted agent VMs do not persist `agent login`; use CURSOR_API_KEY or injected CURSOR_AUTH_TOKEN.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_API = 'https://api2.cursor.sh';
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');

/** @type {string[]} */
const API_KEY_FILE_CANDIDATES = [
  'CURSOR_API_KEY_FILE',
  'WHW_CURSOR_API_KEY_FILE',
];

/**
 * @param {string} path
 */
function readSecretFile(path) {
  try {
    const text = readFileSync(path, 'utf8').trim();
    return text.split('\n')[0].trim();
  } catch {
    return '';
  }
}

/**
 * @param {string} [cwd]
 */
export function loadDotEnvLocal(cwd = REPO_ROOT) {
  const path = join(cwd, '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[name] === undefined) process.env[name] = value;
  }
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveComposerApiKey(env = process.env) {
  const direct = typeof env.CURSOR_API_KEY === 'string' ? env.CURSOR_API_KEY.trim() : '';
  if (direct) return direct;
  for (const name of API_KEY_FILE_CANDIDATES) {
    const file = env[name];
    if (typeof file === 'string' && file.trim()) {
      const key = readSecretFile(file.trim());
      if (key) return key;
    }
  }
  for (const file of [
    join(REPO_ROOT, '.cursor', 'CURSOR_API_KEY'),
    '/run/secrets/CURSOR_API_KEY',
    '/run/secrets/cursor-api-key',
  ]) {
    if (existsSync(file)) {
      const key = readSecretFile(file);
      if (key) return key;
    }
  }
  return '';
}

/**
 * @param {string} apiKey
 * @param {string} [apiBase]
 * @returns {Promise<{ accessToken: string, refreshToken: string }|null>}
 */
export async function exchangeUserApiKey(apiKey, apiBase = DEFAULT_API) {
  const key = apiKey.trim();
  if (!key) return null;
  const res = await fetch(`${apiBase}/auth/exchange_user_api_key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: '{}',
  });
  if (!res.ok) return null;
  const body = await res.json();
  if (!body || typeof body.accessToken !== 'string' || typeof body.refreshToken !== 'string') return null;
  return { accessToken: body.accessToken, refreshToken: body.refreshToken };
}

/**
 * @param {{ accessToken: string, refreshToken: string }} tokens
 * @param {string} [home]
 */
export function writeCursorAuthJson(tokens, home = homedir()) {
  const dir = join(home, '.config', 'cursor');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'auth.json');
  writeFileSync(
    path,
    `${JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, apiKey: null }, null, 2)}\n`,
    { mode: 0o600 },
  );
  return path;
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {Promise<NodeJS.ProcessEnv>}
 */
export async function prepareComposerAgentEnv(env) {
  loadDotEnvLocal();
  const out = { ...env };
  const apiKey = resolveComposerApiKey(env);
  const authToken = typeof env.CURSOR_AUTH_TOKEN === 'string' ? env.CURSOR_AUTH_TOKEN.trim() : '';
  if (authToken) return out;
  if (!apiKey) return out;
  if (!out.CURSOR_API_KEY) out.CURSOR_API_KEY = apiKey;
  const tokens = await exchangeUserApiKey(apiKey, env.CURSOR_API_ENDPOINT ?? DEFAULT_API);
  if (!tokens) {
    throw new Error('CURSOR_API_KEY is set but exchange_user_api_key failed (invalid or revoked key)');
  }
  const home = env.HOME ?? homedir();
  writeCursorAuthJson(tokens, home);
  out.CURSOR_AUTH_TOKEN = tokens.accessToken;
  return out;
}
