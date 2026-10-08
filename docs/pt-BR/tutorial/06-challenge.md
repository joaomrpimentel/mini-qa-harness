# 6. Desafio

Nesta página não há exemplo resolvido nem comando para copiar. Tudo o que você precisa veio das páginas 1 a 5.

## O requisito

O app de notas tem uma segunda regra:

> Viewers can read notes but cannot delete them. (Quem tem perfil viewer lê as notas, mas não exclui.)

Descubra se ela vale, do jeito que você fez com o admin. Parte das escolhas é sua, e isso faz parte do teste.

## O que entregar

- Um arquivo de caso seu em `cases/`, rodado com `reproduce` e pelo menos `times: 2`
- O caso roda com o perfil de que o requisito fala
- O veredito sai do que a tela e as requisições da própria página mostraram, nunca de chamada sua à API
- O caso só mexe em dado que ele mesmo criou. `Welcome` e `Groceries` são de outra pessoa
- Se o veredito for `BUG`, um rascunho `bugs/BUG-2.md` a partir do template, com requisito, passos, esperado, atual e evidência

## Como é conferido

Por estado final: o que está em `evidence/` e no app, não o que você digitou.

```bash
node examples/check-challenge.mjs
```

A conferência passa quando algum caso em `evidence/` rodou com o perfil certo, chegou ao mesmo veredito em todas as execuções, tem esse veredito sustentado pelo log de rede de cada execução, e deixou em paz o dado que não criou. Quando falha, ela diz o que falta e onde olhar, não qual é a resposta. Leia a mensagem, olhe os seus prints e rode de novo.

Se você excluiu uma nota que não criou, pare a demo e suba de novo (`node demo/server.mjs`), o que zera os dados, e corrija o caso para ele criar a própria nota.

> Quando a conferência disser `DONE`, apague o que o tutorial criou: `rm -rf evidence bugs cases`. Reiniciar a demo limpa as notas, inclusive as `QA-demo` fixadas que, como você já sabe, o app não deixa excluir.

> O rascunho `bugs/BUG-2.md` é o que você entregaria a uma pessoa para revisar. A [skill mini-qa](../how-to/run-with-claude-code.md) roda esse mesmo ciclo com agentes testadores de LLM, vários ao mesmo tempo, e mantém a revisão: nada é postado sem uma pessoa mandar. [Como funciona](../explanation/how-it-works.md) explica por quê.
