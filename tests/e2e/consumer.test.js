// SPDX-License-Identifier: MIT
import { it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

it('replays consumer CI and round-trips handoff without changing SQL statuses', () => {
  const root = mkdtempSync(join(tmpdir(), 'whw-consumer-'));
  const bin = fileURLToPath(new URL('../../bin/whw.js', import.meta.url));
  const exec = (command, args) => {
    const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    return result.stdout.trim();
  };
  const run = (...args) => exec(process.execPath, [bin, '--root', root, ...args]);
  const git = (...args) => exec('git', args);
  const rows = () => {
    const db = new DatabaseSync(join(root, '.whw/state.db'), { readOnly: true });
    try { return db.prepare('SELECT ref,status,evidence FROM todos ORDER BY ref').all(); }
    finally { db.close(); }
  };
  try {
    git('init', '-b', 'main');
    git('config', 'user.name', 'Consumer fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    run('init', '--tools', 'codex,claude', '--project', 'Consumer');
    run('adr', 'new', 'consumer');
    run('wave', 'new', 'consumer', '--adr', '0001');
    const template = readFileSync(new URL('../../templates/ci-whw.yml', import.meta.url), 'utf8');
    const commands = [...template.matchAll(/^\s+run: npx -y @fabioeloi\/whw@latest (.+)$/gm)].map(m => m[1]);
    assert.deepEqual(commands, ['sync --all', 'doctor', 'gate run --tier pr']);
    for (const command of commands) run(...command.split(' '));
    run('claim', 'wave001-A');
    run('done', 'wave001-A', '--evidence', 'fixture baseline; CI command replay passed');
    git('add', '.');
    git('commit', '-m', 'fixture baseline');
    const first = git('rev-parse', '--short', 'HEAD');
    const before = rows();
    run('handoff', '--from', 'codex', '--to', 'claude', '--out', 'docs/handoff/forward.md');
    const forward = readFileSync(join(root, 'docs/handoff/forward.md'), 'utf8');
    assert.match(forward, /# Handoff — codex → claude/);
    assert.match(forward, /branch: main/);
    assert.ok(forward.includes(first)); assert.ok(forward.includes('wave001-A'));
    git('add', '.'); git('commit', '-m', 'fixture forward handoff');
    const second = git('rev-parse', '--short', 'HEAD');
    assert.notEqual(first, second);
    run('handoff', '--from', 'claude', '--to', 'codex', '--out', 'docs/handoff/return.md');
    const returned = readFileSync(join(root, 'docs/handoff/return.md'), 'utf8');
    assert.match(returned, /# Handoff — claude → codex/);
    assert.match(returned, /branch: main/);
    assert.ok(returned.includes(second)); assert.ok(returned.includes('wave001-B'));
    const resumed = JSON.parse(run('--json', 'resume'));
    assert.ok(resumed.gates.length); assert.ok(resumed.gates.every(g => g.status === 'GO'));
    assert.equal(resumed.next.ref, 'wave001-B');
    assert.deepEqual(rows(), before);
    const configFile = join(root, 'whw.config.json');
    const config = JSON.parse(readFileSync(configFile, 'utf8'));
    config.gates.tiers.pr.push('consumer-fail');
    config.gates.custom.push({ name: 'consumer-fail', command: 'exit 1' });
    writeFileSync(configFile, JSON.stringify(config));
    for (const json of [true, false]) {
      const args = [bin, '--root', root, ...(json ? ['--json'] : []), 'resume', '--no-sync'];
      const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 30000 });
      assert.equal(result.status, 1, result.stderr);
      if (json) {
        const data = JSON.parse(result.stdout);
        assert.equal(data.synced, false); assert.equal(data.next.ref, 'wave001-B');
        assert.equal(data.gates.find(g => g.name === 'consumer-fail').status, 'NO_GO');
      } else { assert.match(result.stdout, /NO_GO consumer-fail/); assert.match(result.stdout, /wave001-B/); }
      assert.deepEqual(rows(), before);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
