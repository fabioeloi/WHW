# Conceitos e glossário

[Visão geral](README.md) · [Próximo: operação](operacao.md)

| Termo | Significado | Artefato |
| --- | --- | --- |
| WHY | Propósito, princípios e não objetivos | `WHY.md` |
| ADR | Registro de decisão com contexto e consequências | `docs/adr/` |
| Charter / programa | Escopo, exclusões, mapa de ondas e aceite | ADR do programa |
| Wave / onda | Unidade de entrega em cinco letras A–E | `planning/wave-NNN-*.todos.sql` |
| Seed | Entrada SQL versionada | `*.todos.sql` |
| Estado SQL | Fonte de verdade da execução local | `.whw/state.db` |
| Claim | Assumir uma tarefa da fila | `claim <ref>` |
| Gate / verificação | Contrato executável GO/NO_GO | Checkpoint e comando |
| Evidence / evidência | Artefato verificável que demonstra a entrega | Teste, commit, PR, relatório |
| Runner / executor | CLI externo configurado para executar um papel | Configuração e logs |
| Handoff / transferência | Pacote para mudança de ferramenta | Baseline, fila, gates, próxima ação |
| Staging | Preparação do pacote antes da aprovação | Release preparado no npm |

A rastreabilidade conecta tarefa → onda → ADR → WHY. Um programa define
limites; nova frente exige novo charter. O estado SQL não substitui decisões
versionadas. `sync` aplica seeds sem reabrir tarefas `done`; faça transições
por `claim`, `done`, `block`, `cancel` e `note`, nunca editando o banco à mão.

Os papéis `planner`, `builder`, `evaluator`, `closer` e `autonomous-engineer`
são instruções, não prova de execução autônoma. Separar responsabilidades
facilita a revisão; a qualidade depende do aceite e da verificação do projeto.

Referências em inglês: [manifesto](../why/manifesto.md),
[programas](../how/programs.md), [ADRs](../how/adrs.md),
[schema](../what/schema.md), [glossário canônico](../glossary.md).
