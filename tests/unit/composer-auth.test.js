// SPDX-License-Identifier: MIT
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  describeComposerAuthGap,
  exchangeUserApiKey,
  isCloudAgentIdentityToken,
  resolveComposerApiKey,
  scrubIdentityAuthTokens,
} from '../../benchmarks/shift-left/composer-auth.js';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { composerAuthReady } from '../../benchmarks/shift-left/analyze.js';

describe('composer-auth', () => {
  it('exchanges a user API key for session tokens', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ accessToken: 'at', refreshToken: 'rt' }),
    }));
    const tokens = await exchangeUserApiKey('key_test');
    globalThis.fetch = original;
    assert.deepEqual(tokens, { accessToken: 'at', refreshToken: 'rt' });
  });

  it('does not treat a bare CURSOR_AUTH_TOKEN as ready without agent login', async () => {
    assert.equal(await composerAuthReady({ CURSOR_AUTH_TOKEN: 'session', PATH: '' }), false);
  });

  it('strips cloud-agent OIDC JWTs mistaken for CURSOR_AUTH_TOKEN', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ cloud_agent_id: 'bc-test' })).toString('base64url');
    const token = `${header}.${payload}.sig`;
    assert.equal(isCloudAgentIdentityToken(token), true);
    const env = scrubIdentityAuthTokens({ CURSOR_AUTH_TOKEN: token, FOO: 'bar' });
    assert.equal(env.CURSOR_AUTH_TOKEN, undefined);
    assert.equal(env.FOO, 'bar');
  });

  it('describes missing credentials for live runs', async () => {
    const gap = await describeComposerAuthGap({ PATH: '', HOME: '/tmp/whw-no-agent' });
    assert.match(gap, /not found on PATH|No CURSOR_API_KEY/);
  });

  it('reads CURSOR_API_KEY from WHW_CURSOR_API_KEY_FILE', () => {
    const dir = mkdtempSync(join(tmpdir(), 'whw-key-'));
    const file = join(dir, 'key');
    writeFileSync(file, 'key_from_file\n');
    assert.equal(resolveComposerApiKey({ WHW_CURSOR_API_KEY_FILE: file }), 'key_from_file');
  });
});
