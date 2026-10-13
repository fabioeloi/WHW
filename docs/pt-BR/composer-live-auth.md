# Autenticação para `npm run test:composer:live`

O teste live chama o `cursor-agent` com `--model composer-2.5` via
`benchmarks/shift-left/agent-runner.mjs`. Sem credencial válida, o runner
falha e **não inventa** JSON.

## Local (recomendado)

1. Instale o CLI: `curl -fsSL https://cursor.com/install | bash`
2. Faça login com a conta Cursor (sem API key):

```bash
agent login
npm run test:composer:live
```

O preflight usa `agent status` e a sessão persistida em `~/.config/cursor/`.
**Não** é necessário `CURSOR_API_KEY` na máquina local.

Opcional: `CURSOR_API_KEY` em `.env.local` (copie de `.env.local.example`) se
preferir autenticação por chave em vez de `agent login`.

## Cloud Agent

1. Abra **Cursor → Cloud Agents → Environments** e edite o ambiente do repositório.
2. Em **Secrets**, adicione um **Runtime Secret** chamado exatamente `CURSOR_API_KEY`
   (chave de API do usuário no Cursor Dashboard, não o JWT do socket).
3. Inicie um **novo** run do agente (secrets não entram em VMs já abertas).
4. No terminal do agente: `npm run test:composer:live`.

Sem o secret, runs de goal/thread neste ambiente (`environment-id` no stderr de
`npm run composer:live`) falham no preflight — isso é esperado; o benchmark não
inventa JSON. `agent login` em VM gerenciada costuma exigir OAuth manual e não
é o caminho confiável na nuvem.

**Não** exporte o JWT de `POST /v1/tokens/oidc` em `$CURSOR_AGENT_SOCKET` como
`CURSOR_AUTH_TOKEN`: é um token de identidade do cloud agent (audience OIDC), não
a sessão do `cursor-agent`. O benchmark remove esse JWT e usa `agent login`,
`CURSOR_API_KEY` ou um `CURSOR_AUTH_TOKEN` de sessão Origin injetado pelo host.

## Evidência

Com o teste verde, o arquivo gitignored
`benchmarks/shift-left/out/live-invocation.json` registra modelo, runner e ids
das mudanças retornadas pelo Composer.
