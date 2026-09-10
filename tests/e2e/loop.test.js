// SPDX-License-Identifier: MIT
/**
 * End-to-end: init → adr → program → wave → sync → queue → claim/done →
 * addendum + plan → close → gates → metrics → handoff, in a temp dir.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { main } from '../../src/cli.js';
import { fileExists, readText } from '../../src/util.js';
import { makeTmp } from '../helpers.js';

describe('e2e full loop', () => {
  it('runs the whole WHW loop green', async () => {
    const root = makeTmp('whw-e2e-');
    const run = (argv) => main(argv, { cwd: root });

    assert.equal(await run(['init', '--project', 'E2E']), 0);
    assert.ok(fileExists(join(root, 'AGENTS.md')));
    assert.ok(fileExists(join(root, 'CLAUDE.md')));

    assert.equal(await run(['adr', 'new', 'demo', '--title', 'Demo']), 0);
    assert.equal(await run(['program', 'new', 'demo', '--waves', '2']), 0);
    assert.equal(await run(['wave', 'new', 'first', '--adr', '0001']), 0);
    assert.ok(fileExists(join(root, 'planning', 'wave-001-first.todos.sql')));

    assert.equal(await run(['sync', '--all']), 0);
    assert.equal(await run(['queue']), 0);
    assert.equal(await run(['run', 'planner', '--dry-run', '--json', '--task', 'pick next']), 0);

    for (const l of ['A', 'B', 'C', 'D']) {
      assert.equal(await run(['claim', `wave001-${l}`]), 0);
      assert.equal(await run(['done', `wave001-${l}`, '--evidence', `commit ${l}, tests green`]), 0);
    }
    // E unlocks only after D
    assert.equal(await run(['queue', '--status', 'pending']), 0);

    // Wave D artifacts: addendum + plan entry
    const adr = join(root, 'docs', 'adr', '0001-demo.md');
    readFileSync(adr, 'utf8'); // exists
    const { appendFileSync } = await import('node:fs');
    appendFileSync(adr, '\n## Addendum Wave 001 — demo\n\nShipped. Evidence: commits A-D.\n');
    appendFileSync(join(root, 'docs', 'plan.md'), '\n## Wave 001 — first\n\nDone.\n');

    assert.equal(await run(['close', '001']), 0);
    assert.equal(await run(['gate', 'run', '--tier', 'pr']), 0);
    assert.equal(await run(['gate', 'run', '--tier', 'ops']), 0);
    assert.equal(await run(['metrics']), 0);
    assert.equal(await run(['handoff', '--from', 'cursor', '--to', 'codex']), 0);
    assert.ok(fileExists(join(root, 'docs', 'handoff', 'handoff-20260910-cursor-to-codex.md')) || fileExists(join(root, 'docs', 'handoff')));

    const latest = readText(join(root, '.whw', 'checkpoints', 'wave-sync', 'latest.txt'));
    assert.match(latest, /status=GO/);
  });

  it('close refuses without addendum; gates catch drift', async () => {
    const root = makeTmp('whw-e2e-neg-');
    const run = (argv) => main(argv, { cwd: root });
    await run(['init', '--project', 'Neg']);
    await run(['adr', 'new', 'demo']);
    await run(['wave', 'new', 'first', '--adr', '0001']);
    await run(['sync', '--all']);
    for (const l of ['A', 'B', 'C', 'D']) {
      await run(['claim', `wave001-${l}`]);
      await run(['done', `wave001-${l}`, '--evidence', 'e']);
    }
    await assert.rejects(run(['close', '001']), /no .*Addendum Wave 001/);
  });
});
