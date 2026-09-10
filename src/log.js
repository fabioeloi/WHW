// SPDX-License-Identifier: MIT
/** Logging with secret redaction (defense in depth — never log real secrets). */

const SENSITIVE_KEY = /token|secret|password|private[_-]?key|authorization|api[_-]?key/i;

/**
 * Deep-redact an arbitrary value: object keys matching the sensitive pattern
 * become "[REDACTED]", and every known secret value is scrubbed from strings.
 * @param {any} value
 * @param {string[]} [extraSecrets]
 * @returns {any}
 */
export function redact(value, extraSecrets = []) {
  const secrets = extraSecrets.filter((s) => typeof s === 'string' && s.length >= 4);
  const scrubString = (s) => {
    let out = s;
    for (const secret of secrets) out = out.split(secret).join('[REDACTED]');
    return out;
  };
  const walk = (v) => {
    if (typeof v === 'string') return scrubString(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out = {};
      for (const [k, val] of Object.entries(v)) {
        out[k] = SENSITIVE_KEY.test(k) ? '[REDACTED]' : walk(val);
      }
      return out;
    }
    return v;
  };
  return walk(value);
}

/**
 * @param {{ json?: boolean, quiet?: boolean }} [opts]
 */
export function createLogger(opts = {}) {
  const { json = false, quiet = false } = opts;
  return {
    /** @param {string} msg */
    info(msg) {
      if (!quiet) process.stdout.write(json ? `${JSON.stringify({ level: 'info', msg })}\n` : `${msg}\n`);
    },
    /** @param {string} msg */
    warn(msg) {
      if (!quiet) process.stderr.write(json ? `${JSON.stringify({ level: 'warn', msg })}\n` : `warning: ${msg}\n`);
    },
    /** @param {string} msg */
    error(msg) {
      process.stderr.write(json ? `${JSON.stringify({ level: 'error', msg })}\n` : `error: ${msg}\n`);
    },
    /** @param {any} data */
    data(data) {
      process.stdout.write(`${JSON.stringify(redact(data), null, 2)}\n`);
    },
  };
}
