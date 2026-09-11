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
    assert.equal(gates.filter((g) => g.builtin).length, 9);
    assert.deepEqual(resolveSelection(ctx, [], {}), ctx.config.gates.tiers.pr);
    assert.deepEqual(resolveSelection(ctx, [], { tier: 'ops' }), ['program-inventory', 'evidence-quality', 'release-readiness']);
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

  it('writes stamp files plus a deterministic latest.txt', () => {
    const ctx = makeCtx(makeTmp());
    const payload = { status: 'GO', failures: [], details: ['all good'] };
    const cp = writeCheckpoint(ctx, 'demo', payload);
    assert.ok(cp.file.endsWith('.txt') && cp.latest.endsWith('latest.txt'));
    const latest = readText(cp.latest);
    assert.match(latest, /status=GO failures=0/);
    assert.match(latest, /^# whw gate demo$/m);
    assert.match(latest, /^PASS all good$/m);
    assert.doesNotMatch(latest, /T\d{6}Z/);
    assert.match(readText(cp.file), /T\d{6}Z/);
    const again = writeCheckpoint(ctx, 'demo', payload);
    assert.equal(readText(again.latest), latest);
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

  it('evidence-quality skips pre-007 and requires durable artifacts after', async (t) => {
    const root = makeTmp();
    const ctx = makeCtx(root);
    const db = openDb(ctx.paths.state);
    t.after(() => closeDb(db));
    db.exec(`
      INSERT INTO todos (ref, title, status, track, step, evidence) VALUES
        ('wave006-E', 'old', 'done', 'wave-006-x', 5, 'session shipped'),
        ('wave007-B', 'new', 'done', 'wave-007-y', 2, 'vibes only');
    `);
    const gate = (await import('../../src/gates/builtin/evidence-quality.js'));
    const bad = await gate.run(ctx, db);
    assert.equal(bad.status, 'NO_GO');
    assert.match(bad.failures[0], /wave007-B/);
    db.exec("UPDATE todos SET evidence = 'PR #3, npm test' WHERE ref = 'wave007-B';");
    const ok = await gate.run(ctx, db);
    assert.equal(ok.status, 'GO');
    assert.equal(gate.evidenceLooksDurable('abc1234'), true);
    assert.equal(gate.evidenceLooksDurable('fixed it'), false);
    assert.equal(gate.waveNumberOf({ ref: 'wave008-A', track: 'wave-008-x' }), 8);
  });

  it('release-readiness skips unpackaged roots and checks a packaged layout', async () => {
    const gate = (await import('../../src/gates/builtin/release-readiness.js'));
    const empty = makeTmp();
    assert.equal((await gate.run(makeCtx(empty))).status, 'GO');
    const root = makeTmp();
    writeText(join(root, 'package.json'), JSON.stringify({ name: 'demo', version: '1.2.3' }));
    const ctx = makeCtx(root);
    const bad = await gate.run(ctx);
    assert.equal(bad.status, 'NO_GO');
    assert.ok(bad.failures.some((f) => /license/i.test(f)));
    writeText(join(root, 'package.json'), JSON.stringify({
      name: 'demo',
      version: '1.2.3',
      license: 'MIT',
      repository: { type: 'git', url: 'git+https://example.com/demo.git' },
      bin: { demo: 'bin/demo.js' },
    }));
    writeText(join(root, 'LICENSE'), 'MIT');
    writeText(join(root, 'README.md'), '# demo');
    writeText(join(root, 'CHANGELOG.md'), '## [1.2.3] - 2026-09-10\n\nShipped.\n');
    writeText(join(root, 'bin', 'demo.js'), '#!/usr/bin/env node\n');
    const ok = await gate.run(makeCtx(root));
    assert.equal(ok.status, 'GO');
  });

  it('release-readiness rejects ./ bin, non-git+ url, and Unreleased at tag', async () => {
    const gate = (await import('../../src/gates/builtin/release-readiness.js'));
    const { runCmd } = await import('../../src/util.js');
    const root = makeTmp();
    writeText(join(root, 'package.json'), JSON.stringify({
      name: 'demo',
      version: '1.2.3',
      license: 'MIT',
      repository: { type: 'git', url: 'https://example.com/demo.git' },
      bin: { demo: './bin/demo.js' },
    }));
    writeText(join(root, 'LICENSE'), 'MIT');
    writeText(join(root, 'README.md'), '# demo');
    writeText(join(root, 'CHANGELOG.md'), '## [Unreleased]\n\n- leftover\n\n## [1.2.3] - 2026-09-10\n\nShipped.\n');
    writeText(join(root, 'bin', 'demo.js'), '#!/usr/bin/env node\n');
    const dirty = await gate.run(makeCtx(root));
    assert.equal(dirty.status, 'NO_GO');
    assert.ok(dirty.failures.some((f) => /must not start with \.\//.test(f)));
    assert.ok(dirty.failures.some((f) => /git\+https/.test(f)));
    assert.equal(dirty.failures.some((f) => /Unreleased/.test(f)), false);

    writeText(join(root, 'package.json'), JSON.stringify({
      name: 'demo',
      version: '1.2.3',
      license: 'MIT',
      repository: { type: 'git', url: 'git+https://example.com/demo.git' },
      bin: { demo: 'bin/demo.js' },
    }));
    assert.equal((await runCmd('git', ['init'], { cwd: root })).code, 0);
    assert.equal((await runCmd('git', ['add', '.'], { cwd: root })).code, 0);
    assert.equal((await runCmd('git', [
      '-c', 'user.email=whw@example.test',
      '-c', 'user.name=WHW Test',
      '-c', 'commit.gpgsign=false',
      'commit', '-m', 'init',
    ], { cwd: root })).code, 0);
    assert.equal((await runCmd('git', ['tag', 'v1.2.3'], { cwd: root })).code, 0);
    const tagged = await gate.run(makeCtx(root));
    assert.equal(tagged.status, 'NO_GO');
    assert.ok(tagged.failures.some((f) => /Unreleased/.test(f)));
    writeText(join(root, 'CHANGELOG.md'), '## [Unreleased]\n\n## [1.2.3] - 2026-09-10\n\nShipped.\n');
    const clean = await gate.run(makeCtx(root));
    assert.equal(clean.status, 'GO');
  });

  it('NO_GO unsynced-state when seeds exist and todos are empty', async () => {
    const root = makeTmp();
    writeSeed(root);
    /** @type {any[]} */
    const captured = [];
    const ctx = makeCtx(root);
    ctx.json = true;
    ctx.log = { info() {}, warn() {}, error() {}, data(d) { captured.push(d); } };
    const { cmdGateRun } = await import('../../src/gates/runner.js');
    const code = await cmdGateRun([], ctx);
    assert.equal(code, 1);
    assert.equal(captured[0].results[0].name, 'unsynced-state');
    assert.equal(captured[0].results[0].status, 'NO_GO');
    assert.match(captured[0].results[0].failures[0], /whw sync --all/);
  });

  it('a second GO run leaves tracked latest.txt unchanged', async () => {
    const { runCmd } = await import('../../src/util.js');
    const { cmdGateRun } = await import('../../src/gates/runner.js');
    const root = makeTmp();
    writeText(join(root, 'whw.config.json'), JSON.stringify({
      gates: { tiers: { pr: ['ok'] }, custom: [{ name: 'ok', command: 'true' }] },
    }));
    const ctx = makeCtx(root);
    assert.equal(await cmdGateRun([], ctx), 0);
    const latestPath = join(root, '.whw', 'checkpoints', 'ok', 'latest.txt');
    const latest = readText(latestPath);
    assert.doesNotMatch(latest, /T\d{6}Z/);
    assert.equal((await runCmd('git', ['init'], { cwd: root })).code, 0);
    assert.equal((await runCmd('git', ['add', '.whw/checkpoints/ok/latest.txt'], { cwd: root })).code, 0);
    assert.equal((await runCmd('git', [
      '-c', 'user.email=whw@example.test',
      '-c', 'user.name=WHW Test',
      '-c', 'commit.gpgsign=false',
      'commit', '-m', 'checkpoint',
    ], { cwd: root })).code, 0);
    assert.equal(await cmdGateRun([], ctx), 0);
    assert.equal(readText(latestPath), latest);
    const st = await runCmd('git', ['status', '--porcelain', '--', '.whw/checkpoints/ok/latest.txt'], { cwd: root });
    assert.equal(st.stdout.trim(), '');
  });
});
