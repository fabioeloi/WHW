// SPDX-License-Identifier: MIT
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTarget, RECOVERY_SHA } from '../../.github/scripts/release-target.mjs';
const recovery = { event: 'workflow_dispatch', ref: 'refs/tags/v0.2.0', sha: RECOVERY_SHA, name: '@fabioeloi/whw', version: '0.2.0' };
test('recovery accepts only the immutable release source', () => {
  assert.equal(validateTarget(recovery).sha, RECOVERY_SHA);
  for (const change of [{ sha: 'a'.repeat(40) }, { ref: 'refs/tags/v0.3.0', version: '0.3.0' }, { ref: 'refs/heads/main' }, { name: '@other/package' }, { version: '0.2.1' }, { event: 'pull_request' }]) {
    assert.throws(() => validateTarget({ ...recovery, ...change }));
  }
});
test('future push releases require matching stable tags and package identity', () => {
  assert.equal(validateTarget({ ...recovery, event: 'push', ref: 'refs/tags/v0.3.0', version: '0.3.0', sha: 'a'.repeat(40) }).tag, 'v0.3.0');
  assert.throws(() => validateTarget({ ...recovery, event: 'push', ref: 'refs/tags/v0.2.0-rc.1', version: '0.2.0-rc.1' }));
});
