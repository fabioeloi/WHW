#!/usr/bin/env -S node --disable-warning=ExperimentalWarning
// SPDX-License-Identifier: MIT
// WHW CLI entry point. Requires Node.js >= 22.13 (built-in node:sqlite).

// Silence the node:sqlite ExperimentalWarning. The shebang flag covers direct
// execution; this override covers `node ./bin/whw.js`. It must install before
// the (dynamic) import below — static imports would hoist past it.
const __emitWarning = process.emitWarning.bind(process);
process.emitWarning = (warning, ...args) => {
  const text = typeof warning === 'string' ? warning : (warning?.message ?? warning?.code ?? '');
  if (String(text).includes('SQLite') || String(text).includes('sqlite')) return undefined;
  return __emitWarning(warning, ...args);
};

const { main } = await import('../src/cli.js');

main(process.argv.slice(2)).then(
  (code) => process.exit(code ?? 0),
  (err) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`whw: error: ${msg}\n`);
    process.exit(1);
  },
);
