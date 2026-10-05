// SPDX-License-Identifier: MIT
/**
 * Cursor Agent authentication helpers for benchmark:composer live runs.
 * Hosted agent VMs do not persist `agent login`; use CURSOR_API_KEY or injected CURSOR_AUTH_TOKEN.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const DEFAULT_API = 'https://api2.cursor.sh';

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
  const out = { ...env };
  const apiKey = typeof env.CURSOR_API_KEY === 'string' ? env.CURSOR_API_KEY.trim() : '';
  const authToken = typeof env.CURSOR_AUTH_TOKEN === 'string' ? env.CURSOR_AUTH_TOKEN.trim() : '';
  if (authToken) return out;
  if (!apiKey) return out;
  const tokens = await exchangeUserApiKey(apiKey, env.CURSOR_API_ENDPOINT ?? DEFAULT_API);
  if (!tokens) {
    throw new Error('CURSOR_API_KEY is set but exchange_user_api_key failed (invalid or revoked key)');
  }
  const home = env.HOME ?? homedir();
  writeCursorAuthJson(tokens, home);
  out.CURSOR_AUTH_TOKEN = tokens.accessToken;
  return out;
}
