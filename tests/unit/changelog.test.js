// SPDX-License-Identifier: MIT
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import {
  extractChangelogSection,
  parseChangelogNotesArgv,
  unreleasedHasEntries,
  writeReleaseNotesFile,
} from '../../src/changelog.js';
import { readText, writeText } from '../../src/util.js';
import { makeTmp } from '../helpers.js';

const SAMPLE = `# Changelog

## [Unreleased]

### Added

- pending work

## [1.2.3] - 2026-09-10

### Added

- shipped

## [1.0.0] - 2026-01-01

- first
`;

describe('changelog notes', () => {
  it('extracts a version section and detects Unreleased bullets', () => {
    const section = extractChangelogSection(SAMPLE, '1.2.3');
    assert.match(section, /^## \[1\.2\.3\]/);
    assert.match(section, /shipped/);
    assert.doesNotMatch(section, /pending work/);
    assert.doesNotMatch(section, /1\.0\.0/);
    assert.equal(unreleasedHasEntries(SAMPLE), true);
    assert.equal(unreleasedHasEntries('## [Unreleased]\n\n## [1.0.0]\n'), false);
    assert.equal(extractChangelogSection(SAMPLE, '9.9.9'), null);
  });

  it('writes notes to a file and parses argv', () => {
    const root = makeTmp();
    const src = join(root, 'CHANGELOG.md');
    const out = join(root, 'notes.md');
    writeText(src, SAMPLE);
    writeReleaseNotesFile(src, '1.2.3', out);
    assert.match(readText(out), /## \[1\.2\.3\]/);
    assert.deepEqual(parseChangelogNotesArgv(['--version', 'v1.2.3', '--out', '/tmp/n.md']), {
      version: '1.2.3',
      out: '/tmp/n.md',
      file: 'CHANGELOG.md',
    });
  });
});
