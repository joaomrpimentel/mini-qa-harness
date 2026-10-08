# Panorama

Várias ferramentas deixam um LLM dirigir um browser, e algumas se vendem como teste com IA. Esta página situa o harness entre elas: o que ele pegou emprestado, o que faz diferente e as referências por trás das regras dele. As descrições seguem a documentação de cada projeto como lida em outubro de 2026.

## Agentes de browser e ferramentas de teste com IA

| Ferramenta | O que é | Evidência | Falso positivo e revisão |
|---|---|---|---|
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | servidor MCP que dirige o browser pela árvore de acessibilidade, sem modelo de visão | `--save-trace` e `--save-video` | não tem noção de veredito nem de revisão |
| [Playwright Test Agents](https://playwright.dev/docs/test-agents) | o planner escreve um plano de teste em Markdown, o generator transforma em spec, o healer reroda teste que falha e propõe patch | os testes gerados e os relatórios deles | a saída é código para uma pessoa revisar; o healer pode remendar um teste em volta de um bug de verdade |
| [browser-use](https://github.com/browser-use/browser-use) | loop de agente em Python em que o LLM decide cada passo | prints do loop | sem camada de veredito de QA |
| [Stagehand](https://docs.stagehand.dev/) | código no estilo Playwright com as primitivas `act`, `observe`, `extract` e `agent`; ação em cache se autocorrige | o que o script gravar | voltado a automação determinística, não a relatório |
| [Skyvern](https://www.skyvern.com/docs/getting-started/introduction) | visão mais LLM, com planner, task agent e um validator que confere se o objetivo foi cumprido | gravação por tarefa | o validator é o conferente embutido mais próximo entre os frameworks de agente |
| [Shortest](https://github.com/antiwork/shortest) | teste ponta a ponta em inglês corrido, rodado pelo Claude sobre o Playwright | resultado do teste | funções de callback acrescentam asserção em código por baixo do LLM |
| [Midscene.js](https://midscenejs.com/introduction) | automação guiada por screenshot, com `aiAssert` | relatório HTML que repassa cada ação, consulta e asserção | as asserções são julgamento do modelo |
| [QA.tech](https://qa.tech) | comercial; agentes exploratórios autônomos em cada PR | prints, console, rede e o raciocínio do agente no ponto da falha | o site público não descreve revisão humana |
| [Momentic](https://bug0.com/knowledge-base/momentic-features) | comercial; passos guardados como intenção em linguagem natural, resolvidos na hora | relatórios da plataforma | vende asserção com IA como o jeito de reduzir falso positivo |

O padrão no campo: a maior parte do esforço vai para manter teste rodando quando a tela muda. Poucas ferramentas separam "o agente diz que é bug" de "é bug verificado", e nenhum dos produtos acima documenta uma pessoa aprovando o relatório antes de ele ser aberto. É nesse buraco que o harness fica. Ele não tenta ser test runner nem crawler; é a peça entre um agente achar alguma coisa e um time ler sobre ela.

## Ferramentas de evidência e gravação

| Ferramenta | Captura | Observação |
|---|---|---|
| [Playwright trace](https://playwright.dev/docs/trace-viewer) | ações, snapshot do DOM em volta de cada ação, rede com corpo, console, filmstrip | a doc recomenda `retain-on-failure` quando não há retry; o harness usa esse padrão |
| [Vídeo](https://playwright.dev/docs/videos) e [HAR](https://playwright.dev/docs/mock#mocking-with-har-files) do Playwright | vídeo do contexto; arquivo completo da rede | fora por padrão; o log de rede do `evidence.json` é menor e passa pela redação |
| [Jam](https://jam.dev/docs/jam-mcp) | vídeo, prints, console, rede, eventos do usuário, metadados | o MCP lê, comenta e atualiza Jam; não há jeito público de criar um, daí a extensão |
| [Replay.io](https://docs.replay.io/basics/replay-mcp/overview) | o próprio runtime, que se reproduz de forma determinística | mais forte que vídeo para o dev que depura; tem CLI e MCP |
| [rrweb](https://github.com/rrweb-io/rrweb) | gravação e replay da sessão pelo DOM | open source e auto-hospedável, sem conta em SaaS |
| [Bird Eats Bug](https://birdeatsbug.com/feature/browser-extension) | tela, cliques e teclas, console, rede, info do sistema | extensão no mesmo espaço do Jam |

Carregar extensão no Playwright só funciona com contexto persistente e o Chromium que vem com ele, como descreve a [doc do Playwright sobre extensões](https://playwright.dev/docs/chrome-extensions). Essa restrição dá forma ao `src/jam.mjs`.

## O que o harness pegou emprestado

- **Validador como papel separado**, do desenho do Skyvern e do maker-checker: a sessão principal verifica, o testador não dá nota a si mesmo.
- **Avaliar o resultado, não a transcrição**, do guia da Anthropic sobre avaliação de agentes e dos achados sobre falso sucesso: quem verifica abre artefato.
- **Trace guardado na falha**, da própria orientação do Playwright: o `trace.zip` só existe para rodada cujo veredito não é OK.
- **Reprodução como contagem**, do pass^k da avaliação de agentes e da literatura de teste instável: `BUG 2/2`, não "confirmado".
- **NOT_TESTED com código de motivo**, porque a precisão de veredito medida em agentes de teste deixa espaço para "não deu para saber".
- **Charter e debrief com obstáculos**, do session-based test management.
- **Oráculo nomeado**, do FEW HICCUPPS.
- **Trabalhadores pequenos em paralelo, com objetivo, formato de saída e fronteira claros**, das notas da Anthropic sobre o sistema de pesquisa multiagente dela.

## O que ele não faz, de propósito

- **Sem autocorreção.** Quando um seletor para de casar, o caso falha e uma pessoa olha. Um healer que reescreve o teste até passar pode tirar um bug de verdade do teste.
- **Sem postar sem uma pessoa.** A ferramenta que abre issue nunca fica na mão do testador.
- **Sem chamada de API pelo testador.** O log de rede é o que a tela fez. Testador que monta requisição na mão está testando a API, que é outro trabalho.
- **Sem crawler.** O testador segue um charter tirado dos critérios de aceite. A exploração acontece dentro do charter, com tempo fixo.

O Jam é opcional pelo mesmo motivo que o trace não é: ele serve ao dev que abre a issue, e o harness funciona sem ele. rrweb ou Replay poderiam ocupar o mesmo lugar; o harness não implementa nenhum dos dois hoje.

## Referências

Ferramentas e documentação:

- Playwright MCP: https://playwright.dev/mcp/introduction e https://github.com/microsoft/playwright-mcp
- Playwright Test Agents: https://playwright.dev/docs/test-agents
- Playwright trace viewer: https://playwright.dev/docs/trace-viewer
- Vídeo no Playwright: https://playwright.dev/docs/videos
- HAR no Playwright: https://playwright.dev/docs/mock#mocking-with-har-files
- Playwright e extensões do Chrome: https://playwright.dev/docs/chrome-extensions
- browser-use: https://github.com/browser-use/browser-use
- Stagehand: https://docs.stagehand.dev/ e https://github.com/browserbase/stagehand
- Skyvern: https://www.skyvern.com/docs/getting-started/introduction
- Shortest: https://github.com/antiwork/shortest
- Midscene.js: https://midscenejs.com/introduction
- QA.tech: https://qa.tech
- Momentic (resumo de terceiros): https://bug0.com/knowledge-base/momentic-features
- Jam MCP: https://jam.dev/docs/jam-mcp
- Replay.io MCP: https://docs.replay.io/basics/replay-mcp/overview e time travel: https://docs.replay.io/basics/time-travel/how-does-time-travel-work
- rrweb: https://github.com/rrweb-io/rrweb
- Bird Eats Bug: https://birdeatsbug.com/feature/browser-extension

Prática de teste:

- Session-Based Test Management, Jonathan e James Bach: https://www.satisfice.com/sbtm
- FEW HICCUPPS, Michael Bolton: https://developsense.com/blog/2012/07/few-hiccupps e https://developsense.com/resource/Oracles.pdf
- Heuristic Test Strategy Model (SFDPOT), James Bach: https://www.satisfice.com/download/heuristic-test-strategy-model
- Bettenburg, Just, Schröter, Weiss, Premraj, Zimmermann, "What Makes a Good Bug Report?", FSE 2008: https://www.st.cs.uni-saarland.de/publications/details/bettenburg-tr-2008/ (resumo: https://neverworkintheory.org/2011/08/30/what-makes-a-good-bug-report.html). O que os devs mais pediram: passos para reproduzir, stack trace e caso de teste.
- ISO/IEC/IEEE 29119-3:2021, documentação de teste, incluindo o relatório de incidente: https://www.iso.org/standard/79429.html. A lista de campos usada na [referência do relatório de bug](../reference/bug-report.md) vem de resumos secundários como https://www.microtool.de/en/document-management/test-documentation-with-iso-iec-ieee-29119-32021/, não do texto da norma.
- Luo, Hariri, Eloussi, Marinov, "An Empirical Analysis of Flaky Tests", FSE 2014: https://siebelschool.illinois.edu/news/marinov-fse-test-of-time
- Parry, Kapfhammer, Hilton, McMinn, "A Survey of Flaky Tests", TOSEM 2022: https://eprints.whiterose.ac.uk/id/eprint/230095
- Maker-checker: https://en.wikipedia.org/wiki/Maker-checker e NIST SP 800-53 AC-5: https://www.stigviewer.com/controls/nist-800-53/AC-5

Agentes LLM:

- "From Confident Closing to Silent Failure", ICML 2026: https://arxiv.org/pdf/2606.09863. Os números de falso sucesso, de 44% a 52% e 75,8%, são os relatados pelo artigo.
- Chevrot et al., "Are Autonomous Web Agents Good Testers?": https://arxiv.org/abs/2504.01495. Os cerca de 60% de vereditos corretos do PinATA são os relatados pelo artigo.
- AgentRewardBench: https://arxiv.org/abs/2504.08942
- WebProber: https://arxiv.org/abs/2509.05197
- Anthropic, "Building effective agents": https://www.anthropic.com/engineering/building-effective-agents
- Anthropic, "How we built our multi-agent research system": https://www.anthropic.com/engineering/multi-agent-research-system
- Anthropic, "Demystifying evals for AI agents": https://anthropic.com/engineering/demystifying-evals-for-ai-agents
