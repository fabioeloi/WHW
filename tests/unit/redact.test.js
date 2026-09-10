// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../../src/log.js';

describe('log redact', () => {
  it('redacts sensitive keys deeply', () => {
    const out = redact({ token: 'abc', nested: { password: 'x', ok: 1 }, list: [{ secret: 's' }] });
    assert.equal(out.token, '[REDACTED]');
    assert.equal(out.nested.password, '[REDACTED]');
    assert.equal(out.nested.ok, 1);
    assert.equal(out.list[0].secret, '[REDACTED]');
  });

  it('scrubs known secret values from strings', () => {
    assert.equal(redact('bearer sk-1234567890 ok', ['sk-1234567890']), 'bearer [REDACTED] ok');
  });

  it('ignores short secrets and passes scalars', () => {
    assert.equal(redact('abc', ['abc']), 'abc');
    assert.equal(redact(42), 42);
    assert.equal(redact(null), null);
  });
});
