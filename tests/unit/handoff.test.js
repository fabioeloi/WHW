// SPDX-License-Identifier: MIT
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { cmdHandoff } from '../../src/handoff.js';
import { closeDb, openDb } from '../../src/db/sqlite.js';
import { applySeedFile } from '../../src/planning/seed.js';
import { setStatus } from '../../src/planning/transitions.js';
import { readText, runCmd, writeText } from '../../src/util.js';
import { makeCtx, makeTmp, writeSeed } from '../helpers.js';

it('handoff includes git baseline, SQL queue and evidence, gate pointers and explicit output path', async () => {
  const root = makeTmp();
  const command = async (args) => {
    const result = await runCmd('git', args, { cwd: root });
    assert.equal(result.code, 0, result.stderr);
    return result.stdout.trim();
  };
  await command(['init', '-b', 'fixture']);
  writeText(join(root, 'tracked.txt'), 'baseline');
  await command(['add', 'tracked.txt']);
  await command(['-c', 'user.name=WHW Test', '-c', 'user.email=whw@example.test', '-c', 'commit.gpgsign=false', 'commit', '-m', 'fixture baseline']);
  const head = await command(['rev-parse', '--short', 'HEAD']);
  const ctx = makeCtx(root, { from: 'codex', to: 'gemini', out: 'out/handoff.md', task: 'Continue fixture' });
  const db = openDb(ctx.paths.state);
  try {
    applySeedFile(db, writeSeed(root));
    setStatus(db, 't1-1', 'in_progress', { actor: 'test' });
    setStatus(db, 't1-1', 'done', { actor: 'test', evidence: 'npm test; tracked.txt' });
  } finally { closeDb(db); }
  writeText(join(ctx.paths.checkpoints, 'fixture/latest.txt'), 'status=GO failures=0\n');
  // A transcript file exists locally but must never be copied into handoff.
  writeText(join(root, '.codex/sessions/local.jsonl'), 'TRANSCRIPT_SENTINEL');
  ctx.json = true;
  let captured;
  ctx.log = { info() {}, data(d) { captured = d; } };
  assert.equal(await cmdHandoff([], ctx), 0);
  assert.equal(captured.out, 'out/handoff.md');
  assert.equal(captured.branch, 'fixture');
  assert.equal(captured.head, head);
  const body = readText(join(root, captured.out));
  assert.ok(body.includes(`HEAD: ${head}`));
  assert.match(body, /fixture baseline/);
  assert.match(body, /\[ready\] t1-2/);
  assert.match(body, /t1-1 in_progress → done.*npm test; tracked\.txt/);
  assert.match(body, /fixture: status=GO/);
  assert.match(body, /~\/\.codex\/sessions/);
  assert.doesNotMatch(body, /TRANSCRIPT_SENTINEL/);
});

it('handoff falls back without git and uses the default output path', async () => {
  const ctx = makeCtx(makeTmp(), { from: 'codex', to: 'gemini' });
  ctx.json = true;
  let captured;
  ctx.log = { data(d) { captured = d; } };
  assert.equal(await cmdHandoff([], ctx), 0);
  assert.match(captured.out, /^docs\/handoff\/handoff-\d{8}-codex-to-gemini\.md$/);
  assert.equal(captured.branch, '(not a git repo)');
  const body = readText(join(ctx.root, captured.out));
  assert.match(body, /HEAD: \(n\/a\)/);
  assert.match(body, /queue empty/);
  await assert.rejects(cmdHandoff([], makeCtx(makeTmp())), /usage/);
});
