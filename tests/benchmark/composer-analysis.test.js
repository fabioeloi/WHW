// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  advisoryRecord,
  buildAnalystPrompt,
  CHANGE_IDS,
  commandFromHelp,
  discoverComposerCommand,
  extractJsonObject,
  MISSING_CLI,
  parseAnalysis,
  runComposerAnalysis,
  validateAnalysis,
} from '../../benchmarks/shift-left/analyze.js';
import { ASSUMPTION, digestReport } from '../../benchmarks/shift-left/run.js';

const reply = JSON.parse(readFileSync(new URL('../fixtures/composer-analysis/reply.json', import.meta.url), 'utf8'));

function miniReport() {
  const change = (id, extra) => ({
    id,
    expectedClass: 'low',
    letters: ['A', 'B', 'C', 'D', 'E'],
    humanJudgments: 1,
    ceremonyCost: 1,
    reworkPreBuild: 0,
    reworkPostBuild: 0,
    escapedDefects: 0,
    fitnessBlockedBuild: 0,
    ...extra,
  });
  const changes = CHANGE_IDS.map((id) => change(id));
  const profile = (overrides) => ({
    totals: {
      ceremonyCost: 10,
      costExcludingOracle: 12,
      escapedDefects: 1,
      humanJudgments: 5,
      reworkPreBuild: 0,
      reworkPostBuild: 1,
      ...overrides,
    },
    changes,
  });
  return {
    assumption: ASSUMPTION,
    verdict: 'recommend-adopt',
    comprehensionProven: false,
    digest: 'stable-digest',
    delta: { ceremonyCost: -1, costExcludingOracle: -2, escapedDefects: -1 },
    profiles: {
      classic: profile({}),
      'shift-left': profile({ ceremonyCost: 9, costExcludingOracle: 10, escapedDefects: 0 }),
    },
  };
}

describe('composer analysis contract', () => {
  it('puts both profiles, every change, the assumption, and both critical trees in the prompt', () => {
    const prompt = buildAnalystPrompt(miniReport());
    assert.match(prompt, /change `process\.profile`/);
    assert.match(prompt, /not a field measurement/);
    assert.match(prompt, /"classic"/);
    assert.match(prompt, /"shift-left"/);
    for (const id of CHANGE_IDS) assert.match(prompt, new RegExp(id));
    assert.match(prompt, /const label = 'invoice'/);
    assert.match(prompt, /readTable\('payments'\)/);
    assert.match(prompt, /## Dangerous failure/);
    assert.match(prompt, /amountCents/);
    assert.match(prompt, /seen: rows\.rows\.length/);
  });

  it('accepts the recorded reply and rejects incomplete JSON', () => {
    assert.equal(validateAnalysis(reply).recommendation, 'defer');
    const wrapped = `Here is the reading.\n\n\`\`\`json\n${JSON.stringify(reply)}\n\`\`\`\n`;
    assert.equal(parseAnalysis(wrapped).agreesWithOracle, false);
    assert.throws(() => extractJsonObject('no object here'), /not JSON/);
    assert.throws(() => extractJsonObject('{"agreesWithOracle": '), /not JSON/);

    const missing = structuredClone(reply);
    missing.changes = missing.changes.filter((change) => change.id !== 'rename-local');
    assert.throws(() => validateAnalysis(missing), /missing change id: rename-local/);

    const badRecommendation = structuredClone(reply);
    badRecommendation.recommendation = 'ship';
    assert.throws(() => validateAnalysis(badRecommendation), /recommendation must be adopt, reject, or defer/);

    const emptyReason = structuredClone(reply);
    emptyReason.oracleReason = '   ';
    assert.throws(() => validateAnalysis(emptyReason), /oracleReason must be a non-empty string/);

    const extra = structuredClone(reply);
    extra.changes = [...extra.changes, { id: 'other', loadBearing: [], theater: [] }];
    assert.throws(() => validateAnalysis(extra), /unknown change id: other/);
  });

  it('keeps the deterministic report digest when the advisory record is stored beside it', () => {
    const report = miniReport();
    const before = digestReport(report);
    const saved = advisoryRecord(validateAnalysis(reply));
    assert.equal(saved.model, 'composer');
    assert.equal(saved.advisory, true);
    assert.equal(saved.changesDefaultProfile, false);
    assert.equal(digestReport(report), before);
    assert.equal(report.digest, 'stable-digest');
    assert.equal(Object.hasOwn(report, 'advisory'), false);
    assert.equal(report.verdict, 'recommend-adopt');
  });

  it('derives a Composer command only from help that names print and model', async () => {
    const help = `Usage: cursor-agent [options]\n  -p, --print\n  --model <id>\n  --output-format text|json\n`;
    const command = commandFromHelp('/usr/bin/cursor-agent', help);
    assert.match(command, /cursor-agent -p --model composer --output-format text/);
    assert.match(command, /WHW_PROMPT_FILE/);
    assert.throws(() => commandFromHelp('cursor-agent', 'Usage: cursor-agent\n  -p, --print\n'), /set WHW_COMPOSER_RUNNER/);
    assert.throws(() => commandFromHelp('agent', 'Usage: agent\n  -p, --print\n  --model <id>\n'), /generic agent/);

    const fromEnv = await discoverComposerCommand(
      { WHW_COMPOSER_RUNNER: 'cat "$WHW_PROMPT_FILE"', PATH: '' },
      { lookup: () => { throw new Error('lookup should not run'); } },
    );
    assert.equal(fromEnv.command, 'cat "$WHW_PROMPT_FILE"');
    assert.equal(fromEnv.source, 'env');

    const missing = await discoverComposerCommand({ PATH: '' }, { lookup: () => null });
    assert.equal(missing, null);
    assert.match(MISSING_CLI, /No analysis was invented/);
  });

  it('stops without writing an analysis when the Composer CLI is absent', async () => {
    const report = miniReport();
    const code = await runComposerAnalysis({
      report,
      env: { PATH: '' },
    });
    assert.equal(code, 2);
    assert.equal(report.verdict, 'recommend-adopt');
  });

  it('asks Composer when WHW_COMPOSER_LIVE=1', { skip: process.env.WHW_COMPOSER_LIVE !== '1', timeout: 360000 }, async () => {
    const found = await discoverComposerCommand();
    assert.ok(found, 'WHW_COMPOSER_LIVE=1 but no Composer CLI and no WHW_COMPOSER_RUNNER');
    const { runBenchmark } = await import('../../benchmarks/shift-left/run.js');
    const report = await runBenchmark();
    const before = digestReport(report);
    const prompt = buildAnalystPrompt(report);
    const { invokeComposer } = await import('../../benchmarks/shift-left/analyze.js');
    const raw = await invokeComposer({ prompt, command: found.command });
    const analysis = parseAnalysis(raw);
    assert.equal(analysis.changes.map((change) => change.id).sort().join(), [...CHANGE_IDS].sort().join());
    assert.equal(typeof analysis.agreesWithOracle, 'boolean');
    assert.equal(typeof analysis.agreesWithVerdict, 'boolean');
    assert.equal(digestReport(report), before);
  });
});

describe('composer CLI absence message', () => {
  it('names the override and does not invent a file path in the message', () => {
    assert.match(MISSING_CLI, /WHW_COMPOSER_RUNNER/);
    assert.doesNotMatch(MISSING_CLI, /recommend-adopt/);
  });
});
