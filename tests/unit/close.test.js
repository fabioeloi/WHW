// SPDX-License-Identifier: MIT
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { cmdClose } from '../../src/close.js';
import { all, closeDb, get, openDb } from '../../src/db/sqlite.js';
import { applySeedFile } from '../../src/planning/seed.js';
import { setStatus } from '../../src/planning/transitions.js';
import { writeText } from '../../src/util.js';
import { makeCtx, makeTmp } from '../helpers.js';

function fixture(t, { terminal = true, addendum = true, red = false } = {}) {
  const root = makeTmp();
  const ctx = makeCtx(root, { actor: 'test' });
  const seed = join(ctx.paths.planning, 'wave-001-fixture.todos.sql');
  writeText(seed, `INSERT INTO todos (ref,title,status,track,step,letter,adr) VALUES\n${['A','B','C','D','E'].map((l, i) => `('wave001-${l}','Fixture ${l}','pending','wave-001-fixture',${i + 1},'${l}','0001')`).join(',\n')};`);
  writeText(join(ctx.paths.planning, 'wave-001-fixture.done.sql'), "UPDATE todos SET status='done' WHERE track='wave-001-fixture' AND status NOT IN ('done','cancelled');");
  writeText(join(ctx.paths.adr, '0001-fixture.md'), addendum ? '## Addendum Wave 001\n' : '# Fixture ADR\n');
  writeText(join(root, 'README.md'), red ? '# Fixture\n[missing](missing.md)\n' : '# Fixture\n');
  const db = openDb(ctx.paths.state);
  t.after(() => closeDb(db));
  applySeedFile(db, seed);
  if (terminal) for (const letter of ['A','B','C','D']) {
    setStatus(db, `wave001-${letter}`, 'in_progress', { actor: 'test' });
    setStatus(db, `wave001-${letter}`, 'done', { actor: 'test', evidence: 'npm test' });
  }
  return { ctx, db };
}

for (const scenario of [
  { name: 'nonterminal A–D', options: { terminal: false }, error: /letters not terminal/ },
  { name: 'missing addendum', options: { addendum: false }, error: /no.*Addendum/ },
  { name: 'red sync gate', options: { red: true }, error: /readme-sync NO_GO/ },
]) it(`close refuses ${scenario.name} without completing E or changing transitions`, async (t) => {
  const { ctx, db } = fixture(t, scenario.options);
  const before = all(db, 'SELECT ref,status,evidence FROM todos ORDER BY ref;');
  const transitions = all(db, 'SELECT * FROM transitions;');
  await assert.rejects(cmdClose(['001'], ctx), scenario.error);
  assert.deepEqual(all(db, 'SELECT ref,status,evidence FROM todos ORDER BY ref;'), before);
  assert.deepEqual(all(db, 'SELECT * FROM transitions;'), transitions);
});

it('close records E evidence and audit once; repeat never downgrades done', async (t) => {
  const { ctx, db } = fixture(t);
  assert.equal(await cmdClose(['001'], ctx), 0);
  assert.equal(get(db, "SELECT status FROM todos WHERE ref='wave001-E';").status, 'done');
  assert.equal(get(db, "SELECT evidence FROM todos WHERE ref='wave001-E';").evidence, 'whw close wave-001-fixture');
  const audit = all(db, "SELECT from_status,to_status,evidence FROM transitions WHERE ref='wave001-E';");
  assert.deepEqual(audit.map((r) => ({ ...r })), [{ from_status: 'pending', to_status: 'done', evidence: 'whw close wave-001-fixture' }]);
  const before = all(db, 'SELECT ref,status,evidence FROM todos ORDER BY ref;');
  assert.equal(await cmdClose(['wave-001-fixture'], ctx), 0);
  assert.deepEqual(all(db, 'SELECT ref,status,evidence FROM todos ORDER BY ref;'), before);
  assert.equal(all(db, "SELECT * FROM transitions WHERE ref='wave001-E';").length, 1);
});
