// SPDX-License-Identifier: MIT
/**
 * Config hooks: optional shell commands after claim/done/gate-fail/close.
 * Post-event only — a failing hook is logged, never rolls back the action.
 * Only run hooks from repositories you trust (same bar as custom gates).
 */

import { runShell } from './util.js';

export const HOOK_NAMES = ['on_claim', 'on_done', 'on_gate_fail', 'on_close'];

/**
 * @param {any} ctx
 * @param {string} name
 * @param {Record<string, string>} [extraEnv]
 * @returns {Promise<{ name: string, ran: boolean, code?: number, command?: string }>}
 */
export async function runHook(ctx, name, extraEnv = {}) {
  const command = ctx.config?.hooks?.[name];
  if (typeof command !== 'string' || !command.trim()) {
    return { name, ran: false };
  }
  const res = await runShell(command, {
    cwd: ctx.root,
    timeoutMs: 30000,
    env: {
      ...process.env,
      WHW_HOOK: name,
      WHW_ROOT: ctx.root,
      ...extraEnv,
    },
  });
  if (res.code !== 0) {
    const tail = `${res.stdout}\n${res.stderr}`.trim().split('\n').pop() ?? '';
    ctx.log.warn(`hook ${name} exit ${res.code}${tail ? `: ${tail}` : ''}`);
  } else if (!ctx.json) {
    ctx.log.info(`hook ${name} ok`);
  }
  return { name, ran: true, code: Number(res.code ?? 0), command };
}
