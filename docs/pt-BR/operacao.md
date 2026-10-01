# Operação e continuidade

[Visão geral](README.md) · [Próximo: segurança](seguranca.md)

## Executar uma letra por vez

Comece com `sync --all` e `queue`. Assuma somente uma tarefa com `claim <ref>`.
A entrega percorre A planejamento, B implementação, C verificação independente,
D decisão/adendo e E encerramento. Use referências realmente geradas.

```bash
npx @fabioeloi/whw@0.2.0 sync --all
npx @fabioeloi/whw@0.2.0 queue
npx @fabioeloi/whw@0.2.0 claim wave001-B
```

Execute B apenas depois de concluir e integrar A. Se houver obstáculo:

```bash
npx @fabioeloi/whw@0.2.0 block wave001-B --reason "Dependência externa indisponível; registrar condição de retomada"
```

Quando a condição estiver resolvida, `claim` pode reassumir a tarefa bloqueada.
Após implementar, registre `done <ref> --evidence "..."` com caminhos,
commits/PRs e comandos reproduzíveis reais. Exit zero de um runner não prova
entrega: confira diff, testes, SQL e evidências separadamente.

## Verificar, integrar e encerrar

```bash
npx @fabioeloi/whw@0.2.0 gate run --tier pr
npx @fabioeloi/whw@0.2.0 gate run --tier ops
```

Além dos gates, execute os testes do projeto. Revise o PR e espere CI verde
antes do merge; valide main antes da próxima letra. O gate atual de README
não cobre toda a jornada pt-BR: revise também links, comandos e alegações.

Só depois de A–D concluídos, adendo presente e gates de sincronização verdes:

```bash
npx @fabioeloi/whw@0.2.0 close wave-001-first-change
npx @fabioeloi/whw@0.2.0 status
```

O encerramento canônico registra E; a onda termina quando E é integrado.
Não force encerramento nem reabra `done`. Novo trabalho exige nova onda com ADR.

## Retomar e trocar de ferramenta

```bash
npx @fabioeloi/whw@0.2.0 resume
npx @fabioeloi/whw@0.2.0 handoff --from codex --to claude
```

`resume` revalida Git, sync, fila e gates PR; não executa `claim` automaticamente.
Revise o baseline e a próxima tarefa. `handoff` gera pacote com estado e
ponteiros de evidências; não transporta memória interna nem chats privados.
Ferramentas citadas identificam a direção do pacote, não uma inferência real.

Marcos terminam com **Status / Evidence / Next step**. Runners precisam de
instalação, autenticação e configuração próprias. Presença em `doctor` não
comprova backend nem acesso a modelo. A prova Codex deste repositório é assistida
pelo operador, que finalizou Git/SQL após bloqueio do sandbox.

Referências em inglês: [ondas](../how/waves.md), [gates](../how/gates.md),
[evidências](../how/evidence.md), [continuidade](../how/continuity.md),
[configuração](../what/config.md), [prova do runner](../how/runner-proof-real.md).
