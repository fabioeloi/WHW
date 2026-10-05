// SPDX-License-Identifier: MIT
/**
 * Cursor Agent authentication helpers for benchmark:composer live runs.
 * Hosted agent VMs do not persist `agent login`; use CURSOR_API_KEY or injected CURSOR_AUTH_TOKEN.
 */

import { accessSync, constants, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCmd } from '../../src/util.js';

const DEFAULT_API = 'https://api2.cursor.sh';
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const COMPOSER_BINS = ['cursor-agent', 'agent'];

/** Env names that may carry a Cursor user API key (first non-empty wins). */
const API_KEY_ENV_NAMES = [
  'CURSOR_API_KEY',
  'WHW_CURSOR_API_KEY',
  'CURSOR_USER_API_KEY',
];

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
 * @param {string} token
 * @returns {Record<string, unknown>|null}
 */
export function decodeJwtPayload(token) {
  const parts = token.trim().split('.');
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(json);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/**
 * OIDC tokens from $CURSOR_AGENT_SOCKET are cloud-agent identity JWTs, not Origin CLI sessions.
 * @param {string} token
 */
export function isCloudAgentIdentityToken(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  return typeof payload.cloud_agent_id === 'string' && payload.cloud_agent_id.length > 0;
}

/**
 * @param {NodeJS.ProcessEnv} env
 */
export function scrubIdentityAuthTokens(env) {
  const out = { ...env };
  const authToken = typeof out.CURSOR_AUTH_TOKEN === 'string' ? out.CURSOR_AUTH_TOKEN.trim() : '';
  if (authToken && isCloudAgentIdentityToken(authToken)) {
    delete out.CURSOR_AUTH_TOKEN;
  }
  return out;
}

/**
 * @param {string} text agent status stdout/stderr
 */
export function agentStatusLooksLoggedIn(text) {
  if (/\bnot logged in\b/i.test(text)) return false;
  if (/stored authentication is invalid/i.test(text)) return false;
  return /^Logged in/m.test(text) || /Login successful/i.test(text);
}

/**
 * @param {string} pathEnv
 * @param {string} [home]
 */
export function findComposerBin(pathEnv, home = homedir()) {
  const extra = [join(home, '.local', 'bin'), join(home, '.cursor', 'bin')];
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

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveComposerApiKey(env = process.env) {
  for (const name of API_KEY_ENV_NAMES) {
    const value = env[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
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
  const scrubbed = scrubIdentityAuthTokens(env);
  const out = { ...scrubbed };
  const apiKey = resolveComposerApiKey(scrubbed);
  const authToken = typeof scrubbed.CURSOR_AUTH_TOKEN === 'string' ? scrubbed.CURSOR_AUTH_TOKEN.trim() : '';
  if (authToken && !isCloudAgentIdentityToken(authToken)) return out;
  if (!apiKey) return out;
  if (!out.CURSOR_API_KEY) out.CURSOR_API_KEY = apiKey;
  const tokens = await exchangeUserApiKey(apiKey, scrubbed.CURSOR_API_ENDPOINT ?? DEFAULT_API);
  if (!tokens) {
    throw new Error('CURSOR_API_KEY is set but exchange_user_api_key failed (invalid or revoked key)');
  }
  const home = scrubbed.HOME ?? homedir();
  writeCursorAuthJson(tokens, home);
  out.CURSOR_AUTH_TOKEN = tokens.accessToken;
  return out;
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {Promise<string>}
 */
export async function describeComposerAuthGap(env = process.env) {
  const scrubbed = scrubIdentityAuthTokens(env);
  const home = scrubbed.HOME ?? homedir();
  const pathEnv = scrubbed.PATH ?? '';
  const bin = findComposerBin(pathEnv, home);
  const lines = [];
  if (
    typeof env.CURSOR_AUTH_TOKEN === 'string'
    && env.CURSOR_AUTH_TOKEN.trim()
    && isCloudAgentIdentityToken(env.CURSOR_AUTH_TOKEN)
  ) {
    lines.push('CURSOR_AUTH_TOKEN looked like a cloud-agent OIDC JWT (from $CURSOR_AGENT_SOCKET); ignored for cursor-agent.');
  }
  const apiKey = resolveComposerApiKey(scrubbed);
  if (!bin) {
    lines.push('cursor-agent/agent not found on PATH (install via curl -fsSL https://cursor.com/install | bash).');
    return lines.join(' ');
  }
  if (!apiKey && !scrubbed.CURSOR_AUTH_TOKEN?.trim()) {
    lines.push('No CURSOR_API_KEY, CURSOR_AUTH_TOKEN session, or agent login.');
    lines.push('Cloud Agents: add Runtime Secret CURSOR_API_KEY on this environment, then start a new agent run.');
    lines.push('See docs/pt-BR/composer-live-auth.md');
    return lines.join(' ');
  }
  let agentEnv;
  try {
    agentEnv = await prepareComposerAgentEnv(scrubbed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    lines.push(msg);
    return lines.join(' ');
  }
  const res = await runCmd(bin, ['status'], { env: agentEnv, timeoutMs: 20000 });
  const text = `${res.stdout}\n${res.stderr}`.trim();
  if (agentStatusLooksLoggedIn(text)) return '';
  lines.push(text.split('\n')[0] || 'cursor-agent status did not report a login');
  return lines.join(' ');
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export async function probeComposerAgentAuth(env = process.env) {
  const gap = await describeComposerAuthGap(env);
  return gap === '';
}
