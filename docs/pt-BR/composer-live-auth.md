# Autenticação para `npm run test:composer:live`

O teste live chama o `cursor-agent` com `--model composer-2.5` via
`benchmarks/shift-left/agent-runner.mjs`. Sem credencial válida, o runner
falha e **não inventa** JSON.

## Cloud Agent (recomendado)

1. Abra **Cursor → Cloud Agents → Environments** e edite o ambiente do repositório.
2. Em **Secrets**, adicione um **Runtime Secret** chamado exatamente `CURSOR_API_KEY`
   (chave de API do usuário no Cursor Dashboard, não o JWT do socket).
3. Inicie um **novo** run do agente (secrets não entram em VMs já abertas).
4. No terminal do agente: `npm run test:composer:live`.

## Local

```bash
cp .env.local.example .env.local
# preencha CURSOR_API_KEY=
npm run test:composer:live
```

Alternativa: `agent login` e depois o mesmo comando.

## Evidência

Com o teste verde, o arquivo gitignored
`benchmarks/shift-left/out/live-invocation.json` registra modelo, runner e ids
das mudanças retornadas pelo Composer.
