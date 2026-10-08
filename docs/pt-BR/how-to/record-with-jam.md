# Como gravar um bug com o Jam

Um link do [Jam](https://jam.dev) dá ao dev o vídeo da reprodução com as requisições de rede e o console do lado. O harness dirige a extensão do Jam dentro do Chromium do Playwright, porque o Jam não tem API pública para criar gravação. Grave só bug que já está `BUG k/k` e verificado.

## 1. Prepare uma vez

```bash
npx qa jam setup     # baixa a extensão para .qa/jam-ext e corrige o manifest
npx qa jam login     # abre uma janela em jam.dev/login; logue e feche a janela
npx qa jam smoke     # tem que imprimir um texto de popup com "Record Tab"
```

O `qa jam smoke` aceita um perfil (`npx qa jam smoke admin`). Se ele terminar com `popup does not offer "Record Tab": signed in? run qa jam login`, a sessão do Jam em `.qa/jam-profile` sumiu ou venceu. O `qa jam setup` precisa do comando `unzip` na máquina.

## 2. Escreva o script da gravação

Copie `examples/jam-record.mjs` e troque só o trecho entre `jam.start()` e `jam.stopAndCreate(...)`.

```js
const jam = await openJam({ profile: 'admin' });
const { page } = jam;
await showCursor(jam.context);            // antes da primeira navegação
await page.goto('https://staging.example.com/orders', { waitUntil: 'networkidle' });

await jam.start();
await humanClick(page, page.getByRole('button', { name: 'Cancel order' }));
await humanClick(page, page.getByRole('button', { name: 'Yes, cancel' }));
await page.waitForTimeout(2500);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const links = await jam.stopAndCreate(title, description);
```

- Crie o dado que o bug precisa antes do `start()`, com um `openSession` normal. O vídeo mostra só a reprodução.
- Navegue até o app antes do `start()`: a extensão grava a aba do app, e o `start()` falha com `app tab not found` se não houver uma.
- No trecho gravado use `humanClick` e `humanType`, não `locator.click()` nem `fill()`. Chromium headless não desenha cursor; com `showCursor` e os ajudantes, o vídeo mostra o mouse indo até cada alvo e um pulso vermelho a cada clique.
- Termine no estado depois de um F5, para o vídeo provar se o resultado ficou ou não.

## 3. Escreva título e descrição

Eles contam o bug para um dev que vai reproduzir: o que falha, em que dado e tela, o que a tela e a rede mostram, o esperado, a issue. Não citam agente, automação, script nem browser headless.

> **Excluir uma nota fixada retorna 500 e a nota continua na lista**
>
> O admin exclui a nota fixada "QA-demo jam". A confirmação chama DELETE /api/notes/{id}, que retorna 500 sem corpo. A tela mostra "Something went wrong. Please try again." Depois do F5 a nota continua na lista. Esperado: a nota sai, ou uma mensagem explica que nota fixada precisa ser desafixada antes.

## 4. Rode

```bash
node grava-bug-1.mjs "<título>" "<descrição>"
```

O script imprime o link `https://jam.dev/c/...`. Resultado vazio quer dizer que o Jam ficou como rascunho local na extensão. O Jam fica na conta logada; ponha o link como primeiro item de Evidências no rascunho do bug.

## Quando dá errado

| Sintoma | Causa | Conserto |
|---|---|---|
| `Jam extension missing. Run: npx qa jam setup` | `.qa/jam-ext` não existe | `npx qa jam setup` |
| Popup parado em "Starting Jam" | a extensão não tem permissão de host e espera clique real no ícone | rode `qa jam setup` de novo, ele acrescenta `host_permissions: ["<all_urls>"]` |
| `app tab not found; navigate the page before recording` | nenhuma aba no host do `baseUrl` | `page.goto(...)` no app antes do `jam.start()` |
| `Jam preview (iui.html) did not open after Stop Recording` | o Jam mudou a prévia, ou o clique de parar não pegou | rode uma vez com `openJam({ headless: false })` e olhe os frames |
| Sem link, popup diz "drafts unfinished" | o `Create` não foi clicado | igual ao de cima; o texto da prévia pode ter mudado |
| Vídeo espremido, com faixa preta | rodou com janela num gerenciador de janelas em tile | mantenha o padrão `headless: true` |

Os seletores ficam em `src/jam.mjs`: os textos do popup `Record Tab` e `Stop Recording`, e `Title`/`Create` dentro do frame `iui.html`. Versão do Jam que renomear um deles quebra este módulo primeiro.

## Relacionados

- [Referência da API: Jam](../reference/api.md#jam)
- [Postar no GitHub](post-to-github.md)
