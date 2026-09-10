// SPDX-License-Identifier: MIT
/** Status / Evidence / Next step reporting (human markdown + machine JSON). */

import { getQueue, listTodos } from './planning/queue.js';
import { recentTransitions } from './planning/transitions.js';

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {{ track?: string }} [opts]
 */
export function statusData(db, opts = {}) {
  const { track } = opts;
  const done = listTodos(db, { status: 'done', track });
  const inProgress = listTodos(db, { status: 'in_progress', track });
  const blocked = listTodos(db, { status: 'blocked', track });
  const { ready } = getQueue(db, { track, limit: 10 });
  const transitions = recentTransitions(db, { track, limit: 20 });
  const next = inProgress[0] ?? ready[0] ?? null;
  return { track: track ?? null, done, inProgress, blocked, ready, transitions, next };
}

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {{ track?: string }} [opts]
 * @returns {string} markdown report
 */
export function renderStatus(db, opts = {}) {
  const d = statusData(db, opts);
  const lines = [];
  const title = d.track ? `## Status (${d.track})` : '## Status';
  lines.push(title);
  if (!d.done.length && !d.inProgress.length && !d.blocked.length) {
    lines.push('- No completed, active, or blocked work yet.');
  }
  for (const t of d.done.slice(-10)) lines.push(`- [done] ${t.ref} — ${t.title}`);
  if (d.done.length > 10) lines.push(`- … and ${d.done.length - 10} more done`);
  for (const t of d.inProgress) lines.push(`- [in_progress] ${t.ref} — ${t.title}`);
  for (const t of d.blocked) lines.push(`- [blocked] ${t.ref} — ${t.title}`);
  lines.push('', '## Evidence');
  if (!d.transitions.length) {
    lines.push('- No transitions recorded yet.');
  }
  for (const tr of d.transitions) {
    const ev = tr.evidence ? `: ${tr.evidence}` : '';
    lines.push(`- ${tr.ref} ${tr.from_status} → ${tr.to_status} (${tr.actor ?? 'unknown'}, ${tr.at})${ev}`);
  }
  lines.push('', d.blocked.length && !d.inProgress.length && !d.ready.length ? '## Blocked' : '## Next step');
  if (d.next) {
    lines.push(`- ${d.next.ref} — ${d.next.title} [${d.next.status}]`);
    if (d.ready.length > 1) lines.push(`- Queued after: ${d.ready.slice(1, 4).map((t) => t.ref).join(', ')}`);
  } else if (d.blocked.length) {
    const b = d.blocked[0];
    lines.push(`- Unblock ${b.ref} — ${b.title}`);
    if (b.notes) lines.push(`  Reason: ${b.notes.split(' | ').at(-1)}`);
  } else {
    lines.push('- Queue is empty. Charter the next wave (`whw wave new <slug> --adr NNNN`).');
  }
  return `${lines.join('\n')}\n`;
}
