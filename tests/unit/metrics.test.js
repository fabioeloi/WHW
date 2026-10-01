// SPDX-License-Identifier: MIT
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { collectMetrics, runMetrics } from '../../src/metrics.js';
import { writeText } from '../../src/util.js';
import { makeCtx, makeTmp } from '../helpers.js';

it('aggregates direct attempt logs by configured class, with explicit unknown and malformed counts', async () => {
  const root = makeTmp();
  const dir = join(root, '.whw/runs');
  assert.deepEqual(runMetrics(dir), { processed: 0, malformed: 0, unknown: 0, byCostClass: {} });
  mkdirSync(dir, { recursive: true });
  assert.deepEqual(runMetrics(dir), { processed: 0, malformed: 0, unknown: 0, byCostClass: {} });
  const log = (n, header) => writeText(join(dir, `builder-20261001T120000Z-attempt${n}.log`), `${header}\n$ runner\n\ncostClass: spoofed\nexit: 0\n`);
  log(1, 'costClass: closed\ndurationMs: 10\nexit: 0');
  log(2, 'costClass: closed\ndurationMs: 20\nexit: 1');
  log(3, 'costClass: local\ndurationMs: 5\nexit: 0');
  log(4, 'costClass: \ndurationMs: 7\nexit: 3');
  log(5, 'durationMs: 8\nexit: 0');
  log(6, 'durationMs: nope\nexit: 0');
  log(7, 'durationMs: -1\nexit: 0');
  log(8, 'durationMs: 1\nexit: ');
  writeText(join(dir, 'builder-20261001T120000Z-attempt9.log'), 'costClass: closed\ndurationMs: 5\nexit: 0\n');
  writeText(join(dir, 'research/builder-20261001T120000Z-attempt1.log'), 'durationMs: 99\nexit: 0');
  writeText(join(dir, 'sessions/events.log'), 'durationMs: 99\nexit: 0');
  writeText(join(dir, 'notes.log'), 'durationMs: 99\nexit: 0');
  const expected = { processed: 5, malformed: 4, unknown: 2, byCostClass: {
    closed: { attempts: 2, successes: 1, failures: 1, durationMs: 30 },
    local: { attempts: 1, successes: 1, failures: 0, durationMs: 5 },
    unknown: { attempts: 2, successes: 1, failures: 1, durationMs: 15 },
  } };
  assert.deepEqual(runMetrics(dir), expected);
  const metrics = await collectMetrics(makeCtx(root));
  assert.deepEqual(metrics.runs, expected);
  assert.equal(metrics.git.head, null);
  assert.equal(metrics.planning.todos, 0);
  assert.ok(metrics.tests && metrics.gates && metrics.waves);
});
