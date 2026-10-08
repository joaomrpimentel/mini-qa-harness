# Como escrever um ajudante de tela

Um agente testador com prazo de 15 minutos pode gastar metade dele procurando o botão certo. O ajudante de tela guarda os seletores que o primeiro agente descobriu numa tela, e o próximo agente naquela tela começa deles.

## Quando

Depois do primeiro caso que passa por uma tela, a partir do script daquele caso. Não escreva ajudante adiantado para tela que ninguém testou.

## 1. Crie o arquivo

Um arquivo por tela, em `helpers/`, com o nome da tela: `helpers/notes.mjs`, `helpers/orders.mjs`. Exporte a rota e funções pequenas que recebem a `page` do Playwright (ou a sessão, para navegar):

```js
// Ajudante da tela /notes. Seletores do caso delete-pinned.
export const ROUTE = '/notes';

export async function open(s) {
  await s.goto(ROUTE);
}

export function card(page, title) {
  return page.locator('article').filter({ hasText: title });
}

// Clica em Delete e confirma. Não confere o resultado.
export async function remove(page, title) {
  await card(page, title).getByRole('button', { name: 'Delete note' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await page.waitForTimeout(800);
}
```

O exemplo completo para o app demo é `examples/helpers/notes.mjs`.

## 2. Anote o que custou uma rodada para achar

No topo do arquivo, liste o que não é óbvio olhando a tela: a rota por onde começar, um nome acessível diferente do texto visível (`Delete note` contra `Delete`), um diálogo de confirmação que segura a requisição, um controle que só alguns papéis veem. Essas linhas economizam mais tempo que as funções.

## 3. Ajudante não julga

- Use papel, label e texto visível (`getByRole`, `getByLabel`, `getByText`), como os agentes. Nada de classe CSS gerada no build.
- O ajudante age; quem confere é o caso. "Excluiu" é o veredito do caso, e um ajudante que esconde falha transforma bug em OK.
- Sem dado de teste dentro do ajudante, a não ser registro fixo criado para teste e anotado como tal.

## 4. Entregue aos agentes

Uma linha no prompt do testador: `Use helpers/notes.mjs for selectors.` Quando um agente achar seletor que falta no ajudante, ou um que mudou, acrescente no arquivo depois da rodada.

## Relacionados

- [Rodar com o Claude Code](run-with-claude-code.md)
- [Referência da API](../reference/api.md)
