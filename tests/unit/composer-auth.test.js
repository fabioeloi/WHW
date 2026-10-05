// SPDX-License-Identifier: MIT
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { exchangeUserApiKey, resolveComposerApiKey } from '../../benchmarks/shift-left/composer-auth.js';
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

  it('treats CURSOR_AUTH_TOKEN as ready for live runs', async () => {
    assert.equal(await composerAuthReady({ CURSOR_AUTH_TOKEN: 'session', PATH: '' }), true);
  });

  it('reads CURSOR_API_KEY from WHW_CURSOR_API_KEY_FILE', () => {
    const dir = mkdtempSync(join(tmpdir(), 'whw-key-'));
    const file = join(dir, 'key');
    writeFileSync(file, 'key_from_file\n');
    assert.equal(resolveComposerApiKey({ WHW_CURSOR_API_KEY_FILE: file }), 'key_from_file');
  });
});
