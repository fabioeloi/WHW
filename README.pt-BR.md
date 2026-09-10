<div align="center">

# WHW — Why · How · What

### Um harness agnóstico a LLM e ferramenta para entrega autônoma com evidências

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D22.13-339933?logo=node.js&logoColor=white)](package.json)
[![Zero dependencies](https://img.shields.io/badge/dependencies-zero-blue)](package.json)

[🇺🇸 Read in English](README.md)

</div>

---

> Tradução do `README.md`. Em caso de divergência, a versão em inglês prevalece.

## 💡 O problema

Agentes de código autônomos são rápidos, mas esquecem. O trabalho vive em
transcrições de chat: decisões não são registradas, "pronto" é subjetivo, o
contexto evapora entre sessões e trocar de ferramenta significa recomeçar.

## ✅ A resposta

WHW (Why · How · What) é um harness sobre qualquer modelo de fronteira ou
agente de código, transformando prompts isolados em um **processo com estado,
papéis, artefatos e validação**:

```text
WHY.md ──→ 📜 ADRs ──→ 🌊 Ondas (A–E) ──→ 🗄️ todos SQL ──→ 🤖 Papéis ──→ ✅ Gates ──→ 📦 Evidências
```

WHW é **agnóstico por design**: qualquer modelo (aberto ou fechado), qualquer
ferramenta (Claude Code, Cursor, Copilot, Codex, Gemini CLI, Aider, …),
qualquer stack. O contrato são arquivos e SQL — ferramentas passam, evidências ficam.

> **Nota de inspiração.** A ordem Porquê → Como → O Quê é inspirada em *Start
> With Why* (2009), de Simon Sinek. WHW é um projeto independente, sem afiliação
> ou endosso. Veja [ACKNOWLEDGMENTS.md](ACKNOWLEDGMENTS.md).

---

## 🚀 Início rápido

Requisitos: Node.js ≥ 22.13 (usa `node:sqlite` embutido), git. Zero
dependências — sem `npm install`.

Até `@fabioeloi/whw` estar no npm (tag `v0.1.1` + `NPM_TOKEN`, ADR 0010), rode
a partir de um clone. Depois da publicação, `npx @fabioeloi/whw` é o mesmo CLI.

```bash
# 1. Experimente (clone até o publish no npm)
git clone https://github.com/fabioeloi/WHW.git
cd WHW
node ./bin/whw.js doctor

# Depois do publish:
# npx @fabioeloi/whw doctor

# 2. Adote no seu repositório
cd seu-projeto
node /caminho/para/WHW/bin/whw.js init --tools claude,cursor,codex,copilot,gemini
# Depois do publish: npx @fabioeloi/whw init --tools claude,cursor,codex,copilot,gemini

# 3. Crie um programa e depois uma onda
whw program new checkout-revamp --waves 4
whw wave new guest-checkout --adr 0009

# 4. Rode o ciclo (humano ou agente — mesmos comandos)
whw sync --all
whw queue
whw claim wave001-A
# ... implemente ...
whw done wave001-A --evidence "commit abc123, testes verdes"
whw gate run --tier pr
whw close wave-001-guest-checkout
whw status
```

Prefere um tour guiado? Veja [`examples/hello-wave/`](examples/hello-wave/).

---

## 🎯 Como funciona

### WHY — propósito primeiro

Todo repositório começa com [`WHY.md`](WHY.md): propósito, não-objetivos e
princípios. ADRs ([`docs/adr/`](docs/adr/)) registram cada decisão relevante.
Programas são criados por um ADR que mapeia ondas, exclusões explícitas e
critérios de encerramento.

**Regra de rastreabilidade: sem todo sem onda, sem onda sem ADR, sem ADR sem
WHY.** A verificação corre de fora para dentro: evidências (WHAT) provam que os
gates (HOW) satisfizeram o aceite do ADR (WHY).

### HOW — o ritmo das ondas

O trabalho embarca em **ondas** de cinco passos (cada um, um PR pequeno — ou um
commit atômico no fluxo solo):

| Letra | Nome    | Entrega                                              |
| ----- | ------- | ---------------------------------------------------- |
| **A** | Plan    | seed `planning/wave-NNN-<slug>.todos.sql` + deps     |
| **B** | Build   | A implementação                                      |
| **C** | Check   | Testes + gates verdes                                |
| **D**  | Decide  | Adendo ao ADR registrando decisão e entrega          |
| **E**  | End     | Fechamento canônico: `.done.sql`, gates de sync, docs|

A onda só está `done` quando **E** faz merge. Ondas se agrupam em **programas**;
a onda de encerramento roda um **gate de inventário** provando que todos os
artefatos existem — e que **não há onda N+1 sem um novo ADR**. Escopo novo
exige decisão, não improviso.

O estado de execução vive em SQL: seeds versionados em `planning/*.todos.sql`,
carregados por `whw sync` em `.whw/state.db` (SQLite, derivado, ignorado pelo
git). Agentes retiram trabalho de uma fila com dependências — nunca da memória
do chat.

### WHAT — evidência, não alegação

**Gates** são verificações executáveis com veredito GO/NO_GO e checkpoints com
timestamp (`.whw/checkpoints/<gate>/latest.txt`). Dois níveis mantêm o CI honesto:

- `pr` — bloqueante e **enxuto**: cobertura de planning, vínculo com ADR, sync
  de ondas, sync de README, paridade de adaptadores, varredura de segredos.
- `ops` — sob demanda: inventário de programa, qualidade de evidência,
  `release-readiness` (higiene do pacote; não publica npm — ADR 0010).

**Avaliação** em duas fases: checagens determinísticas (lint/testes/build) a
custo zero de IA; depois, um modelo pontua a rubrica ponderada
(qualidade-técnica 1.3, originalidade 1.3, craft 1.0, funcionalidade 1.0 — 0–5,
limiar 3.5). Rejeições retornam as 3 correções prioritárias.

**Relato** fecha o ciclo: todo marco termina com Status / Evidências / Próximo
passo (`whw status`), e `whw metrics` gera números reproduzíveis.

### Papéis — um ciclo, vários modelos

| Papel                 | Estratégia de contexto | Arquivos de handoff              |
| --------------------- | ---------------------- | -------------------------------- |
| `planner`             | compaction             | spec, ADRs, plano da onda        |
| `builder`             | reset por onda         | `todos.sql`, spec                |
| `evaluator`           | reset, stateless       | contrato, relatório, rubrica     |
| `closer`              | reset                  | SQL da onda, gates, ADR          |
| `autonomous-engineer` | SQL é a memória        | fila + narrativa `plan.md`       |

Papéis são prompts neutros (`roles/`) + Agent Skills (`skills/`). `whw run <papel>`
pode invocar seus CLIs (`claude`, `codex`, `cursor-agent`, `gemini`, `aider`, …)
com escada de escalação terminando em humano — ou traga seu próprio runner.

### Continuidade — sobreviva a interrupções e trocas de ferramenta

`whw resume` revalida git + fila após reboot ou chat novo (não faz claim).
`whw handoff --from cursor --to claude` emite um pacote com baseline git,
snapshot da fila, resultados de gates e próxima ação. Há um pacote ao vivo em
`docs/handoff/`. Sessões retomam do SQL, não de "onde estávamos?".
Hooks opcionais (`on_claim`, `on_done`, `on_gate_fail`, `on_close`) disparam
depois do evento e não desfazem a transição.

---

## 📚 Documentação

| Caminho                     | Conteúdo                                                        |
| --------------------------- | --------------------------------------------------------------- |
| `WHY.md`                    | Propósito, não-objetivos, princípios deste projeto              |
| `AGENTS.md`                 | Instruções canônicas de agente (+ adaptadores por ferramenta)   |
| `docs/why/manifesto.md`     | O mapeamento WHY/HOW/WHAT                                       |
| `docs/why/principles.md`    | Propósito primeiro, evidência sobre chat, gates enxutos, …      |
| `docs/why/positioning.md`   | Taxonomia de seis dimensões; WHW vs. Spec Kit, OpenSpec, BMAD…  |
| `docs/how/`                 | Ondas, programas, ADRs, todos.sql, gates, evidências, continuidade, papéis, escalação, avaliação, convenções |
| `docs/what/`                | Referência CLI, schema, config, templates, adaptadores, métricas|
| `docs/adr/`                 | Decisões do próprio WHW (0001–)                             |
| `docs/plan.md`              | Plano narrativo com ondas 5W2H (deste repositório, ao vivo)     |
| `docs/handoff/`             | Pacotes vivos de migração de IDE/agente (`whw handoff`)         |
| `templates/`                | WHY, AGENTS, ADR, charter, SQL de onda, PR, handoff, …          |
| `examples/hello-wave/`      | Exemplo mínimo de ponta a ponta                                 |

## 🗺️ Roteiro

- `v0.1.0` — Harness núcleo (Programa 001): CLI, planning SQL, gates, papéis, skills, docs.
- `v0.1.1` — Publicação (Programa 002 onda 007): CI sincroniza seeds antes dos gates,
  `release.yml` (GitHub Release + npm com provenance), início rápido via clone.
- Em seguida (Programa 002 ondas 008–011) — higiene de checkpoints, evidência
  reexecutável / WIP, prova real de `whw run`, `whw resume` + hooks, gate de
  prontidão de release e política de manutenção.
- Depois — `whw serve`, adapter PostgreSQL ao vivo, `whw migrate`, `whw board`,
  traduções além de pt-BR.

## 🤝 Contribuindo

Leia [CONTRIBUTING.md](CONTRIBUTING.md) (em inglês): retire de `whw queue`,
trabalhe em ondas, PRs pequenos, marcos com Status / Evidências / Próximo passo.
Vulnerabilidades: [SECURITY.md](SECURITY.md).

## 📄 Licença

[MIT](LICENSE) © 2026 Fabio Eloi. Veja [ACKNOWLEDGMENTS.md](ACKNOWLEDGMENTS.md).
