# 3. Reproduza antes de acreditar

Na página 2 uma execução disse `BUG`. Uma falha só pode vir de tempo de resposta, de dado que a execução anterior deixou para trás, ou de navegador com alguma coisa em cache. O dev que recebe o seu relato começa de um navegador limpo, então você confere de um navegador limpo primeiro.

## A ideia: k de k, em sessões novas

`reproduce(caseId, { profile, times }, fn)` roda o mesmo caso `times` vezes. Cada execução ganha navegador e sessão novos, uma pasta `run-N` própria, e precisa devolver um veredito: `OK`, `BUG` ou `NOT_TESTED`. No fim ele grava o `result.json` e devolve um resumo como `BUG 2/2`. Se as execuções discordam, o resumo vira `FLAKY 1/2`. Isso é uma observação para você investigar, não um bug para outra pessoa corrigir.

## Exemplo resolvido

`examples/delete-pinned.mjs` é o caso da página 2 dentro do `reproduce`. O que muda é a moldura:

```js
const result = await reproduce('delete-pinned', { profile: 'admin', times: 2 }, async (s, { run }) => {
  const title = `QA-demo pinned ${run}-${Date.now() % 10000}`;
  ...
  if (!stillThere) return { verdict: 'OK', observed: 'note gone after reload' };
  return { verdict: 'BUG', observed: `note still listed after reload; ...` };
});
console.log(result.summary);
```

O título da nota leva o número da execução. Assim a segunda execução nunca acha a nota que a primeira deixou e confunde com a dela.

```bash
node examples/delete-pinned.mjs
```

```text
BUG 2/2
  run 1: note still listed after reload; screen said ["Something went wrong. Please try again."]; DELETE /api/notes/5 -> 500
  run 2: note still listed after reload; screen said ["Something went wrong. Please try again."]; DELETE /api/notes/6 -> 500
```

As duas execuções falharam do mesmo jeito, do zero. Agora abra o trace da primeira:

```bash
npx playwright show-trace evidence/delete-pinned/run-1/trace.zip
```

O trace viewer lista cada ação do script. Clique numa e você vê a página como estava naquele instante, mais as abas de rede e console. O print mostra o resultado. O trace mostra como a página chegou lá, e é ele que resolve quando o print não basta para explicar a falha.

Script que quebra não é veredito sobre o app. Se um locator nunca casa, o `reproduce` grava `NOT_TESTED` com `reason: 'script-error'`, e a execução que falhou ganha um print de onde parou (`01-script-error.png` quando parou antes de qualquer outro print). Um erro de digitação como `getByPlaceholder('Titel')` dá `NOT_TESTED 2/2` depois do timeout de 30 segundos do Playwright em cada execução.

## Prática guiada (você decide)

Copie o exemplo:

```bash
cp examples/delete-pinned.mjs cases/delete-pinned-x3.mjs
```

Na cópia, troque `times: 2` por `times: 3` e o id do caso `'delete-pinned'` por `'delete-pinned-x3'`. Antes de rodar, preveja a linha de resumo e quantas pastas `run-N` vão aparecer. Depois rode `node cases/delete-pinned-x3.mjs`.

> **Esperado:** `BUG 3/3`, três linhas `run` terminando em `-> 500`, e `evidence/delete-pinned-x3/` com `run-1` a `run-3` mais o `result.json`. `BUG 2/2` quer dizer que o `times` não mudou. Execução caindo em `evidence/delete-pinned/` quer dizer que o id do caso não mudou.

Próxima: [4. Bug ou ambiente?](04-verify-and-classify.md)
