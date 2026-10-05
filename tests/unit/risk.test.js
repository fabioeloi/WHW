// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { main } from '../../src/cli.js';
import { closeDb, openDb } from '../../src/db/sqlite.js';
import { buildWaveSeedSql } from '../../src/scaffold/wave.js';
import { classify, lettersFor, policyFor } from '../../src/risk.js';
import { readJson, readText, writeText } from '../../src/util.js';
import { makeTmp } from '../helpers.js';

describe('risk classification', () => {
  it('lets the highest signal win and rejects unknown names', () => {
    assert.equal(classify(['docs']), 'low');
    assert.equal(classify(['docs', 'auth']), 'high');
    assert.equal(classify(['schema', 'architecture']), 'critical');
    assert.equal(classify(['logging']), 'high');
    assert.equal(classify(['local-refactor', 'test-only']), 'low');
    assert.throws(() => classify(['mystery']), /unknown signal/);
    assert.throws(() => classify([]), /at least one signal/);
  });

  it('keeps classic on A–E and routes shift-left by class', () => {
    assert.deepEqual(lettersFor('classic', 'critical'), ['A', 'B', 'C', 'D', 'E']);
    assert.deepEqual(policyFor('low').letters, ['A', 'B', 'C', 'E']);
    assert.equal(policyFor('low').humanJudgment, 'never');
    assert.equal(policyFor('medium').humanJudgment, 'on-exception');
    assert.deepEqual(policyFor('high').letters, ['A', 'D0', 'B', 'C', 'D', 'E']);
    assert.equal(policyFor('high').fitnessBeforeBuild, true);
    assert.deepEqual(policyFor('critical').letters, ['A', 'D0', 'B', 'C', 'D', 'W', 'E']);
    assert.equal(policyFor('critical').walkthrough, true);
    const { deps } = buildWaveSeedSql({
      wave: '003', refPrefix: 'wave003', track: 'wave-003-s', slug: 's', adr: '0009',
      letters: policyFor('critical').letters,
    });
    assert.match(deps, /'wave003-D0', 'wave003-A'/);
    assert.match(deps, /'wave003-B', 'wave003-D0'/);
    assert.match(deps, /'wave003-W', 'wave003-D'/);
  });

  it('accepts D0 and W on a fresh database', () => {
    const db = openDb(join(makeTmp(), 'state.db'));
    try {
      db.exec(`INSERT INTO todos (ref, title, track, step, letter) VALUES
        ('wave001-D0', 'design', 'wave-001-x', 2, 'D0'),
        ('wave001-W', 'walk', 'wave-001-x', 6, 'W');`);
      const letters = db.prepare('SELECT letter FROM todos ORDER BY step;').all().map((row) => row.letter);
      assert.deepEqual(letters, ['D0', 'W']);
    } finally {
      closeDb(db);
    }
  });

  it('ignores signals on classic and records the class on shift-left', async () => {
    const classic = makeTmp('whw-risk-classic-');
    writeText(join(classic, 'whw.config.json'), JSON.stringify({ process: { profile: 'classic' } }));
    writeText(join(classic, 'docs', 'adr', '0001-x.md'), '# ADR\n');
    assert.equal(await main(['wave', 'new', 'demo', '--adr', '0001', '--signals', 'architecture,security-boundary'], { cwd: classic, quiet: true }), 0);
    const classicSql = readText(join(classic, 'planning', 'wave-001-demo.todos.sql'));
    assert.match(classicSql, /wave001-D'/);
    assert.doesNotMatch(classicSql, /wave001-D0/);
    const classicRisk = readJson(join(classic, 'planning', 'wave-001-demo.risk.json'));
    assert.equal(classicRisk.class, null);
    assert.deepEqual(classicRisk.letters, ['A', 'B', 'C', 'D', 'E']);

    const shifted = makeTmp('whw-risk-shift-');
    writeText(join(shifted, 'whw.config.json'), JSON.stringify({ process: { profile: 'shift-left' } }));
    writeText(join(shifted, 'docs', 'adr', '0001-x.md'), '# ADR\n');
    assert.equal(await main(['wave', 'new', 'demo', '--adr', '0001', '--signals', 'architecture,security-boundary'], { cwd: shifted, quiet: true }), 0);
    const shiftedRisk = readJson(join(shifted, 'planning', 'wave-001-demo.risk.json'));
    assert.equal(shiftedRisk.class, 'critical');
    assert.deepEqual(shiftedRisk.letters, ['A', 'D0', 'B', 'C', 'D', 'W', 'E']);
    await assert.rejects(
      main(['wave', 'new', 'other', '--adr', '0001'], { cwd: shifted, quiet: true }),
      /at least one signal/,
    );
  });
});
