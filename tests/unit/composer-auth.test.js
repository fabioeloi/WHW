// SPDX-License-Identifier: MIT
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { exchangeUserApiKey } from '../../benchmarks/shift-left/composer-auth.js';
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

  it('treats CURSOR_AUTH_TOKEN as ready for live runs', async () => {
    assert.equal(await composerAuthReady({ CURSOR_AUTH_TOKEN: 'session', PATH: '' }), true);
  });
});
