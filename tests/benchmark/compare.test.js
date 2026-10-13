// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { digestReport, runBenchmark, verdictFor } from '../../benchmarks/shift-left/run.js';

describe('shift-left benchmark', () => {
  it('compares classic and shift-left with a stable rubric verdict', { timeout: 120000 }, async () => {
    const first = await runBenchmark();
    const second = await runBenchmark();
    assert.equal(digestReport(first), digestReport(second));
    assert.equal(first.digest, digestReport(first));
    assert.equal(first.verdict, verdictFor(first));
    assert.equal(first.comprehensionProven, false);
    assert.equal(first.notSimulated.modelCalls, null);
    assert.equal(first.notSimulated.tokens, null);

    const classic = first.profiles.classic;
    const shift = first.profiles['shift-left'];
    assert.equal(classic.totals.universalJudgment, true);
    assert.equal(classic.totals.lettersClassic, true);
    assert.equal(classic.totals.fitnessBlockedBuild, 0);
    assert.equal(classic.totals.reworkPreBuild, 0);
    assert.ok(classic.totals.reworkPostBuild >= 1);
    assert.equal(shift.totals.lowHumanJudgments, 0);
    assert.ok(shift.totals.fitnessBlockedBuild > 0);
    assert.equal(shift.totals.reworkPreBuild, shift.totals.fitnessBlockedBuild);
    assert.equal(shift.totals.criticalHumanJudgments, shift.totals.criticalCount);
    assert.equal(shift.totals.criticalWalkthroughs, shift.totals.criticalCount);
    assert.equal(shift.totals.classMismatch, false);

    const classicOracle = classic.changes.find((change) => change.id === 'domain-owns-table');
    const shiftOracle = shift.changes.find((change) => change.id === 'domain-owns-table');
    assert.equal(classicOracle.escapedDefects, 1);
    assert.equal(shiftOracle.escapedDefects, 0);
    assert.equal(shift.changes.filter((change) => change.expectedClass === 'low').every((change) => change.humanJudgments === 0), true);
    assert.equal(classic.changes.every((change) => change.humanJudgments >= 1), true);
  });
});