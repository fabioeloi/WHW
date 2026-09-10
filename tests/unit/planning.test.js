// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { closeDb, get, openDb } from '../../src/db/sqlite.js';
import { getQueue, listTodos } from '../../src/planning/queue.js';
import { applySeedFile } from '../../src/planning/seed.js';
import { appendNote, recentTransitions, setStatus } from '../../src/planning/transitions.js';
import { makeTmp, writeSeed } from '../helpers.js';

function seededDb() {
  const root = makeTmp();
  const db = openDb(join(root, '.whw', 'state.db'));
  applySeedFile(db, writeSeed(root));
  return { root, db };
}

describe('planning queue', () => {
  it('gates B behind A until A is done', (t) => {
    const { db } = seededDb();
    t.after(() => closeDb(db));
    let q = getQueue(db, {});
    assert.deepEqual(q.ready.map((r) => r.ref), ['t1-1']);
    setStatus(db, 't1-1', 'in_progress', { actor: 'test' });
    setStatus(db, 't1-1', 'done', { actor: 'test', evidence: 'tests green' });
    q = getQueue(db, {});
    assert.deepEqual(q.ready.map((r) => r.ref), ['t1-2']);
  });

  it('lists in_progress first', (t) => {
    const { db } = seededDb();
    t.after(() => closeDb(db));
    setStatus(db, 't1-1', 'in_progress', { actor: 'test' });
    const q = getQueue(db, {});
    assert.deepEqual(q.inProgress.map((r) => r.ref), ['t1-1']);
    assert.deepEqual(q.ready.map((r) => r.ref), []);
  });

  it('filters by track and status', (t) => {
    const { db } = seededDb();
    t.after(() => closeDb(db));
    assert.equal(listTodos(db, { status: 'pending', track: 't1' }).length, 2);
    assert.equal(listTodos(db, { track: 'nope' }).length, 0);
  });
});

describe('planning transitions', () => {
  it('requires evidence for done', (t) => {
    const { db } = seededDb();
    t.after(() => closeDb(db));
    setStatus(db, 't1-1', 'in_progress', { actor: 'test' });
    assert.throws(() => setStatus(db, 't1-1', 'done', { actor: 'test' }), /without --evidence/);
  });

  it('rejects illegal edges and unknown refs', (t) => {
    const { db } = seededDb();
    t.after(() => closeDb(db));
    assert.throws(() => setStatus(db, 't1-1', 'done', { evidence: 'x' }), /illegal transition pending -> done/);
    assert.throws(() => setStatus(db, 'nope', 'in_progress', {}), /unknown todo ref/);
  });

  it('audits every transition and appends notes', (t) => {
    const { db } = seededDb();
    t.after(() => closeDb(db));
    setStatus(db, 't1-1', 'in_progress', { actor: 'amy' });
    appendNote(db, 't1-1', 'halfway');
    setStatus(db, 't1-1', 'done', { actor: 'amy', evidence: 'commit abc' });
    const trs = recentTransitions(db, {});
    assert.equal(trs.length, 2);
    assert.equal(trs[0].to_status, 'done');
    assert.equal(get(db, 'SELECT evidence FROM todos WHERE ref = ?', 't1-1').evidence, 'commit abc');
    assert.match(get(db, 'SELECT notes FROM todos WHERE ref = ?', 't1-1').notes, /halfway/);
  });

  it('done is terminal', (t) => {
    const { db } = seededDb();
    t.after(() => closeDb(db));
    setStatus(db, 't1-1', 'in_progress', { actor: 't' });
    setStatus(db, 't1-1', 'done', { actor: 't', evidence: 'e' });
    assert.throws(() => setStatus(db, 't1-1', 'in_progress', {}), /illegal transition done -> in_progress/);
  });
});
