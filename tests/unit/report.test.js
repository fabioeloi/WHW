// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { closeDb, openDb } from '../../src/db/sqlite.js';
import { applySeedFile } from '../../src/planning/seed.js';
import { setStatus } from '../../src/planning/transitions.js';
import { renderStatus, statusData } from '../../src/report.js';
import { makeTmp, writeSeed } from '../helpers.js';

describe('report', () => {
  it('renders Status / Evidence / Next step from SQL', (t) => {
    const root = makeTmp();
    const db = openDb(join(root, '.whw', 'state.db'));
    t.after(() => closeDb(db));
    applySeedFile(db, writeSeed(root));
    setStatus(db, 't1-1', 'in_progress', { actor: 't' });
    setStatus(db, 't1-1', 'done', { actor: 't', evidence: 'commit abc' });
    const md = renderStatus(db, {});
    assert.match(md, /## Status/);
    assert.match(md, /t1-1.*done/);
    assert.match(md, /## Evidence/);
    assert.match(md, /commit abc/);
    assert.match(md, /## Next step/);
    assert.match(md, /t1-2/);
    const d = statusData(db, {});
    assert.equal(d.done.length, 1);
    assert.equal(d.next.ref, 't1-2');
  });

  it('empty queue suggests chartering a wave', (t) => {
    const root = makeTmp();
    const db = openDb(join(root, '.whw', 'state.db'));
    t.after(() => closeDb(db));
    assert.match(renderStatus(db, {}), /whw wave new/);
  });
});
