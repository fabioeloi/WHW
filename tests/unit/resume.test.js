// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { closeDb, openDb } from '../../src/db/sqlite.js';
import { cmdResume } from '../../src/resume.js';
import { applySeedFile } from '../../src/planning/seed.js';
import { makeCtx, makeTmp, writeSeed } from '../helpers.js';

describe('whw resume', () => {
  it('prints queue + next without claiming', async () => {
    const root = makeTmp();
    const seed = writeSeed(root);
    const db = openDb(join(root, '.whw', 'state.db'));
    applySeedFile(db, seed);
    closeDb(db);
    /** @type {any} */
    let captured;
    const ctx = makeCtx(root, { 'no-sync': true });
    ctx.json = true;
    ctx.log = { info() {}, warn() {}, error() {}, data(d) { captured = d; } };
    assert.equal(await cmdResume([], ctx), 0);
    assert.equal(captured.synced, false);
    assert.equal(captured.next.ref, 't1-1');
    assert.equal(captured.next.status, 'pending');
    const after = openDb(join(root, '.whw', 'state.db'));
    const row = after.prepare("SELECT status FROM todos WHERE ref = 't1-1';").get();
    closeDb(after);
    assert.equal(row.status, 'pending');
  });

  it('syncs seeds unless --no-sync', async () => {
    const root = makeTmp();
    writeSeed(root);
    /** @type {any} */
    let captured;
    const ctx = makeCtx(root);
    ctx.json = true;
    ctx.log = { info() {}, warn() {}, error() {}, data(d) { captured = d; } };
    assert.equal(await cmdResume([], ctx), 0);
    assert.equal(captured.synced, true);
    assert.equal(captured.queue.ready[0].ref, 't1-1');
  });
});
