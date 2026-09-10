// SPDX-License-Identifier: MIT
/**
 * Gate: local package hygiene for a tag. Does not publish npm or create
 * GitHub Releases — those stay operator-confirmed (ADR 0010).
 */

import { join } from 'node:path';
import { fileExists, readJson, readText } from '../../util.js';

export const name = 'release-readiness';
export const description = 'Package metadata, LICENSE, README, and CHANGELOG agree on a version (does not publish).';

const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

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
  }

  const bin = pkg.bin && typeof pkg.bin === 'object' ? pkg.bin : null;
  if (bin) {
    for (const [cli, rel] of Object.entries(bin)) {
      if (typeof rel !== 'string' || !rel.trim()) {
        failures.push(`package.json bin.${cli} is empty`);
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
