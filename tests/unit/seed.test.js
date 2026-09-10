// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { closeDb, get, openDb } from '../../src/db/sqlite.js';
import { applySeedFile, listSeedFiles } from '../../src/planning/seed.js';
import { setStatus } from '../../src/planning/transitions.js';
import { writeText } from '../../src/util.js';
import { makeTmp, seedSql } from '../helpers.js';

describe('seed', () => {
  it('lists only *.todos.sql, sorted, with track filter', () => {
    const root = makeTmp();
    writeText(join(root, 'planning', 'b.todos.sql'), seedSql('b'));
    writeText(join(root, 'planning', 'a.todos.sql'), seedSql('a'));
    writeText(join(root, 'planning', 'a.done.sql'), '-- hook');
    writeText(join(root, 'planning', 'notes.md'), 'x');
    const all = listSeedFiles(join(root, 'planning'));
    assert.deepEqual(all.map((f) => f.split('/').pop()), ['a.todos.sql', 'b.todos.sql']);
    assert.equal(listSeedFiles(join(root, 'planning'), { track: 'b' }).length, 1);
  });

  it('re-sync never downgrades done', (t) => {
    const root = makeTmp();
    const db = openDb(join(root, '.whw', 'state.db'));
    t.after(() => closeDb(db));
    const file = join(root, 'planning', 'w.todos.sql');
    writeText(file, seedSql('w'));
    applySeedFile(db, file);
    setStatus(db, 'w-1', 'in_progress', { actor: 't' });
    setStatus(db, 'w-1', 'done', { actor: 't', evidence: 'e' });
    applySeedFile(db, file); // seed still says pending
    assert.equal(get(db, 'SELECT status FROM todos WHERE ref = ?', 'w-1').status, 'done');
  });

  it('re-sync preserves in_progress, blocked, and cancelled', (t) => {
    const root = makeTmp();
    const db = openDb(join(root, '.whw', 'state.db'));
    t.after(() => closeDb(db));
    const file = join(root, 'planning', 'w.todos.sql');
    writeText(file, seedSql('w'));
    applySeedFile(db, file);
    setStatus(db, 'w-1', 'in_progress', { actor: 't' });
    setStatus(db, 'w-2', 'blocked', { actor: 't', evidence: 'waiting' });
    applySeedFile(db, file);
    assert.equal(get(db, 'SELECT status FROM todos WHERE ref = ?', 'w-1').status, 'in_progress');
    assert.equal(get(db, 'SELECT status FROM todos WHERE ref = ?', 'w-2').status, 'blocked');
    setStatus(db, 'w-2', 'cancelled', { actor: 't', evidence: 'wont' });
    applySeedFile(db, file);
    assert.equal(get(db, 'SELECT status FROM todos WHERE ref = ?', 'w-2').status, 'cancelled');
  });

  it('rolls back a broken seed with filename in the error', (t) => {
    const root = makeTmp();
    const db = openDb(join(root, '.whw', 'state.db'));
    t.after(() => closeDb(db));
    const file = join(root, 'planning', 'bad.todos.sql');
    writeText(file, 'THIS IS NOT SQL;');
    assert.throws(() => applySeedFile(db, file), /seed failed: .*bad\.todos\.sql/);
  });
});
