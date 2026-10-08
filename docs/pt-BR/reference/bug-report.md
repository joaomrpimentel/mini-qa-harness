# Modelo de bug report

`templates/bug-report.md`. O rascunho começa dele, passa pela revisão de uma pessoa e vira issue pelo `qa issue render`. O modelo está em inglês; os nomes de seção abaixo são os dele.

## Frontmatter

Fica para quem revisa, e o `qa issue render` tira.

| Campo | Conteúdo |
|---|---|
| `case` | id do caso, a pasta em `evidence/` |
| `reproduced` | o `summary` do `result.json`, ex.: `BUG 2/2` |
| `oracle` | qual oráculo diz que o comportamento está errado (ver abaixo) |
| `severity` | `Blocker`, `High`, `Medium` ou `Low` |

## Seções do corpo

| Seção | Conteúdo |
|---|---|
| `# <título>` | uma linha: o que falha, onde, e a consequência visível. Vira o título da issue |
| Requirement violated | fluxo ou contexto; o critério de aceite copiado sem paráfrase; issue relacionada; rota e elemento da tela |
| Environment | URL, build (versão, commit ou digest da imagem), perfil e papel, browser e viewport |
| Severity | nível e uma frase sobre quem é afetado e o que não consegue fazer |
| Steps to reproduce | numerados, a partir do login, com o texto exato da tela entre crases |
| Input data | tabela de campo e valor, com o prefixo de teste |
| Expected | o que devia acontecer, ligado ao requisito |
| Actual | texto da tela citado exatamente, mais método, rota, status e corpo da rede |
| Evidence | link do Jam primeiro, quando houver; um screenshot por passo, com legenda |

## Correspondência com a literatura

Bettenburg et al., "What Makes a Good Bug Report?" (FSE 2008), perguntou a devs do Apache, do Eclipse e do Mozilla: passos para reproduzir, stack trace e caso de teste foram os itens mais pedidos, e passo errado e informação incompleta os piores obstáculos. A ISO/IEC/IEEE 29119-3 define o relatório de incidente como documento de teste. A lista de campos da 29119-3 abaixo vem de resumos secundários e precisa ser conferida com a norma.

| Seção do modelo | Bettenburg et al. 2008 | Relatório de incidente da ISO/IEC/IEEE 29119-3 |
|---|---|---|
| Título | summary | descrição (resumo) |
| Requirement violated | comportamento esperado, ligado a uma fonte | contexto |
| Environment | versão, build, plataforma | contexto |
| Severity | severity | avaliação de severidade e prioridade de quem abriu |
| Steps to reproduce | passos para reproduzir (o mais pedido) | descrição |
| Input data | caso de teste | descrição |
| Expected / Actual | comportamento esperado e observado | descrição |
| Evidence: screenshots, status e corpo da rede | screenshots, stack traces | descrição, anexos |
| Evidence: Jam ou `trace.zip` | caso de teste, screenshots | anexos |
| Frontmatter `reproduced` | (reprodução é o principal obstáculo relatado) | |
| Fora do modelo | | data e hora, quem abriu, risco, status: o tracker preenche |

## Oráculos

Do FEW HICCUPPS de Michael Bolton. O achado cita pelo menos um, ou é observação e não bug.

| Oráculo | O produto é inconsistente com |
|---|---|
| Claim | o critério de aceite, a documentação, ou o que o produto diz que faz |
| Product | ele mesmo: a mesma ação funciona em outra tela |
| History | uma versão anterior |
| Comparable | produtos parecidos que o usuário conhece |
| User desires | o que um usuário razoável espera |
| Purpose | o motivo de a feature existir |
| Standards | lei, regra de acessibilidade ou convenção da plataforma |
| Image | a imagem da organização |
| Familiar problem | um padrão de bug conhecido (atualização perdida, envio duplo) |

## Gravidade

| Nível | Quer dizer |
|---|---|
| Blocker | o fluxo principal da feature não se completa, ou dado se perde ou vaza |
| High | um critério falha sem contorno |
| Medium | um critério falha com contorno, ou a mensagem engana |
| Low | cosmético, texto, inconsistência pequena |

## Vereditos

Todo critério testado termina com um destes, no resultado do `reproduce()` e no comentário da issue.

| Veredito | Quer dizer |
|---|---|
| `OK` | todas as rodadas passaram |
| `BUG k/k` | todas as rodadas falharam do mesmo jeito; rascunhe o report |
| `NOT_TESTED` | o caso não rodou. Motivos que o prompt do testador usa: `missing-data`, `no-access`, `env-down`, `blocked-by-other-bug`, `script-error` |
| `FLAKY j/k` | as rodadas discordaram; rode sozinho de novo, ou relate como observação |

## Fontes

- Bettenburg, Just, Schröter, Weiss, Premraj, Zimmermann. What Makes a Good Bug Report? FSE 2008. https://www.st.cs.uni-saarland.de/publications/details/bettenburg-tr-2008/
- ISO/IEC/IEEE 29119-3:2021. https://www.iso.org/standard/79429.html
- Bolton, FEW HICCUPPS. https://developsense.com/blog/2012/07/few-hiccupps
