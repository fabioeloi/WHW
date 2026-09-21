// SPDX-License-Identifier: MIT
/**
 * maint-audit fixture: trailer vs chore(deps) vs chore(maint) vs naked commits.
 * Static files under tests/fixtures/maint-audit/.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDb, openDb } from '../../src/db/sqlite.js';
import * as gate from '../../src/gates/builtin/maint-audit.js';
import { runCmd } from '../../src/util.js';
import { makeCtx } from '../helpers.js';

const FIXTURE_ROOT = join(fileURLToPath(import.meta.url), '..', '..', 'fixtures', 'maint-audit');

const GIT_FLAGS = [
  '-c', 'user.email=whw@example.test',
  '-c', 'user.name=WHW Test',
  '-c', 'commit.gpgsign=false',
];

/** @param {string} root @param {string[]} args */
async function git(root, args) {
  return runCmd('git', [...GIT_FLAGS, ...args], { cwd: root });
}

/** @param {string} root @param {string} message */
async function gitCommit(root, message) {
  assert.equal((await git(root, ['add', '.'])).code, 0);
  assert.equal((await git(root, ['commit', '--allow-empty', '-m', message])).code, 0);
}

/** @returns {Promise<{ root: string, ctx: ReturnType<typeof makeCtx>, db: import('node:sqlite').DatabaseSync }>} */
async function openFixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'whw-maint-audit-'));
  cpSync(join(FIXTURE_ROOT, 'planning'), join(root, 'planning'), { recursive: true });
  assert.equal((await git(root, ['init', '-b', 'main'])).code, 0);
  await gitCommit(root, 'docs(close): program 011 (Wave 011 E)');
  const ctx = makeCtx(root);
  const db = openDb(ctx.paths.state);
  db.exec(`
    INSERT INTO todos (ref, title, status, track, step, letter) VALUES
      ('wave011-E', 'close', 'done', 'wave-011-program-close', 5, 'E');
  `);
  t.after(() => closeDb(db));
  return { root, ctx, db };
}

describe('maint-audit fixture', () => {
  it('subjectIsAllowed accepts wave trailers and maint prefixes only', () => {
    const allowed = [
      'feat(gates): add maint-audit (Wave 013 B)',
      'chore(deps): bump actions/checkout from 6 to 7',
      'chore(maint): pin actions/setup-node',
    ];
    const rejected = [
      'fix: sneaky hotfix',
      'docs: missing trailer',
      'chore(deps-extra): grouped bump',
      'prefix chore(deps): wrong order',
    ];
    for (const s of allowed) assert.equal(gate.subjectIsAllowed(s), true, s);
    for (const s of rejected) assert.equal(gate.subjectIsAllowed(s), false, s);
  });

  it('GO when only trailer, chore(deps), and chore(maint) commits follow the close', async (t) => {
    const { root, ctx, db } = await openFixture(t);
    await gitCommit(root, 'feat(release): OIDC publish (Wave 013 B)');
    await gitCommit(root, 'chore(deps): bump actions/checkout from 6 to 7');
    await gitCommit(root, 'chore(maint): refresh checkpoint');
    const res = await gate.run(ctx, db);
    assert.equal(res.status, 'GO');
    assert.match(res.details.join('\n'), /baseline wave-011-program-close/);
    assert.match(res.details.join('\n'), /allowed/);
  });

  it('NO_GO when a naked commit lands after the close', async (t) => {
    const { root, ctx, db } = await openFixture(t);
    await gitCommit(root, 'feat(release): OIDC publish (Wave 013 B)');
    await gitCommit(root, 'fix: sneaky hotfix without trailer');
    const res = await gate.run(ctx, db);
    assert.equal(res.status, 'NO_GO');
    assert.ok(res.failures.some((f) => /sneaky hotfix/.test(f)));
  });

  it('skips merge commits when scanning the range', async (t) => {
    const { root, ctx, db } = await openFixture(t);
    await gitCommit(root, 'feat(x): branch work (Wave 013 B)');
    const base = (await git(root, ['branch', '--show-current'])).stdout.trim();
    assert.equal((await git(root, ['checkout', '-b', 'side'])).code, 0);
    await gitCommit(root, 'feat(y): side work (Wave 013 C)');
    assert.equal((await git(root, ['checkout', base])).code, 0);
    assert.equal(
      (await git(root, ['merge', '--no-ff', '-m', 'Merge pull request #99 without trailer', 'side'])).code,
      0,
    );
    const res = await gate.run(ctx, db);
    assert.equal(res.status, 'GO');
  });

  it('NO_GO when E is done but the close commit cannot be found in git', async (t) => {
    const root = mkdtempSync(join(tmpdir(), 'whw-maint-audit-'));
    cpSync(join(FIXTURE_ROOT, 'planning'), join(root, 'planning'), { recursive: true });
    assert.equal((await git(root, ['init', '-b', 'main'])).code, 0);
    await gitCommit(root, 'init without wave trailer');
    const ctx = makeCtx(root);
    const db = openDb(ctx.paths.state);
    t.after(() => closeDb(db));
    db.exec(`
      INSERT INTO todos (ref, title, status, track, step, letter) VALUES
        ('wave011-E', 'close', 'done', 'wave-011-program-close', 5, 'E');
    `);
    const res = await gate.run(ctx, db);
    assert.equal(res.status, 'NO_GO');
    assert.ok(res.failures.some((f) => /no git commit matches/.test(f)));
  });
});
