// SPDX-License-Identifier: MIT
/**
 * Gate: local package hygiene for a tag. Does not publish npm or create
 * GitHub Releases — those stay operator-confirmed (ADR 0010).
 */

import { join } from 'node:path';
import { unreleasedHasEntries } from '../../changelog.js';
import { fileExists, git, isGitRepo, readJson, readText } from '../../util.js';

export const name = 'release-readiness';
export const description = 'Package metadata, LICENSE, README, CHANGELOG, bin, and repository.url agree (does not publish).';

const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const GIT_PLUS = /^git\+(https|ssh):\/\//;

/**
 * @param {string} root
 * @param {string} version
 */
export async function headIsTaggedVersion(root, version) {
  if (!(await isGitRepo(root))) return false;
  const tags = await git(['tag', '--points-at', 'HEAD'], root);
  const want = `v${version}`;
  return tags.split('\n').map((t) => t.trim()).includes(want);
}

/**
 * @param {any} ctx
 */
export async function run(ctx) {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const details = [];
  const pkgPath = join(ctx.root, 'package.json');
  if (!fileExists(pkgPath)) {
    return { status: 'GO', failures, details: ['no package.json — skip (not a packaged project)'] };
  }
  let pkg;
  try {
    pkg = readJson(pkgPath);
  } catch (err) {
    failures.push(`package.json is not valid JSON: ${err instanceof Error ? err.message : err}`);
    return { status: 'NO_GO', failures, details };
  }
  if (typeof pkg.name !== 'string' || !pkg.name.trim()) failures.push('package.json missing name');
  else details.push(`name ${pkg.name}`);
  const version = typeof pkg.version === 'string' ? pkg.version.trim() : '';
  if (!version) failures.push('package.json missing version');
  else if (!SEMVER.test(version)) failures.push(`package.json version ${JSON.stringify(version)} is not semver (major.minor.patch)`);
  else details.push(`version ${version}`);
  if (typeof pkg.license !== 'string' || !pkg.license.trim()) failures.push('package.json missing license');
  else details.push(`license ${pkg.license}`);

  const licenseFile = join(ctx.root, 'LICENSE');
  if (!fileExists(licenseFile)) failures.push('LICENSE file missing at repo root');
  else details.push('LICENSE present');

  const readme = join(ctx.root, 'README.md');
  if (!fileExists(readme)) failures.push('README.md missing at repo root');
  else details.push('README.md present');

  const changelog = join(ctx.root, 'CHANGELOG.md');
  if (!fileExists(changelog)) {
    failures.push('CHANGELOG.md missing at repo root');
  } else if (version && SEMVER.test(version)) {
    const text = readText(changelog);
    const heading = new RegExp(`^## \\[${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'm');
    if (!heading.test(text)) failures.push(`CHANGELOG.md has no \`## [${version}]\` heading`);
    else details.push(`CHANGELOG.md has ## [${version}]`);
    if (await headIsTaggedVersion(ctx.root, version)) {
      if (unreleasedHasEntries(text)) {
        failures.push(`CHANGELOG.md [Unreleased] must be empty when HEAD is tagged v${version}`);
      } else {
        details.push(`[Unreleased] empty at tag v${version}`);
      }
    }
  }

  const repo = pkg.repository;
  const repoUrl = typeof repo === 'string' ? repo : (repo && typeof repo === 'object' ? repo.url : '');
  if (typeof repoUrl === 'string' && repoUrl.trim()) {
    if (!GIT_PLUS.test(repoUrl.trim())) {
      failures.push(`package.json repository.url must use git+https:// or git+ssh:// form (got ${JSON.stringify(repoUrl)})`);
    } else {
      details.push(`repository.url ${repoUrl.trim()}`);
    }
  }

  const bin = pkg.bin && typeof pkg.bin === 'object' ? pkg.bin : null;
  if (bin) {
    for (const [cli, rel] of Object.entries(bin)) {
      if (typeof rel !== 'string' || !rel.trim()) {
        failures.push(`package.json bin.${cli} is empty`);
        continue;
      }
      if (rel.startsWith('./') || rel.startsWith('.\\')) {
        failures.push(`package.json bin.${cli} must not start with ./ (npm strips it; use ${rel.replace(/^\.[/\\]/, '')})`);
        continue;
      }
      const abs = join(ctx.root, rel);
      if (!fileExists(abs)) failures.push(`package.json bin.${cli} missing file: ${rel}`);
      else details.push(`bin ${cli} → ${rel}`);
    }
  }

  details.push('npm publish / git tag are operator steps (not this gate)');
  return { status: failures.length ? 'NO_GO' : 'GO', failures, details };
}
