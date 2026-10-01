// SPDX-License-Identifier: MIT
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const RECOVERY_SHA = '92f6d70a21dac2c259133bc6b76f20e0376c210e';
export function validateTarget({ event, ref, sha, name, version }) {
  if (!/^refs\/tags\/v\d+\.\d+\.\d+$/.test(ref)) throw new Error('Stable release tag required');
  if (event !== 'push' && event !== 'workflow_dispatch') throw new Error('Unsupported release event');
  if (event === 'workflow_dispatch' && (ref !== 'refs/tags/v0.2.0' || sha !== RECOVERY_SHA)) {
    throw new Error('Recovery must use immutable v0.2.0 SHA');
  }
  if (name !== '@fabioeloi/whw' || ref !== `refs/tags/v${version}`) {
    throw new Error('Package identity/version differs from tag');
  }
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Full commit SHA required');
  return { sha, tag: ref.slice('refs/tags/'.length) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = process.env.GITHUB_EVENT_NAME;
  const ref = event === 'workflow_dispatch' ? 'refs/tags/v0.2.0' : process.env.GITHUB_REF;
  // Validate before passing a ref to git. No arbitrary dispatch input is accepted.
  if (!/^refs\/tags\/v\d+\.\d+\.\d+$/.test(ref ?? '')) throw new Error('Invalid release ref');
  const sha = execFileSync('git', ['rev-parse', `${ref}^{commit}`], { encoding: 'utf8' }).trim();
  const pkg = JSON.parse(execFileSync('git', ['show', `${sha}:package.json`], { encoding: 'utf8' }));
  const target = validateTarget({ event, ref, sha, name: pkg.name, version: pkg.version });
  if (event === 'push' && sha !== process.env.GITHUB_SHA) throw new Error('Event SHA differs from tag');
  appendFileSync(process.env.GITHUB_OUTPUT, `sha=${target.sha}\ntag=${target.tag}\n`);
}
