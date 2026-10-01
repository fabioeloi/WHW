// SPDX-License-Identifier: MIT
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runMetrics } from '../../src/metrics.js';
import { writeText } from '../../src/util.js';
import { makeTmp } from '../helpers.js';

it('replays sanitized real attempts without equating process success to task completion', () => {
  const fixture = JSON.parse(readFileSync(new URL('../fixtures/runner-proof/attempts.json', import.meta.url), 'utf8'));
  const dir = makeTmp('whw-runner-proof-');
  for (const attempt of fixture.attempts) {
    const header = ['tier', 'model', 'costClass', 'durationMs', 'exit'].map(key => `${key}: ${attempt[key]}`).join('\n');
    writeText(join(dir, `builder-${attempt.stamp}-attempt1.log`), `${header}\n$ sanitized-runner\n\n${attempt.body}\n`);
  }
  assert.deepEqual(runMetrics(dir), { processed: 2, malformed: 0, unknown: 0, byCostClass: {
    closed: { attempts: 2, successes: 1, failures: 1, durationMs: 315646 },
  } });
  assert.equal(fixture.attempts.filter(attempt => attempt.taskComplete).length, 0);
  assert.match(fixture.attempts.find(attempt => attempt.exit === 0).body, /operator-assisted/);
});
