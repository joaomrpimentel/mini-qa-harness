# API

Tudo sai de `mini-qa-harness` (`src/index.mjs`). Só ES modules, Node 20 ou mais novo.

```js
import { openSession, reproduce, cookie, jwtHs256, openJam } from 'mini-qa-harness';
```

Função que recebe `config` carrega o `qa.config.mjs` com `loadConfig()` quando ele não é passado.

## Config

### `loadConfig(path?)`

`path` padrão: `process.env.QA_CONFIG` ou `'qa.config.mjs'`. Devolve o config mesclado ([chaves](config.md)), com `baseUrl` sem a barra do fim, `workDir` e `evidenceDir` absolutos, e `redact` = embutidos mais os do usuário.

### `redact(config, text)`

Devolve `text` como string, com cada padrão de `config.redact` trocado por `[REDACTED]`. Um prefixo capturado pelo primeiro grupo do padrão (como `Bearer `) fica.

## Adaptadores de auth

Adaptador é `{ kind, apply(context, env) }`. O `apply` roda num `BrowserContext` novo do Playwright antes da primeira navegação, com `env = { config, profile }`. O mesmo adaptador serve para sessão normal e para o contexto persistente do Jam.

Um **valor** é string ou função `(env) => string | Promise<string>`, chamada cada vez que um contexto é criado.

| Função | Devolve | Faz |
|---|---|---|
| `cookie({ name, value, domain?, path = '/', secure?, httpOnly = true, sameSite = 'Lax' })` | adaptador, `kind: 'cookie'` | `context.addCookies` com um cookie. `domain` padrão é o host do `baseUrl`; `secure` padrão é `true` quando o `baseUrl` é `https:`. |
| `header({ name = 'Authorization', value, prefix = 'Bearer ', origins })` | adaptador, `kind: 'header'` | põe `name: prefix + value` por `context.route`, só nas requisições cuja origem está em `origins` (padrão: a origem do `baseUrl`). |
| `storageState(path)` | adaptador, `kind: 'storageState'`, mais `path` | Lê um arquivo de storage state do Playwright: põe os cookies e, por um init script, as entradas de localStorage de cada origem. Lança `no saved login at <path>. Run: npx qa login <profile>` se o arquivo não existe. |
| `combine(...adapters)` | adaptador, `kind: 'combine'` | Aplica cada adaptador em ordem. |

### Provedores de valor

| Função | Devolve um valor que |
|---|---|
| `fromEnv(name)` | lê `process.env[name]`; lança `environment variable <name> is empty` se não existe ou está vazia |
| `fromFile(path)` | lê o arquivo como UTF-8, sem espaço nas pontas |
| `fromCommand(cmd, args = [])` | roda o comando (sem shell) e usa a stdout sem espaço nas pontas |
| `jwtHs256({ secret, claims, ttlSeconds = 1200 })` | assina um JWT HS256. `secret` e `claims` são valores (string/objeto ou função). `iat` e `nbf` são agora, `exp` é agora + `ttlSeconds`; eles sobrescrevem campo de mesmo nome em `claims`. |

## Sessões

### `openSession({ profile?, caseId = 'session', trace = 'retain-on-failure', config? })`

Sobe o Chromium (`config.headless`, `config.channel`), cria um contexto com `viewport` e `locale`, aplica o auth do perfil, abre uma página e começa a gravar. A evidência vai para `<evidenceDir>/<caseId>/`, criada na abertura. `caseId` pode ter `/` para aninhar pastas.

`trace`: `'off'`, `'on'` (guarda o `trace.zip` sempre) ou `'retain-on-failure'` (guarda só quando o `close()` recebe veredito diferente de `'OK'`). O trace inclui screenshots e snapshots do DOM.

Devolve a sessão `s`:

| Membro | Tipo | Significado |
|---|---|---|
| `s.page`, `s.context`, `s.browser` | objetos do Playwright | |
| `s.config` | object | o config carregado |
| `s.profile` | string | nome do perfil, ou `'anonymous'` |
| `s.dir` | string | pasta de evidência, absoluta |
| `s.network` | array | log de rede ao vivo, ver [evidência](evidence.md#entradas-de-rede) |
| `s.console` | array | `{ type: 'error' \| 'warning', text }` |
| `s.pageErrors` | string[] | exceções da página não tratadas |
| `s.shots` | array | `{ file, label, url }` por screenshot |
| `await s.goto(path = startPath)` | | navega para `baseUrl + path` (ou `path`, se começar com `http`) e espera `networkidle` |
| `await s.shot(label, opts?)` | string | screenshot `NN-<label>.png`, devolve o caminho. `opts` vai para `page.screenshot` (ex.: `{ fullPage: true }`) |
| `s.mark()` | number | tamanho atual de `s.network` |
| `s.since(mark, { all = false }?)` | array | entradas de rede depois da marca; sem `all`, só as que não são GET ou têm status 400 ou mais |
| `await s.messages()` | string[] | textos internos, aparados e não vazios, dos elementos que casam com `[role=status]`, `[role=alert]`, `[role=alertdialog]`, `[role=dialog]` e classes com `toast`, `snackbar` ou `notification` |
| `await s.close({ verdict?, notes? }?)` | object | para o trace, grava o `evidence.json`, fecha o browser, devolve o objeto de evidência |

### `reproduce(caseId, { profile?, times = 2, config?, trace? }, fn)`

Roda `fn(s, { run })` `times` vezes, cada uma numa sessão nova com `caseId` `<caseId>/run-<n>`. `fn` tem que devolver `{ verdict, ...qualquer coisa }` com `verdict` em `VERDICTS` (`'OK'`, `'BUG'`, `'NOT_TESTED'`). Se `fn` lança erro ou devolve outro veredito, aquela rodada vira `{ verdict: 'NOT_TESTED', reason: 'script-error', observed: <mensagem> }` e tenta um screenshot `script-error`. Cada sessão fecha com `verdict` e `notes` = `observed`, senão `reason`, senão `null`.

Devolve, e grava em `<evidenceDir>/<caseId>/result.json`:

```js
{ caseId, profile, times, verdict, summary, runs: [{ run, verdict, ...o que fn devolveu }] }
```

`verdict` é o da primeira rodada quando todas concordam, senão `'FLAKY'`. `summary` é `'<verdict> <iguais>/<times>'`, por exemplo `'BUG 2/2'` ou `'FLAKY 1/2'`.

### `newContext(browser, config, profile, extra?)` e `record(page, config)`

Peças de baixo nível do `openSession`. `newContext` cria um contexto com viewport, locale e as opções de `extra` e aplica `profile.auth` (`profile` é `{ name, auth }`). `record` liga numa página os gravadores de rede, console e erro de página e devolve `{ network, console, pageErrors }`.

## Cursor

| Função | Faz |
|---|---|
| `showCursor(context, { hostIncludes? }?)` | põe um init script que desenha uma seta seguindo o mouse e um pulso vermelho a cada mousedown. A posição fica no sessionStorage, então sobrevive à navegação e ao F5. Com `hostIncludes`, só em host que contém aquela string. Chame antes da primeira navegação. |
| `humanClick(page, locator, { pause = 350 }?)` | rola o alvo para a tela, leva o mouse da última posição do cursor até o centro dele em 12 a 40 passos, espera `pause` ms, clica. Cai para `locator.click()` quando o alvo não tem bounding box. |
| `humanType(page, locator, text, { delay = 60 }?)` | `humanClick` no alvo, depois `pressSequentially(text, { delay })`. |

## Jam

`JAM_EXTENSION_ID` é `'iohjgamcilhbgmhbnllfolmkmmekfmci'`.

### `setupJam(config)`

Baixa o CRX da extensão pelo endpoint de atualização da Chrome Web Store, tira o cabeçalho CRX3, descompacta em `<workDir>/jam-ext` (precisa do comando `unzip`), apaga `_metadata`, acrescenta `host_permissions: ["<all_urls>"]` no manifest. Devolve `{ ext, version }`.

### `openJam({ profile?, headless = true, config? })`

Sobe um contexto persistente do Chromium (canal `'chromium'`, pasta de perfil `<workDir>/jam-profile`) com a extensão carregada, aplica o auth do perfil, espera até 15 s pelo service worker da extensão e começa a gravar rede e console na primeira página. Lança `Jam extension missing. Run: npx qa jam setup` sem `jam-ext`.

Devolve:

| Membro | Significado |
|---|---|
| `context`, `page`, `sw` | contexto persistente, primeira página, service worker da extensão |
| `network`, `console` | gravadores, no mesmo formato da sessão |
| `await focusApp()` | fecha as abas que não são do app nem da extensão e ativa a aba do app (a que tem o host do `baseUrl` na URL) |
| `await openPopup()` | abre o popup da extensão como aba em segundo plano na janela do app e devolve a página dele |
| `await popupText()` | foca o app, abre o popup, devolve o texto dele e fecha |
| `await start()` | clica em `Record Tab` no popup, espera 4,5 s pela contagem regressiva |
| `await stopAndCreate(title, description)` | clica em `Stop Recording`, preenche título e descrição na prévia (frame `iui.html`), clica em `Create`, devolve os links `jam.dev/c/...` únicos achados nas páginas e frames. Array vazio: nenhum link foi criado. |
| `await close()` | fecha o contexto |

`loginJam(config)` abre uma janela visível em `jam.dev/login` com a extensão carregada e resolve quando a janela fecha (é o que o `qa jam login` roda).

## GitHub

As duas usam o perfil persistente de browser em `<workDir>/gh-profile`, logado com `qa gh login`.

| Função | Devolve | Faz |
|---|---|---|
| `loginGitHub(config)` | login | abre uma janela visível em `github.com/login` nesse perfil, confere a cada 5 s por até 15 min se o login aconteceu, devolve o login |
| `uploadToGitHub(config, repo, files)` | `{ [basename]: url }` | abre `github.com/<repo>/issues/new` headless, solta cada arquivo na textarea, espera até 60 s por uma URL `github.com/user-attachments/(assets\|files)/...`, limpa a textarea; nunca submete. Lança `GitHub profile is not signed in. Run: npx qa gh login` quando cai no login. MIME pela extensão: png, jpg, jpeg, gif, webp, mp4. |
| `checkIssueImages(config, url)` | `{ images, loaded }` | abre a página, espera 6 s, conta os elementos `.markdown-body img` e quantos terminaram de carregar com largura maior que zero |

## Relatórios

| Função | Devolve | Faz |
|---|---|---|
| `renderIssue(markdown, { urls = {}, issueRefRepo = '' }?)` | `{ title, body }` | ver abaixo |
| `renderIssueFile(path, opts?)` | `{ title, body }` | `renderIssue` no conteúdo do arquivo |
| `draftImages(markdown)` | string[] | alvos de `![...](...)` que não começam com `http://` ou `https://` |

Passos do `renderIssue`: tira o BOM e o bloco de frontmatter `---` do começo; pega a primeira linha, que tem que ser `# <título>` (senão lança `draft must start with a "# Title" line`); em todo link ou imagem Markdown cujo alvo não é `http(s)`, troca o alvo por `urls[basename(alvo)]` quando existe; lança `images without uploaded URL: <alvos>` se sobrar imagem local; com `issueRefRepo`, troca `#<dígitos>` que não vem depois de letra, dígito ou `/` por `<issueRefRepo>#<dígitos>`; `body` termina com uma quebra de linha.
