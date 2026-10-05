// SPDX-License-Identifier: MIT
/** Domain modules must not import infrastructure. */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dir = join(root, 'src', 'domain');
const failures = [];
for (const name of readdirSync(dir).filter((file) => file.endsWith('.js')).sort()) {
  const text = readFileSync(join(dir, name), 'utf8');
  if (/\bfrom\s+['"][^'"]*infra[^'"]*['"]/.test(text)) {
    failures.push(`${name} imports infra`);
  }
}
if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exit(1);
}
