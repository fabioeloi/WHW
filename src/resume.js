// SPDX-License-Identifier: MIT
/**
 * `whw resume` — revalidate after interruption: git baseline, optional sync,
 * queue, next action. Does not claim. SQL remains the source of truth.
 */

import { closeDb, openDb } from './db/sqlite.js';
import { getQueue } from './planning/queue.js';
import { syncAll } from './planning/seed.js';
import { statusData } from './report.js';
import { git, isGitRepo } from './util.js';

/**
 * @param {any} ctx
 */
export async function collectResume(ctx) {
  /** @type {{ branch: string|null, head: string|null, status: string, log: string, repo: boolean }} */
  const gitInfo = { branch: null, head: null, status: '(not a git repo)', log: '', repo: false };
  if (await isGitRepo(ctx.root)) {
    gitInfo.repo = true;
    gitInfo.branch = (await git(['branch', '--show-current'], ctx.root)) || '(detached)';
    gitInfo.head = (await git(['rev-parse', '--short', 'HEAD'], ctx.root)) || '(no commits)';
    gitInfo.status = (await git(['status', '--short', '--branch'], ctx.root)) || 'clean';
    gitInfo.log = await git(['log', '--oneline', '-n', '10'], ctx.root);
  }

  let synced = false;
  if (!ctx.flags['no-sync']) {
    const db = openDb(ctx.paths.state);
    try {
      syncAll(db, ctx.paths.planning, ctx.flags.track ? { track: ctx.flags.track } : {});
      synced = true;
    } finally {
      closeDb(db);
    }
  }

  const db = openDb(ctx.paths.state);
  try {
    const q = getQueue(db, { track: ctx.flags.track, limit: 8 });
    const d = statusData(db, { track: ctx.flags.track });
    return { git: gitInfo, synced, queue: q, next: d.next, blocked: d.blocked };
  } finally {
    closeDb(db);
  }
}

/** @param {string[]} positionals @param {any} ctx @returns {Promise<number>} */
export async function cmdResume(positionals, ctx) {
  const data = await collectResume(ctx);
  if (ctx.json) {
    ctx.log.data(data);
    return 0;
  }
  const g = data.git;
  ctx.log.info('## Resume');
  ctx.log.info(`- branch: ${g.branch ?? '(none)'} @ ${g.head ?? '(n/a)'}`);
  if (g.repo) {
    ctx.log.info('- git status:');
    for (const line of (g.status || '').split('\n').slice(0, 16)) ctx.log.info(`  ${line}`);
    if (g.log) {
      ctx.log.info('- recent log:');
      for (const line of g.log.split('\n').slice(0, 10)) ctx.log.info(`  ${line}`);
    }
  } else {
    ctx.log.info('- git: not a repo');
  }
  if (data.synced) ctx.log.info('- synced planning seeds → state.db');
  else ctx.log.info('- sync skipped (--no-sync)');
  ctx.log.info('');
  ctx.log.info('## Queue');
  const lines = [
    ...data.queue.inProgress.map((t) => `- [in_progress] ${t.ref} — ${t.title}`),
    ...data.queue.ready.map((t) => `- [ready] ${t.ref} — ${t.title}`),
  ];
  if (!lines.length) ctx.log.info('- (empty)');
  else for (const l of lines) ctx.log.info(l);
  ctx.log.info('');
  ctx.log.info('## Next step');
  if (data.next) ctx.log.info(`- ${data.next.ref} — ${data.next.title} [${data.next.status}]`);
  else if (data.blocked.length) ctx.log.info(`- Unblock ${data.blocked[0].ref}`);
  else ctx.log.info('- Queue is empty. Charter the next wave (`whw wave new <slug> --adr NNNN`).');
  ctx.log.info('- `whw resume` does not claim; `whw claim <ref>` when you start work.');
  return 0;
}
