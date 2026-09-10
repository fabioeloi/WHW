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
