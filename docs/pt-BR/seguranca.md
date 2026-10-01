# Segurança e publicação

[Visão geral](README.md) · [Próximo: solução de problemas](solucao-de-problemas.md)

A [política canônica de segurança](../../SECURITY.md) está em inglês. Ela mantém
suporte a 0.1.x e acrescenta 0.2.x. Para vulnerabilidades, não abra issue pública:
contate o mantenedor pelo endereço do perfil GitHub. O compromisso de resposta
é 72 horas; correções saem assim que viável e crédito respeita a preferência
do relator.

## Antes de executar

Revise `whw.config.json`: gates shell, hooks e runners podem executar comandos
com os acessos do processo. `doctor` apresenta configuração sem executar
comandos arbitrários dos gates. WHW não instala os CLIs externos configurados.
Redação de logs é defesa adicional, não permissão para inserir segredos:
não inclua tokens, senhas, chaves ou dados pessoais em prompts e evidências.

O banco `.whw/state.db` é local e ignorado pelo Git. Versione evidências
apropriadas, não o banco nem transcrições privadas. Um gate de segredos verde
não garante ausência de qualquer informação sensível.

## O que este repositório verificou

0.2.0 foi publicada em 2026-10-01 com OIDC do GitHub Actions, trusted publisher
limitado a `npm stage publish` e aprovação humana por chave-senha no npm.
`npm publish` direto e alteração de dist-tag não foram autorizados na conexão.
O segredo GitHub `NPM_TOKEN` foi removido após a publicação comprovada;
o npm foi configurado para exigir 2FA e impedir tokens que contornam 2FA.
São práticas deste repositório, não configuração automática de projetos adotantes.

Na recuperação por dispatch, a attestation identifica o commit main do workflow.
Ela não atesta sozinha a tag de origem. Uma comparação independente dos 131
arquivos comprovou igualdade com `v0.2.0`. Essa execução não demonstra o caminho
futuro acionado por tag. Consulte a [verificação do release](../how/staged-release-verification.md)
e o [runbook](../how/staged-release.md), ambos em inglês.

A wave documental não altera tag nem republica o pacote. Atualizações dos
documentos npm virão com o próximo release. Não há promessa de conformidade
empresarial nem certificação de segurança por usar WHW.
