#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="${HOME}/.local/bin:${PATH}"

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -v '^#' .env.local | grep -v '^$' | sed 's/^/export /')
  set +a
fi

key="${CURSOR_API_KEY:-}"
for name in WHW_CURSOR_API_KEY CURSOR_USER_API_KEY; do
  if [[ -z "$key" && -n "${!name:-}" ]]; then
    export CURSOR_API_KEY="${!name}"
    key="${!name}"
  fi
done

# Drop mistaken cloud-agent OIDC JWTs (see docs/pt-BR/composer-live-auth.md).
if [[ -n "${CURSOR_AUTH_TOKEN:-}" ]]; then
  if node -e "
const t=process.env.CURSOR_AUTH_TOKEN||'';
const p=t.split('.')[1];
if(!p) process.exit(1);
try{const j=JSON.parse(Buffer.from(p,'base64url')); process.exit(j.cloud_agent_id?0:1);}catch{process.exit(1)}
" 2>/dev/null; then
    unset CURSOR_AUTH_TOKEN
  fi
fi

if [[ -n "${CURSOR_AGENT_SOCKET:-}" && -S "${CURSOR_AGENT_SOCKET}" ]]; then
  env_id="$(curl -sS --unix-socket "$CURSOR_AGENT_SOCKET" http://localhost/v1/meta-data/workspace/environment-id 2>/dev/null || true)"
  if [[ -n "$env_id" ]]; then
    echo "composer live: cloud environment-id=$env_id" >&2
  fi
fi

if ! node --input-type=module -e "
import { probeComposerAgentAuth, describeComposerAuthGap } from './benchmarks/shift-left/composer-auth.js';
const ok = await probeComposerAgentAuth(process.env);
if (!ok) {
  const gap = await describeComposerAuthGap(process.env);
  if (gap) console.error(gap);
}
process.exit(ok ? 0 : 2);
"; then
  echo "composer live: cursor-agent auth not ready for composer-2.5" >&2
  exit 2
fi

exec env WHW_COMPOSER_LIVE=1 node --env-file-if-exists=.env.local --test tests/benchmark/composer-analysis.test.js
