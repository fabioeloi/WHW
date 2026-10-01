// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cmdDoctor } from '../../src/doctor.js';
import { makeCtx, makeTmp, writeSeed } from '../helpers.js';

describe('doctor', () => {
  it('warns when planning seeds exist and state has 0 todos', async () => {
    const root = makeTmp();
    writeSeed(root);
    /** @type {any} */
    let captured;
    const ctx = makeCtx(root);
    ctx.json = true;
    ctx.log = { info() {}, warn() {}, error() {}, data(d) { captured = d; } };
    const code = await cmdDoctor([], ctx);
    assert.equal(code, 0);
    const state = captured.checks.find((c) => c.check === 'state');
    assert.equal(state.status, 'warn');
    assert.match(state.detail, /0 todos/);
    assert.match(state.detail, /whw sync --all/);
  });
});

it('discovers executable files in PATH order without executing them', async () => {
  const { chmodSync, mkdirSync } = await import('node:fs');
  const { join, delimiter } = await import('node:path');
  const { writeText } = await import('../../src/util.js');
  const { discoverRunners } = await import('../../src/doctor.js');
  const root = makeTmp();
  const first = join(root, 'first');
  const second = join(root, 'second');
  writeText(join(first, 'codex'), 'exit 99');
  chmodSync(join(first, 'codex'), 0o644);
  writeText(join(second, 'codex'), 'exit 99');
  chmodSync(join(second, 'codex'), 0o755);
  mkdirSync(join(first, 'claude'));
  const found = discoverRunners([first, second].join(delimiter), root);
  assert.equal(found.find((r) => r.name === 'codex').path, join(second, 'codex'));
  assert.equal(found.find((r) => r.name === 'claude').path, null);
  assert.equal(found.find((r) => r.name === 'gemini').path, null);
  assert.ok(discoverRunners('', root).every((r) => r.path === null));
});

it('missing runners do not fail doctor or execute configured commands', async () => {
  const original = process.env.PATH;
  const root = makeTmp();
  const ctx = makeCtx(root);
  ctx.config.runners.default = 'touch SHOULD_NOT_EXIST';
  ctx.json = true;
  let captured;
  ctx.log = { info() {}, data(d) { captured = d; } };
  try {
    process.env.PATH = root;
    assert.equal(await cmdDoctor([], ctx), 0);
  } finally {
    process.env.PATH = original;
  }
  assert.ok(captured.checks.filter((c) => c.check.startsWith('runner:')).every((c) => c.status === 'warn'));
  assert.match(captured.checks.find((c) => c.check === 'configured-runners').detail, /SHOULD_NOT_EXIST/);
  const { existsSync } = await import('node:fs');
  assert.equal(existsSync(`${root}/SHOULD_NOT_EXIST`), false);
});
