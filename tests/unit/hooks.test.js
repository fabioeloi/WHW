// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { cmdTransition } from '../../src/cli.js';
import { closeDb, openDb } from '../../src/db/sqlite.js';
import { cmdGateRun } from '../../src/gates/runner.js';
import { runHook } from '../../src/hooks.js';
import { applySeedFile } from '../../src/planning/seed.js';
import { fileExists, readText, writeText } from '../../src/util.js';
import { makeCtx, makeTmp, writeSeed } from '../helpers.js';

describe('runHook', () => {
  it('is a no-op when the hook is unset', async () => {
    const ctx = makeCtx(makeTmp());
    const res = await runHook(ctx, 'on_claim', { WHW_REF: 'x' });
    assert.equal(res.ran, false);
  });

  it('runs a shell command with WHW_* env and records a marker file', async () => {
    const root = makeTmp();
    const ctx = makeCtx(root);
    ctx.config.hooks = {
      on_claim: 'printf "%s %s %s\\n" "$WHW_HOOK" "$WHW_REF" "$WHW_ROOT" > "$WHW_ROOT/hook.txt"',
    };
    const res = await runHook(ctx, 'on_claim', { WHW_REF: 'wave010-A' });
    assert.equal(res.ran, true);
    assert.equal(res.code, 0);
    const body = readText(join(root, 'hook.txt'));
    assert.match(body, /on_claim wave010-A/);
    assert.match(body, new RegExp(root));
  });

  it('warns on non-zero exit and does not throw', async () => {
    const root = makeTmp();
    const ctx = makeCtx(root);
    ctx.config.hooks = { on_done: 'exit 7' };
    const warnings = [];
    ctx.log = { info() {}, warn(m) { warnings.push(m); }, error() {}, data() {} };
    const res = await runHook(ctx, 'on_done');
    assert.equal(res.ran, true);
    assert.equal(res.code, 7);
    assert.match(warnings[0] ?? '', /on_done exit 7/);
  });
});

describe('transition and gate hooks', () => {
  it('fires on_claim after a real status change, not on a no-op', async () => {
    const root = makeTmp();
    writeText(join(root, 'whw.config.json'), JSON.stringify({
      hooks: { on_claim: 'printf "%s %s %s→%s\\n" "$WHW_HOOK" "$WHW_REF" "$WHW_FROM" "$WHW_TO" >> "$WHW_ROOT/hook.txt"' },
    }));
    const seed = writeSeed(root);
    const db = openDb(join(root, '.whw', 'state.db'));
    applySeedFile(db, seed);
    closeDb(db);
    const ctx = makeCtx(root);
    assert.equal(await cmdTransition(['t1-1'], ctx, 'claim'), 0);
    assert.match(readText(join(root, 'hook.txt')), /on_claim t1-1 pending→in_progress/);
    assert.equal(await cmdTransition(['t1-1'], ctx, 'claim'), 0);
    assert.equal(readText(join(root, 'hook.txt')).trim().split('\n').length, 1);
  });

  it('fires on_gate_fail after a custom NO_GO without changing the exit code', async () => {
    const root = makeTmp();
    writeText(join(root, 'whw.config.json'), JSON.stringify({
      gates: { custom: [{ name: 'fail', command: 'exit 3' }] },
      hooks: { on_gate_fail: 'printf "%s\\n" "$WHW_GATES" > "$WHW_ROOT/fail.txt"' },
    }));
    const ctx = makeCtx(root);
    assert.equal(await cmdGateRun(['fail'], ctx), 1);
    assert.equal(readText(join(root, 'fail.txt')).trim(), 'fail');
  });

  it('fires on_gate_fail for unsynced-state', async () => {
    const root = makeTmp();
    writeSeed(root);
    writeText(join(root, 'whw.config.json'), JSON.stringify({
      hooks: { on_gate_fail: 'printf "%s\\n" "$WHW_GATES" > "$WHW_ROOT/fail.txt"' },
    }));
    const ctx = makeCtx(root);
    assert.equal(await cmdGateRun(['no-secrets'], ctx), 1);
    assert.equal(readText(join(root, 'fail.txt')).trim(), 'unsynced-state');
  });

  it('a failing on_claim does not roll back the claim', async () => {
    const root = makeTmp();
    writeText(join(root, 'whw.config.json'), JSON.stringify({
      hooks: { on_claim: 'exit 9' },
    }));
    const seed = writeSeed(root);
    const db = openDb(join(root, '.whw', 'state.db'));
    applySeedFile(db, seed);
    closeDb(db);
    const ctx = makeCtx(root);
    ctx.log = { info() {}, warn() {}, error() {}, data() {} };
    assert.equal(await cmdTransition(['t1-1'], ctx, 'claim'), 0);
    const after = openDb(join(root, '.whw', 'state.db'));
    const row = after.prepare("SELECT status FROM todos WHERE ref = 't1-1';").get();
    closeDb(after);
    assert.equal(row.status, 'in_progress');
    assert.equal(fileExists(join(root, 'hook.txt')), false);
  });
});
