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

if [[ -z "$key" && -z "${CURSOR_AUTH_TOKEN:-}" ]]; then
  status="$(agent status 2>&1 || true)"
  if [[ "$status" == *'Not logged in'* ]] || [[ "$status" == *'not logged in'* ]]; then
    echo "composer live: need CURSOR_API_KEY (Runtime Secret or .env.local) or agent login" >&2
    echo "See docs/pt-BR/composer-live-auth.md" >&2
    exit 2
  fi
  if [[ "$status" != *'Logged in'* ]] && [[ "$status" != *'Login successful'* ]]; then
    echo "composer live: could not confirm agent login ($(printf '%s' "$status" | head -1))" >&2
    exit 2
  fi
fi

exec env WHW_COMPOSER_LIVE=1 node --env-file-if-exists=.env.local --test tests/benchmark/composer-analysis.test.js
