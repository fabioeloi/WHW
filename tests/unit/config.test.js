// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { collectEnv, defaultConfig, loadConfig, mergeDeep } from '../../src/config.js';
import { writeText } from '../../src/util.js';
import { makeTmp } from '../helpers.js';
import { join } from 'node:path';

describe('config', () => {
  it('defaults carry the pr tier and rubric', () => {
    const c = defaultConfig();
    assert.deepEqual(c.gates.tiers.pr, ['planning-coverage', 'adr-link', 'wave-sync', 'readme-sync', 'agents-parity', 'no-secrets']);
    assert.deepEqual(c.gates.tiers.ops, ['program-inventory', 'evidence-quality']);
    assert.equal(c.evaluate.threshold, 3.5);
    assert.equal(c.evaluate.criteria.length, 4);
  });

  it('mergeDeep merges objects and replaces arrays', () => {
    const out = mergeDeep({ a: { x: 1, y: 2 }, l: [1] }, { a: { y: 3 }, l: [2] });
    assert.deepEqual(out, { a: { x: 1, y: 3 }, l: [2] });
  });

  it('precedence: env > file > defaults', () => {
    const root = makeTmp();
    writeText(join(root, 'whw.config.json'), JSON.stringify({ project: 'File', dirs: { state: 'file.db' } }));
    const fromFile = loadConfig({ cwd: root });
    assert.equal(fromFile.config.project, 'File');
    assert.ok(fromFile.paths.state.endsWith('file.db'));
    const fromEnv = loadConfig({ cwd: root, env: { WHW_PROJECT: 'Env', WHW_STATE: 'env.db' } });
    assert.equal(fromEnv.config.project, 'Env');
    assert.ok(fromEnv.paths.state.endsWith('env.db'));
    const plain = loadConfig({ cwd: makeTmp() });
    assert.equal(plain.config.project, 'WHW Project');
  });

  it('collectEnv maps WHW_* vars', () => {
    assert.deepEqual(collectEnv({ WHW_PROJECT: 'P', WHW_ADR: 'a', OTHER: 'x' }), {
      project: 'P',
      dirs: { adr: 'a' },
    });
  });

  it('invalid config file throws helpfully', () => {
    const root = makeTmp();
    writeText(join(root, 'whw.config.json'), '{nope');
    assert.throws(() => loadConfig({ cwd: root }), /invalid .*whw\.config\.json/);
  });
});
