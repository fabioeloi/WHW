# Início rápido

[Visão geral](README.md) · [Próximo: conceitos](conceitos.md)

Requer Node.js ≥22.13, npm e Git. O pacote tem zero dependências de runtime;
`npx` baixa o pacote quando necessário. Em repositório existente, revise os
arquivos antes de adotar; não use `init --force` sem avaliar sobrescritas.

## Criar o contrato

```bash
mkdir whw-demo
cd whw-demo
git init
npx @fabioeloi/whw@0.2.0 init --tools claude,cursor,codex,copilot,gemini
npx @fabioeloi/whw@0.2.0 doctor
npx @fabioeloi/whw@0.2.0 program new adoption --waves 1
npx @fabioeloi/whw@0.2.0 wave new first-change --adr 0001
```

Em repositório vazio, os arquivos gerados incluem
`docs/adr/0001-program-adoption.md` e
`planning/wave-001-first-change.todos.sql`. Os números avançam em repositórios
existentes; use o resultado do CLI. Edite WHY, escopo/exclusões do charter,
mapa `001 → first-change`, critérios de aceite e a narrativa `docs/plan.md`.
Não deixe os placeholders dos templates como decisões definitivas.

## Concluir somente o planejamento A

```bash
npx @fabioeloi/whw@0.2.0 sync --all
npx @fabioeloi/whw@0.2.0 queue
npx @fabioeloi/whw@0.2.0 claim wave001-A
```

Conclua e revise os artefatos A. Então:

```bash
npx @fabioeloi/whw@0.2.0 gate run --tier pr
npx @fabioeloi/whw@0.2.0 done wave001-A --evidence "planning/wave-001-first-change.todos.sql; docs/adr/0001-program-adoption.md; npx @fabioeloi/whw@0.2.0 gate run --tier pr"
npx @fabioeloi/whw@0.2.0 status
```

A evidência deve identificar artefatos e comandos reais. Não use hashes ou
resultados fictícios. B fica pronto após A; concluir A não encerra a onda.
Integre cada letra com revisão e CI verde. Veja [operação](operacao.md) para
as condições de `close`.

## Pacote ou checkout?

Use `npx @fabioeloi/whw@0.2.0` em seu projeto. Instalação explícita também
permite executar `whw`, conforme seu PATH. `init` copia o contrato do processo,
mas não copia `bin/` nem `src/`. `node ./bin/whw.js` só funciona no checkout
do código-fonte do WHW. Não crie um CLI local fictício após `init`.

Referências em inglês: [CLI](../what/cli.md), [adaptadores](../what/adapters.md),
[exemplo completo](../../examples/hello-wave/).
