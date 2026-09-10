// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { closeDb, openDb } from '../../src/db/sqlite.js';
import { applySeedFile } from '../../src/planning/seed.js';
import { listGates, resolveSelection, runOne, writeCheckpoint } from '../../src/gates/runner.js';
import { readText, writeText } from '../../src/util.js';
import { makeCtx, makeTmp, writeSeed } from '../helpers.js';

describe('gate runner', () => {
  it('lists builtins with tiers and resolves selections', () => {
    const ctx = makeCtx(makeTmp());
    const gates = listGates(ctx);
    assert.equal(gates.filter((g) => g.builtin).length, 7);
    assert.deepEqual(resolveSelection(ctx, [], {}), ctx.config.gates.tiers.pr);
    assert.deepEqual(resolveSelection(ctx, [], { tier: 'ops' }), ['program-inventory']);
    assert.deepEqual(resolveSelection(ctx, ['no-secrets'], {}), ['no-secrets']);
    assert.throws(() => resolveSelection(ctx, ['nope'], {}), /unknown gate/);
    assert.throws(() => resolveSelection(ctx, [], { tier: 'nope' }), /unknown tier/);
  });

  it('runs custom shell gates by exit code', async (t) => {
    const root = makeTmp();
    writeText(join(root, 'whw.config.json'), JSON.stringify({ gates: { custom: [
      { name: 'pass', command: 'echo hi' },
      { name: 'fail', command: 'exit 3' },
    ] } }));
    const ctx = makeCtx(root);
    const db = openDb(ctx.paths.state);
    t.after(() => closeDb(db));
    const okRes = await runOne(ctx, { name: 'pass' }, db);
    assert.equal(okRes.status, 'GO');
    const badRes = await runOne(ctx, { name: 'fail' }, db);
    assert.equal(badRes.status, 'NO_GO');
    assert.match(badRes.failures[0], /exit 3/);
    await assert.rejects(runOne(ctx, { name: 'ghost' }, db), /unknown gate/);
  });

  it('writes stamp + latest checkpoints with status line', () => {
    const ctx = makeCtx(makeTmp());
    const cp = writeCheckpoint(ctx, 'demo', { status: 'GO', failures: [], details: ['all good'] });
    assert.ok(cp.file.endsWith('.txt') && cp.latest.endsWith('latest.txt'));
    assert.match(readText(cp.latest), /status=GO failures=0/);
  });

  it('planning-coverage fails on unsynced seeds, passes after sync', async (t) => {
    const root = makeTmp();
    const ctx = makeCtx(root);
    const seed = writeSeed(root);
    const db = openDb(ctx.paths.state);
    t.after(() => closeDb(db));
    const gate = (await import('../../src/gates/builtin/planning-coverage.js'));
    const before = await gate.run(ctx, db);
    assert.equal(before.status, 'NO_GO');
    applySeedFile(db, seed);
    const after = await gate.run(ctx, db);
    assert.equal(after.status, 'GO');
  });

  it('no-secrets catches a private key and ignores clean text', async () => {
    const root = makeTmp();
    writeText(join(root, 'note.txt'), 'hello world');
    const gate = (await import('../../src/gates/builtin/no-secrets.js'));
    const ctx = makeCtx(root);
    assert.equal((await gate.run(ctx)).status, 'GO');
    // Split literal so this repo's own no-secrets gate never matches this line;
    // the temp file still receives the full marker at runtime.
    writeText(join(root, 'key.pem'), `-----BEGIN RSA PRIVATE ${'KEY'}-----\nabc`);
    const bad = await gate.run(ctx);
    assert.equal(bad.status, 'NO_GO');
    assert.match(bad.failures[0], /private-key/);
  });
});
