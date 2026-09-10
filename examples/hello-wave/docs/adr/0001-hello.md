# ADR 0001 — Hello: greeter plus tests

- **Status:** Proposed
- **Date:** 2026-09-10
- **Wave:** 001
- **Related:** WHY.md

## Context

The example needs the smallest possible product that still exercises build,
test, evaluate, and close: a pure function with two tests qualifies.

## Decision

| Rule | Detail |
| ---- | ------ |
| Product | `hello(name)` in `app.js`, defaulting to `'wave'` |
| Tests | `tests/hello.test.js` via `node:test`, run by Phase A |
| Evidence | Phase A PASS + Phase B APPROVE + `pr` gates GO |

## Consequences

### Positive

- Walkthrough stays under 15 minutes with zero dependencies.

### Negative / trade-offs

- None — scope is intentionally trivial.

## References

- `README.md` (walkthrough steps 3–6)
