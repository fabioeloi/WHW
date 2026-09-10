// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { nextAdrNumber } from '../../src/scaffold/adr.js';
import { buildWaveSeedSql, nextWaveNumber, resolveAdr } from '../../src/scaffold/wave.js';
import { writeText } from '../../src/util.js';
import { makeTmp } from '../helpers.js';

describe('scaffold numbering', () => {
  it('nextAdrNumber starts at 1 and increments', () => {
    const root = makeTmp();
    assert.equal(nextAdrNumber(join(root, 'docs', 'adr')), 1);
    writeText(join(root, 'docs', 'adr', '0001-a.md'), 'x');
    writeText(join(root, 'docs', 'adr', '0009-b.md'), 'x');
    assert.equal(nextAdrNumber(join(root, 'docs', 'adr')), 10);
  });

  it('nextWaveNumber scans wave files', () => {
    const root = makeTmp();
    assert.equal(nextWaveNumber(join(root, 'planning')), 1);
    writeText(join(root, 'planning', 'wave-001-a.todos.sql'), 'x');
    writeText(join(root, 'planning', 'wave-002-b.todos.sql'), 'x');
    assert.equal(nextWaveNumber(join(root, 'planning')), 3);
  });

  it('resolveAdr pads and matches files', () => {
    const root = makeTmp();
    writeText(join(root, 'docs', 'adr', '0009-x.md'), 'x');
    assert.equal(resolveAdr(join(root, 'docs', 'adr'), '9'), '0009');
    assert.equal(resolveAdr(join(root, 'docs', 'adr'), '0010'), null);
  });

  it('buildWaveSeedSql emits A–E rows and the chain', () => {
    const { rows, deps } = buildWaveSeedSql({ wave: '003', refPrefix: 'wave003', track: 'wave-003-s', slug: 's', adr: '0009' });
    for (const l of ['A', 'B', 'C', 'D', 'E']) assert.match(rows, new RegExp(`wave003-${l}`));
    assert.match(deps, /'wave003-B', 'wave003-A'/);
    assert.match(deps, /'wave003-E', 'wave003-D'/);
  });
});
