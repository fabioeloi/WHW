# Documentation

English is canonical. [Português brasileiro: complete adoption journey](pt-BR/README.md).
Historical ADRs and technical references remain in English.

| Goal | Start here | Next reference |
| --- | --- | --- |
| Understand the purpose | [Project overview](../README.md) | [WHY](../WHY.md), [manifesto](why/manifesto.md), [positioning](why/positioning.md) |
| Adopt in a repository | [Quick start](../README.md#quick-start) | [Worked example](../examples/hello-wave/), [adapters](what/adapters.md) |
| Plan scope and decisions | [Programs](how/programs.md) | [ADRs](how/adrs.md), [waves](how/waves.md), [SQL todos](how/todos-sql.md) |
| Execute and review | [Roles](how/roles.md) | [Gates](how/gates.md), [risk review](how/risk-review.md), [evaluation](how/evaluation.md), [evidence](how/evidence.md) |
| Resume or change tools | [Continuity](how/continuity.md) | [Consumer proof](how/consumer-proof-verification.md) |
| Configure the CLI | [CLI](what/cli.md) | [Config](what/config.md), [schema](what/schema.md), [metrics](what/metrics.md), [profile benchmark](what/benchmark.md) |
| Assess safety and proof | [Security policy](../SECURITY.md) | [Runner proof](how/runner-proof-real.md), [staged publication proof](how/staged-release-verification.md) |
| Contribute | [Contribution guide](../CONTRIBUTING.md) | [Conventions](how/conventions.md), [glossary](glossary.md), [plan](plan.md) |

Use version-pinned `npx @fabioeloi/whw@0.2.0` for the published package.
`node ./bin/whw.js` examples in technical references assume a WHW source
checkout. `init` does not install that source tree in a consumer repository.

GitHub documentation includes improvements made after 0.2.0 publication;
the npm package retains its release-time documents until the next release.
