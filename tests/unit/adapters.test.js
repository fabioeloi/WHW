// SPDX-License-Identifier: MIT
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { ADAPTERS, expectedAdapterFiles, parseTools, syncAdapters } from '../../src/adapters.js';
import { fileExists, readJson, readText, writeText } from '../../src/util.js';
import { makeCtx, makeTmp } from '../helpers.js';

it('writes canonical pointers and an accurate manifest while merging Gemini settings', () => {
  const root = makeTmp();
  const ctx = makeCtx(root);
  writeText(join(root, '.gemini/settings.json'), JSON.stringify({ theme: 'dark', context: { other: true, fileName: 'old.md' } }));
  const tools = parseTools('claude,gemini,copilot,cursor,windsurf,claude');
  const result = syncAdapters(ctx, tools, false);
  assert.deepEqual(readJson(join(root, '.gemini/settings.json')), { theme: 'dark', context: { other: true, fileName: 'AGENTS.md' } });
  const files = tools.flatMap((t) => ADAPTERS[t].files);
  assert.deepEqual(readJson(join(root, '.whw/adapters.json')).files, files);
  assert.deepEqual(expectedAdapterFiles(ctx), files.filter((f) => !f.endsWith('settings.json')));
  for (const file of expectedAdapterFiles(ctx)) assert.match(readText(join(root, file)), /AGENTS\.md/);
  assert.ok(result.overwritten.includes('.gemini/settings.json'));
  writeText(join(root, 'CLAUDE.md'), 'custom');
  assert.ok(syncAdapters(ctx, tools, false).kept.includes('CLAUDE.md'));
  assert.equal(readText(join(root, 'CLAUDE.md')), 'custom\n');
  syncAdapters(ctx, tools, true);
  assert.match(readText(join(root, 'CLAUDE.md')), /AGENTS\.md/);
  assert.throws(() => parseTools('unknown'), /unknown tool/);
});

it('native adapters have no pointer files or parity requirements', () => {
  const ctx = makeCtx(makeTmp());
  const tools = parseTools('codex,opencode,aider');
  assert.deepEqual(syncAdapters(ctx, tools, false).native, tools);
  assert.deepEqual(expectedAdapterFiles(ctx), []);
  assert.deepEqual(readJson(join(ctx.root, '.whw/adapters.json')).files, []);
  assert.equal(fileExists(join(ctx.root, 'CLAUDE.md')), false);
});
