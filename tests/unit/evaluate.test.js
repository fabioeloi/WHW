// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { cmdEvaluate, weightedAverage } from '../../src/evaluate.js';
import { readText, writeText } from '../../src/util.js';
import { makeCtx, makeTmp } from '../helpers.js';

const CRIT = [
  { id: 'technical-quality', weight: 1.3 },
  { id: 'originality', weight: 1.3 },
  { id: 'craft', weight: 1.0 },
  { id: 'functionality', weight: 1.0 },
];

describe('evaluate', () => {
  it('weightedAverage matches the rubric math', () => {
    const { average } = weightedAverage({ 'technical-quality': 4, originality: 4, craft: 3, functionality: 5 }, CRIT);
    assert.equal(average, 4);
    const low = weightedAverage({ 'technical-quality': 2, originality: 2, craft: 2, functionality: 2 }, CRIT);
    assert.equal(low.average, 2);
    assert.throws(() => weightedAverage({ 'technical-quality': 9, originality: 0, craft: 0, functionality: 0 }, CRIT), /0–5/);
  });

  it('phase A runs commands and records the report', async () => {
    const root = makeTmp();
    writeText(join(root, 'whw.config.json'), JSON.stringify({ evaluate: { phaseA: ['echo ok'] } }));
    const ctx = makeCtx(root, { phase: 'a' });
    assert.equal(await cmdEvaluate([], ctx), 0);
    assert.match(readText(join(root, '.whw', 'evaluation-report.json')), /"status": "pass"/);
  });

  it('phase B approves at threshold and rejects with fixes', async () => {
    const root = makeTmp();
    const good = makeCtx(root, { phase: 'b', scores: JSON.stringify({ 'technical-quality': 5, originality: 5, craft: 5, functionality: 5 }) });
    assert.equal(await cmdEvaluate([], good), 0);
    const bad = makeCtx(root, { phase: 'b', scores: JSON.stringify({ scores: { 'technical-quality': 1, originality: 1, craft: 1, functionality: 1 }, fixes: ['a', 'b', 'c'] }) });
    assert.equal(await cmdEvaluate([], bad), 1);
    const noFix = makeCtx(root, { phase: 'b', scores: JSON.stringify({ 'technical-quality': 1, originality: 1, craft: 1, functionality: 1 }) });
    await assert.rejects(cmdEvaluate([], noFix), /requires "fixes"/);
  });
});
