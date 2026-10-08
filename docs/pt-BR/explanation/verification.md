# Verificação

O relatório de um agente testador é uma afirmação sobre o app. Esta página explica por que o harness trata isso como afirmação, quem confere e o que a conferência olha. O checklist em si mora na skill (`skill/mini-qa/references/verify.md`); aqui está o raciocínio por trás dele.

## Quem produz o resultado não aprova

Banco chama de maker-checker, segurança chama de separação de funções (NIST SP 800-53, controle AC-5), e a ideia é a mesma: quem produz um resultado não é quem aprova. No harness são três papéis, e cada um confere o anterior:

| Papel | Produz | Quem confere |
|---|---|---|
| Agente testador | vereditos, prints, log de rede, rascunhos de bug | a sessão principal |
| Sessão principal | achados verificados, rascunhos revisados, gravações | o usuário |
| Usuário | a decisão de postar | o time que lê a issue |

O testador não consegue pular a conferência porque não tem como postar. A sessão principal não consegue pular o usuário porque postar é uma ordem explícita, não um passo do fluxo.

## Agente relata sucesso que não alcançou

Agente LLM é confiante quando erra. Um estudo de 2026 sobre falhas de agentes, "From Confident Closing to Silent Failure", relata que entre 44% e 52% das falhas analisadas no tau2-bench eram o agente afirmando com confiança que tinha terminado, contra o que o ambiente mostrava de fato, e 75,8% no AppWorld. O mesmo artigo relata que juízes LLM lendo a transcrição deixam passar a maior parte desses casos, porque se ancoram na linguagem confiante. "Are Autonomous Web Agents Good Testers?" mediu um agente de teste web (PinATA) e relatou cerca de 60% de vereditos corretos num benchmark de 113 casos. Os números são os relatados pelos artigos; o harness não os reproduziu.

A consequência para o desenho: quem verifica olha artefato, não narrativa. O guia da Anthropic sobre avaliação de agentes traça a mesma linha entre a transcrição (o que o agente disse e fez) e o resultado (o estado final do ambiente), e manda avaliar o resultado. Na prática, a sessão principal abre os prints em ordem e pergunta se cada um mostra o que a legenda diz, lê o `evidence.json` atrás dos status e dos corpos de erro, e abre o `trace.zip` quando os prints não bastam. A frase do testador "a nota não foi excluída" é um ponteiro para `03-after-reload.png`, não evidência por si só.

## Falha vista uma vez ainda não é bug

Teste instável é problema estudado. Luo e colegas analisaram 201 correções de testes instáveis em 51 projetos (FSE 2014) e acharam como causas principais espera assíncrona, concorrência e dependência da ordem dos testes. Um agente de browser traz as dele: o toast que sumiu antes do print, o registro que outro agente estava editando, o cache frio depois do deploy.

Por isso uma falha só entra no relatório depois que o `reproduce` roda o caso de novo, do zero, numa sessão de browser nova, e chega ao mesmo veredito todas as vezes. O resultado sai como contagem, `BUG 2/2`, e não como um sim. A contagem diz ao leitor quão forte é a afirmação, e empresta a ideia de pass^k da avaliação de agentes: rode k vezes, diga quantas concordaram. Vereditos que discordam saem como `FLAKY 1/2`, que é observação para o comentário, não bug para o tracker.

## NOT_TESTED é um veredito próprio

Quando um caso não roda, a resposta honesta não é OK nem BUG. Se o caso precisa de um tipo de registro que o ambiente não tem, de um papel que ninguém configurou ou de um serviço que não está no ar, o veredito é `NOT_TESTED` com motivo (`missing-data`, `no-access`, `env-down`, `blocked-by-other-bug`, `script-error`). Chamar de OK esconde um buraco na cobertura. Chamar de BUG manda um dev atrás de um problema que mora no ambiente. Com a taxa de erro de veredito que os agentes têm, vale manter uma terceira resposta que diz "não deu para saber". O `reproduce` também transforma erro no script de teste em `NOT_TESTED` com motivo `script-error`, porque um script que quebrou não diz nada sobre o app.

## Todo bug nomeia o oráculo

Oráculo é como se reconhece um problema. O FEW HICCUPPS, de Michael Bolton, lista os oráculos de consistência que testadores usam: o produto deve ser consistente com a própria história, com a imagem da organização, com produtos comparáveis, com o que se afirma sobre ele, com o que o usuário quer, consigo mesmo, com o propósito e com as normas que se aplicam; e um padrão de problema conhecido também é sinal. O harness pede que cada achado nomeie pelo menos um. A maioria dos bugs num teste de feature é inconsistência com uma Afirmação (o critério de aceite, citado palavra por palavra). Muitos outros são inconsistência do Produto consigo mesmo: a mesma ação funciona em outra tela. Achado que não nomeia oráculo costuma ser gosto, e vira observação no comentário.

Citar o critério palavra por palavra importa mais do que parece. O testador copia o critério para a linha "Requisito" do rascunho, e paráfrase ali vira um fato que o time nunca escreveu.

## O ambiente mente

Ambiente de teste raramente é cópia limpa da produção. No projeto de onde o harness veio, o stage produziu vários bugs falsos antes de alguém aprender a descartá-lo:

| Parecia | Era |
|---|---|
| botão que a feature cria não aparece | o front do ambiente foi construído antes da feature |
| 500 com "invalid column name" | migration que ninguém aplicou, porque nenhum serviço aplicava migration no boot |
| 403 para um perfil que deveria entrar | dado de permissão que o ambiente de referência tinha e o stage não |
| caso impossível de rodar | o tipo de registro necessário não existia ali |
| volta para o login com sessão válida | o teste começou em "/" em vez de numa rota interna |

Cada um desses teria virado issue contra uma feature que estava certa. Por isso quem verifica descarta o ambiente antes de chamar qualquer coisa de bug, e quem verifica, ao contrário do testador, pode ler código, chamar a API e olhar log para isso. A versão genérica dessa tabela está na skill, e ela cresce: cada ambiente tem a sua lista, e depois de algumas semanas ela é a página mais útil que o time tem sobre aquele ambiente.

## Charter e debrief

O session-based test management (Jonathan e James Bach) organiza teste exploratório em sessões com tempo fixo, cada uma guiada por um charter ("explore X com Y para descobrir Z") e fechada por um debrief chamado PROOF: Past, Results, Outlook, Obstacles, Feelings (o que foi feito, resultados, o que falta, obstáculos, impressões). O harness se encaixa nisso sem muita tradução. Um agente testador é uma sessão. O charter é o "Explore <área> com <perfis> para descobrir se <critérios> valem" do prompt. O prazo de 15 minutos é a duração da sessão. O relatório que o agente devolve é o debrief, e a seção de obstáculos é onde problema de ambiente aparece primeiro: dado faltando, 403 inesperado, tela com cara de mais velha que a feature.

## Relacionados

- [Como funciona](how-it-works.md): as peças e o fluxo
- [Panorama](landscape.md): a lista completa de referências
- [Referência do relatório de bug](../reference/bug-report.md): os campos que um bug verificado carrega
