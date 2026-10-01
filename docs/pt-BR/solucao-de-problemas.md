# Solução de problemas

[Visão geral](README.md) · [Início rápido](inicio-rapido.md)

| Sintoma | Verificação | Próximo passo |
| --- | --- | --- |
| `node:sqlite` indisponível | `node --version` | Use Node ≥22.13; execute `doctor` |
| `bin/whw.js` não existe após init | Confirme se está em um projeto consumidor | Execute `npx @fabioeloi/whw@0.2.0`; init não copia o CLI |
| ADR/tarefa do exemplo não existe | Confira saída de `program new`, `wave new` e `queue` | Use os números gerados; 0001/001 valem para repo novo |
| Fila vazia | Execute `sync --all`; confira seeds e dependências | Consulte `status`; não improvise tarefas pela memória do chat |
| Outra tarefa já está em andamento | Consulte `queue` | Finalize ou bloqueie a tarefa atual; uma claim por vez |
| Gate NO_GO | Leia saída e checkpoint do gate | Corrija a causa; não faça merge com gate vermelho |
| `close` recusado | Confira A–D, adendo e gates | Complete a condição faltante; não force nem reabra done |
| CLI de agente encontrado, mas execução falha | Separe presença, configuração, login e backend | Verifique o CLI externo sem expor credenciais; registre bloqueio |
| Runner saiu zero sem entrega | Confira diff, testes e SQL | Registre o resultado real; aprovação exige evidências |
| Documentação npm diverge do GitHub | Confira a versão instalada | 0.2.0 mantém documentos da publicação; próximos releases incorporam atualizações |

```bash
npx @fabioeloi/whw@0.2.0 doctor
npx @fabioeloi/whw@0.2.0 resume
npx @fabioeloi/whw@0.2.0 status
```

Se `resume` reportar NO_GO, trate o problema antes de seguir. Não edite SQL
local diretamente nem publique logs que contenham caminhos privados ou dados
pessoais. Reporte bugs com versão, comando, resultado esperado/observado e
reprodução sanitizada. Vulnerabilidades seguem o canal privado da política.

Referências em inglês: [CLI](../what/cli.md), [configuração](../what/config.md),
[continuidade](../how/continuity.md), [contribuição](../../CONTRIBUTING.md),
[segurança](../../SECURITY.md).
