// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { main } from '../../src/cli.js';
import { DESIGN_HEADINGS } from '../../src/shift-left.js';
import { readText, writeText } from '../../src/util.js';
import { makeTmp } from '../helpers.js';

/** @param {string} root @param {'classic'|'shift-left'} profile */
function writeProject(root, profile) {
  writeText(join(root, 'whw.config.json'), JSON.stringify({
    process: { profile },
    fitness: [{ id: 'block', command: 'node -e "process.exit(1)"' }],
  }));
  writeText(join(root, 'docs', 'adr', '0001-h.md'), '# ADR\n');
}

/** @param {string} root */
function writeDesign(root) {
  const body = `# Design\n\n${DESIGN_HEADINGS.map((heading) => `${heading}\n\nnoted.\n`).join('\n')}`;
  writeText(join(root, 'docs', 'design', 'wave-001.md'), body);
}

describe('shift-left fitness timing', () => {
  it('refuses Build on high risk while fitness is NO_GO', async () => {
    const root = makeTmp('whw-fit-');
    writeProject(root, 'shift-left');
    const run = (args) => main(args, { cwd: root, quiet: true });
    assert.equal(await run(['wave', 'new', 'pay', '--adr', '0001', '--signals', 'pii']), 0);
    assert.equal(await run(['sync', '--all']), 0);
    assert.equal(await run(['claim', 'wave001-A']), 0);
    assert.equal(await run(['done', 'wave001-A', '--evidence', 'seed']), 0);
    await assert.rejects(run(['claim', 'wave001-B']), /waiting on wave001-D0/);
    assert.equal(await run(['claim', 'wave001-D0']), 0);
    await assert.rejects(run(['done', 'wave001-D0', '--evidence', 'design']), /Hypothesis/);
    writeDesign(root);
    assert.equal(await run(['done', 'wave001-D0', '--evidence', 'design']), 0);
    await assert.rejects(run(['claim', 'wave001-B']), /fitness NO_GO \(block\)/);
  });

  it('does not run fitness before Build on classic', async () => {
    const root = makeTmp('whw-fit-classic-');
    writeProject(root, 'classic');
    const run = (args) => main(args, { cwd: root, quiet: true });
    assert.equal(await run(['wave', 'new', 'pay', '--adr', '0001', '--signals', 'pii']), 0);
    assert.equal(await run(['sync', '--all']), 0);
    assert.equal(await run(['claim', 'wave001-A']), 0);
    assert.equal(await run(['done', 'wave001-A', '--evidence', 'seed']), 0);
    assert.equal(await run(['claim', 'wave001-B']), 0);
    assert.match(readText(join(root, 'planning', 'wave-001-pay.todos.sql')), /wave001-B/);
    assert.doesNotMatch(readText(join(root, 'planning', 'wave-001-pay.todos.sql')), /D0/);
  });
});
