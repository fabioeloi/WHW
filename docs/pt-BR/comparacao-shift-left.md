# Comparação classic e shift-left

O inglês de [ADR 0018](../adr/0018-shift-left-profile.md),
[revisão por risco](../how/risk-review.md) e
[benchmark](../what/benchmark.md) é canônico. Esta página é o resumo.

O WHW continua, por padrão, no perfil `classic`: toda onda segue A–E e o
`whw close` exige as letras A–D e o adendo do ADR. O perfil `shift-left` é
opt-in (`process.profile`). Ele classifica sinais e encurta o que é pequeno,
e pede desenho antes de construir quando o risco é alto ou crítico.

| Classe | Caminho | Julgamento humano |
| ------ | ------- | ----------------- |
| Baixo | A → B → C → E | nenhum |
| Médio | A → B → C → D → E | só se o fitness falhar |
| Alto | A → D0 → B → C → D → E | sempre, e o fitness bloqueia o Build |
| Crítico | o caminho alto mais W | sempre, com walkthrough antes do close |

`whw judge` registra uma atestação. Conferir títulos de um arquivo não prova
que alguém entendeu o sistema. O relatório deixa `comprehensionProven` em
`false`.

`npm run benchmark` executa as mesmas cinco mudanças de um ledger mínimo nos
dois perfis. Não chama modelo, não mede hora de pessoa e não inventa tokens.
O custo é adimensional, publicado em `benchmarks/shift-left/cost-model.json`.
Um defeito do cenário crítico não tem teste automático: o script assume que o
desenho antecipado escolhe a variante segura e que a revisão tardia não
desfaz código já escrito. Essa premissa está escrita no relatório, com uma
coluna de custo que a exclui.

O veredito (`recommend-adopt`, `recommend-reject`, `tradeoff` ou
`inconclusive`) não altera o perfil padrão. Serve para uma decisão posterior.
Não é ganho medido de produtividade nem economia financeira.
