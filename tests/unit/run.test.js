// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { closeDb, openDb } from '../../src/db/sqlite.js';
import { applySeedFile } from '../../src/planning/seed.js';
import { cmdRun, composePrompt, resolveTiers } from '../../src/run.js';
import { fileExists, readText, writeText } from '../../src/util.js';
import { makeCtx, makeTmp, writeSeed } from '../helpers.js';

function runRoot() {
  const root = makeTmp();
  writeText(join(root, 'roles', 'planner.md'), '# Planner\nDo the plan with evidence.\n');
  writeText(join(root, 'AGENTS.md'), '# AGENTS\nOne claim at a time.\n');
  return root;
}

describe('composePrompt / resolveTiers', () => {
  it('embeds role, AGENTS.md, and assigned todo', (t) => {
    const root = runRoot();
    const seed = writeSeed(root);
    const db = openDb(join(root, '.whw', 'state.db'));
    t.after(() => closeDb(db));
    applySeedFile(db, seed);
    const ctx = makeCtx(root);
    const prompt = composePrompt(ctx, { role: 'planner', ref: 't1-1', task: 'ship it', attempt: 2, tier: 'local' });
    assert.match(prompt, /role: planner/);
    assert.match(prompt, /Do the plan with evidence/);
    assert.match(prompt, /One claim at a time/);
    assert.match(prompt, /t1-1/);
    assert.match(prompt, /ship it/);
    assert.match(prompt, /attempt: 2/);
    assert.match(prompt, /tier: local/);
  });

  it('lists the queue when no ref is given', () => {
    const root = runRoot();
    applySeedFile(openDb(join(root, '.whw', 'state.db')), writeSeed(root));
    const prompt = composePrompt(makeCtx(root), { role: 'planner' });
    assert.match(prompt, /\[ready\] t1-1/);
  });

  it('resolveTiers: flag, default, configured ladder with cost fields, empty', () => {
    const ctx = makeCtx(makeTmp());
    assert.deepEqual(resolveTiers(ctx, 'exit 0'), [{ name: 'flag', runner: 'exit 0', maxFailures: 1 }]);
    assert.deepEqual(resolveTiers(ctx), []);
    ctx.config.runners = { default: 'echo hi' };
    assert.equal(resolveTiers(ctx)[0].name, 'default');
    ctx.config.escalation = {
      maxFailuresDefault: 2,
      tiers: [
        { name: 'local', runner: 'exit 1', maxFailures: 1, costClass: 'open-weight', model: 'llama3.1' },
        { name: 'hosted', runner: 'exit 0', costClass: 'closed', model: 'claude' },
        { name: 'human', human: true },
      ],
    };
    const tiers = resolveTiers(ctx);
    assert.equal(tiers.length, 3);
    assert.equal(tiers[0].costClass, 'open-weight');
    assert.equal(tiers[0].model, 'llama3.1');
    assert.equal(tiers[2].human, true);
    assert.equal(tiers[2].costClass, 'human');
  });
});

describe('cmdRun', () => {
  it('dry-run prints the composed prompt without invoking a runner', async () => {
    const root = runRoot();
    /** @type {any} */
    let captured;
    const ctx = makeCtx(root, { 'dry-run': true, task: 'draft the plan' });
    ctx.json = true;
    ctx.log = { info() {}, warn() {}, error() {}, data(d) { captured = d; } };
    assert.equal(await cmdRun(['planner'], ctx), 0);
    assert.match(captured.prompt, /draft the plan/);
    assert.equal(captured.role, 'planner');
  });

  it('invokes a stub closed CLI (--runner) and writes a run log', async () => {
    const root = runRoot();
    const ctx = makeCtx(root, { runner: 'exit 0' });
    assert.equal(await cmdRun(['planner'], ctx), 0);
    const runs = join(root, '.whw', 'runs');
    assert.ok(fileExists(runs));
  });

  it('escalates from a failing open-weight stub to a succeeding closed stub', async () => {
    const root = runRoot();
    writeText(join(root, 'whw.config.json'), JSON.stringify({
      escalation: {
        tiers: [
          { name: 'local', runner: 'exit 7', maxFailures: 1, costClass: 'open-weight', model: 'stub-local' },
          { name: 'hosted', runner: 'exit 0', maxFailures: 1, costClass: 'closed', model: 'stub-api' },
        ],
      },
    }));
    /** @type {any} */
    let captured;
    const ctx = makeCtx(root);
    ctx.json = true;
    ctx.log = { info() {}, warn() {}, error() {}, data(d) { captured = d; } };
    assert.equal(await cmdRun(['planner'], ctx), 0);
    assert.equal(captured.status, 'complete');
    assert.equal(captured.tier, 'hosted');
    assert.equal(captured.attempts, 2);
    assert.equal(captured.costClass, 'closed');
    assert.equal(captured.model, 'stub-api');
    assert.ok(captured.durationMs >= 0);
    const logName = readdirSync(join(root, '.whw', 'runs')).find((f) => f.endsWith('.log'));
    assert.ok(logName);
    const log = readText(join(root, '.whw', 'runs', logName));
    assert.match(log, /costClass:/);
  });

  it('stops at the human tier with exit 3', async () => {
    const root = runRoot();
    writeText(join(root, 'whw.config.json'), JSON.stringify({
      escalation: {
        tiers: [
          { name: 'local', runner: 'exit 1', maxFailures: 1, costClass: 'open-weight' },
          { name: 'human', human: true },
        ],
      },
    }));
    /** @type {any} */
    let captured;
    const ctx = makeCtx(root);
    ctx.json = true;
    ctx.log = { info() {}, warn() {}, error() {}, data(d) { captured = d; } };
    assert.equal(await cmdRun(['planner'], ctx), 3);
    assert.equal(captured.human, true);
    assert.equal(captured.tier, 'human');
  });
});
