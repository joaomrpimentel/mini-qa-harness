# 2. Seu primeiro caso de teste

Na página 1 os dois perfis entraram. Agora um deles faz alguma coisa, e o harness guarda a prova.

## A ideia: a sessão registra o que a página fez

`openSession` devolve uma página do Playwright já logada que anota sozinha cada requisição de API que a página faz, cada erro de console e cada print que você pedir. Você nunca chama a API por conta própria. O que vai para a evidência é o que a tela fez de verdade quando alguém clicou, e é disso que um relato de bug precisa.

Um caso tem quatro partes com nome. Mantenha esta ordem e todo caso que você escrever se lê do mesmo jeito:

1. **Preparar**: criar o dado que o caso precisa, com nome `QA-`, para nunca mexer em nota de outra pessoa
2. **Agir**: fazer o que o requisito descreve, por botão e campo
3. **Conferir**: confirmar o resultado pela tela, depois de recarregar
4. **Fechar**: gravar a evidência em disco

## Exemplo resolvido

O requisito é "An admin can delete any note" (um admin consegue excluir qualquer nota). Abra `examples/first-case.mjs`. Três chamadas carregam o caso:

- `s.shot('rotulo')` grava `01-rotulo.png`, `02-rotulo.png` e assim por diante, e a pasta fica legível como a sequência de passos
- `s.mark()` guarda o tamanho do log de rede logo antes do clique, e `s.since(mark)` devolve só o que aquele clique causou, sem os `GET` que deram certo
- `s.close({ verdict })` grava o `evidence.json` e fecha o navegador

```js
// 3. Act: delete it, and remember where the network log was before the click.
const m = s.mark();
await card.getByRole('button', { name: 'Delete note' }).click();
await p.getByRole('button', { name: 'Yes, delete' }).click();
...
// 4. Assert through the screen: reload and look for the note.
await p.reload({ waitUntil: 'networkidle' });
const stillThere = await p.locator('article').filter({ hasText: title }).count();
```

Rode:

```bash
node examples/first-case.mjs
```

```text
screen said: [ 'Note deleted.' ]
requests: [ 'DELETE /api/notes/3 -> 204' ]
verdict: OK
```

Agora `evidence/first-case/` tem três prints e o `evidence.json`. Abra o JSON: em `network` estão o `POST` que criou a nota e o `DELETE` que a removeu, cada um com o status. É nesse arquivo que quem verifica vai olhar depois, então vale se acostumar a lê-lo.

## Prática guiada (você decide)

O exemplo cria uma nota que não está fixada. Copie e mude só isso:

```bash
mkdir -p cases
cp examples/first-case.mjs cases/my-first-case.mjs
```

Em `cases/my-first-case.mjs`, ponha `const PINNED = true;` e troque `caseId: 'first-case'` por `caseId: 'my-first-case'`. Antes de rodar, anote o veredito que você espera. Depois rode `node cases/my-first-case.mjs`.

> **Esperado:** `screen said: [ 'Something went wrong. Please try again.' ]`, `requests: [ 'DELETE /api/notes/4 -> 500' ]` (o id pode mudar) e `verdict: BUG`. A pasta `evidence/my-first-case/` tem ainda um `trace.zip` que a primeira execução não teve: a sessão só guarda o trace do Playwright quando o veredito não é OK.

Você achou alguma coisa. Ainda não relate: uma execução prova muito pouco, e a página 3 explica por quê.

Próxima: [3. Reproduza antes de acreditar](03-reproduce.md)
