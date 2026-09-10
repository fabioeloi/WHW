# Hello Wave — a 15-minute WHW tour

A minimal repo that runs the whole loop: charter → queue → claim/done →
evaluate → close → gates → metrics. No mocks: every command below is real.

> Run in place (`cd examples/hello-wave`) or copy this folder to `/tmp` first.
> The `whw` binary is the one from the WHW repo root (`../../bin/whw.js`).

## 0. Orient

```bash
whw doctor                 # toolchain + config + layout (this folder ships whw.config.json)
cat WHY.md                 # purpose first
cat docs/adr/0001-hello.md # the decision this wave serves
whw adapters sync          # pointer files so any agent finds AGENTS.md
```

## 1. Sync and see the queue

```bash
whw sync --all             # planning/*.todos.sql → .whw/state.db
whw queue                  # wave001-A ready; B–E wait on the chain
```

Expected: `[ready] wave001-A — Wave 001 A — Plan: hello (wave-001-hello)`.

## 2. Wave A — plan

Review the seed (`planning/wave-001-hello.todos.sql`), then:

```bash
whw claim wave001-A
whw done wave001-A --evidence "seed reviewed, 5 refs, chain A→E"
whw queue                  # wave001-B is now ready
```

## 3. Wave B — build

The wave's job: a greeter with tests. Create the product:

```bash
whw claim wave001-B
cat > app.js <<'EOF'
export function hello(name = 'wave') {
  return `hello, ${name}!`;
}
EOF
mkdir -p tests
cat > tests/hello.test.js <<'EOF'
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hello } from '../app.js';

describe('hello', () => {
  it('greets by name', () => assert.equal(hello('wave'), 'hello, wave!'));
  it('defaults to wave', () => assert.equal(hello(), 'hello, wave!'));
});
EOF
node --test "tests/**/*.test.js"
whw done wave001-B --evidence "app.js + tests/hello.test.js, node --test green (2 pass)"
```

## 4. Wave C — verify

Deterministic checks first (zero AI cost), then the rubric:

```bash
whw claim wave001-C
whw evaluate --phase a
whw evaluate --phase b --scores '{"technical-quality":4,"originality":4,"craft":4,"functionality":5}'
whw gate run --tier pr
whw done wave001-C --evidence "Phase A PASS, Phase B APPROVE 4.2, pr gates GO"
```

## 5. Wave D — decide

Record the decision where it belongs — the ADR addendum plus the plan entry:

```bash
whw claim wave001-D
cat >> docs/adr/0001-hello.md <<'EOF'

## Addendum Wave 001 — hello

Shipped: greeter (`app.js`) + 2 tests. Evidence: Phase A PASS, Phase B
APPROVE, `pr` gates GO. Follow-ups: none.
EOF
cat >> docs/plan.md <<'EOF'

## Wave 001 — hello

Greeter + tests, evaluated and gated. Evidence: `.whw/evaluation-report.json`,
`.whw/checkpoints/*/latest.txt`.
EOF
whw done wave001-D --evidence "addendum in 0001-hello.md, entry in docs/plan.md"
```

## 6. Wave E — close

```bash
whw close 001              # asserts A–D terminal + addendum + sync gates GO
whw gate run --tier pr     # all six GO; commit latest.txt as proof
whw status                 # Status / Evidence / Next step
whw metrics                # reproducible numbers
```

## 7. Leave or migrate

```bash
whw resume                 # git + sync + queue (does not claim)
whw handoff --from <your-tool> --to <next-tool>   # resumable package
```

You just ran the full harness: WHY → ADR → wave → SQL → gates → evidence.
The same commands scale to programs of dozens of waves — see the WHW repo's
own `planning/` and `docs/plan.md` for a live example.
