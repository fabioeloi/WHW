// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { main } from '../../src/cli.js';
import { DESIGN_HEADINGS, LEARNING_LABELS, WALKTHROUGH_HEADINGS } from '../../src/shift-left.js';
import { fileExists, readJson, writeText } from '../../src/util.js';
import { makeTmp } from '../helpers.js';

/**
 * @param {'classic'|'shift-left'} profile
 * @param {{ id: string, command: string }[]} fitness
 */
async function boot(profile, fitness) {
  const root = makeTmp(`whw-e2e-${profile}-`);
  const run = (args) => main(args, { cwd: root, quiet: true });
  assert.equal(await run(['init', '--project', 'Shift', '--tools', 'cursor']), 0);
  const config = readJson(join(root, 'whw.config.json'));
  config.process = { profile };
  config.fitness = fitness;
  writeText(join(root, 'whw.config.json'), `${JSON.stringify(config, null, 2)}\n`);
  return { root, run };
}

/** @param {string} root @param {string} nnn @param {string[]} headings */
function writeHeadings(root, dir, nnn, headings) {
  writeText(join(root, 'docs', dir, `wave-${nnn}.md`), `# ${dir}\n\n${headings.map((heading) => `${heading}\n\nnoted.\n`).join('\n')}`);
}

describe('shift-left e2e', () => {
  it('closes a low-risk wave without human judgment', async () => {
    const { root, run } = await boot('shift-left', []);
    assert.equal(await run(['adr', 'new', 'note', '--title', 'Note']), 0);
    assert.equal(await run(['wave', 'new', 'note', '--adr', '0001', '--signals', 'docs']), 0);
    assert.equal(await run(['sync', '--all']), 0);
    for (const letter of ['A', 'B', 'C']) {
      assert.equal(await run(['claim', `wave001-${letter}`]), 0);
      assert.equal(await run(['done', `wave001-${letter}`, '--evidence', `bench ${letter}`]), 0);
    }
    const adr = join(root, 'docs', 'adr', '0001-note.md');
    const original = readFileSync(adr, 'utf8');
    writeText(adr, `${original}\n## Addendum Wave 001 — note\n\nShipped.\n\n## Learning Wave 001\n\n- Discovered: docs only.\n- Failed assumption: none.\n- Rule to adjust: keep low risk on the short chain.\n`);
    writeText(join(root, 'docs', 'plan.md'), `${readFileSync(join(root, 'docs', 'plan.md'), 'utf8')}\n## Wave 001 — note\n\nDone.\n`);
    assert.equal(await run(['close', '001']), 0);
    assert.equal(fileExists(join(root, 'docs', 'judgment', 'wave-001.md')), false);
    for (const label of LEARNING_LABELS) assert.match(readFileSync(adr, 'utf8'), new RegExp(label));
  });

  it('refuses critical Build without D0 and close without walkthrough and learning', async () => {
    const failing = [{ id: 'block', command: 'node -e "process.exit(1)"' }];
    const { root, run } = await boot('shift-left', failing);
    assert.equal(await run(['adr', 'new', 'boundary', '--title', 'Boundary']), 0);
    assert.equal(await run(['wave', 'new', 'boundary', '--adr', '0001', '--signals', 'architecture,security-boundary']), 0);
    assert.equal(await run(['sync', '--all']), 0);
    assert.equal(await run(['claim', 'wave001-A']), 0);
    assert.equal(await run(['done', 'wave001-A', '--evidence', 'plan']), 0);
    await assert.rejects(run(['claim', 'wave001-B']), /waiting on wave001-D0/);

    assert.equal(await run(['claim', 'wave001-D0']), 0);
    await assert.rejects(run(['done', 'wave001-D0', '--evidence', 'design']), /Hypothesis/);
    writeHeadings(root, 'design', '001', DESIGN_HEADINGS);
    assert.equal(await run(['done', 'wave001-D0', '--evidence', 'design']), 0);
    await assert.rejects(run(['claim', 'wave001-B']), /fitness NO_GO/);

    const config = readJson(join(root, 'whw.config.json'));
    config.fitness = [{ id: 'block', command: 'node -e "process.exit(0)"' }];
    writeText(join(root, 'whw.config.json'), `${JSON.stringify(config, null, 2)}\n`);
    for (const letter of ['B', 'C', 'D']) {
      if (letter === 'D') {
        assert.equal(await run(['judge', '001', '--decision', 'approve', '--note', 'boundary stays']), 0);
      }
      assert.equal(await run(['claim', `wave001-${letter}`]), 0);
      assert.equal(await run(['done', `wave001-${letter}`, '--evidence', `bench ${letter}`]), 0);
    }
    await assert.rejects(run(['close', '001']), /not terminal: wave001-W/);

    assert.equal(await run(['claim', 'wave001-W']), 0);
    await assert.rejects(run(['done', 'wave001-W', '--evidence', 'walk']), /Problem/);
    writeHeadings(root, 'walkthrough', '001', WALKTHROUGH_HEADINGS);
    assert.equal(await run(['done', 'wave001-W', '--evidence', 'walk']), 0);

    const adr = join(root, 'docs', 'adr', '0001-boundary.md');
    writeText(adr, `${readFileSync(adr, 'utf8')}\n## Addendum Wave 001 — boundary\n\nShipped.\n`);
    writeText(join(root, 'docs', 'plan.md'), `${readFileSync(join(root, 'docs', 'plan.md'), 'utf8')}\n## Wave 001 — boundary\n\nDone.\n`);
    await assert.rejects(run(['close', '001']), /Learning Wave 001/);
    writeText(adr, `${readFileSync(adr, 'utf8')}\n## Learning Wave 001\n\n- Discovered: the boundary was the risk.\n- Failed assumption: a late review would undo the import.\n- Rule to adjust: design before Build on critical waves.\n`);
    assert.equal(await run(['close', '001']), 0);
  });
});
