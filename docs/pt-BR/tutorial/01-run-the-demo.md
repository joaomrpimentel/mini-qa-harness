# 1. Suba a demo e entre com duas pessoas

Este tutorial leva uns 45 minutos. Você sobe o app de notas que vem no repo, que tem bugs plantados, e na última página já achou um deles sozinho, com evidência que um dev consegue usar. Cada página ensina uma coisa e termina com algo para você rodar e um bloco **Esperado** dizendo o que deve aparecer.

| Página | Você aprende a |
|---|---|
| 1 (esta) | subir a demo e conferir que cada perfil de teste entra |
| [2](02-your-first-case.md) | escrever um caso de teste que guarda a própria evidência |
| [3](03-reproduce.md) | repetir uma falha em sessão nova antes de acreditar nela |
| [4](04-verify-and-classify.md) | separar bug de problema do ambiente |
| [5](05-write-the-report.md) | transformar a evidência em rascunho de bug |
| [6](06-challenge.md) | achar um bug sem instrução, conferido por script |

Precisa de Node 20 ou mais novo e de ler um arquivo curto de JavaScript sem susto. Já ter usado Playwright ajuda, mas não é requisito.

## Preparar

Clone o repo, instale as dependências e baixe o navegador que o Playwright dirige:

```bash
npm install
npx playwright install chromium
```

Suba a demo num terminal só dela e deixe rodando:

```bash
node demo/server.mjs
```

```text
demo notes app on http://localhost:4173  (users: admin/demo, viewer/demo)
```

## A ideia: perfil é uma pessoa que o harness consegue ser

Teste de permissão precisa de mais de uma pessoa. O harness chama cada uma de **perfil**: um nome e um jeito de entrar sem digitar nada. Abra o `qa.config.mjs` na raiz do repo. Ele tem dois perfis, `admin` e `viewer`, e os dois entram do mesmo jeito, com um cookie de sessão posto no navegador antes da primeira página carregar:

```js
profiles: {
  admin: { auth: demoSession('admin', 'admin'), about: 'creates and deletes notes' },
  viewer: { auth: demoSession('viewer', 'viewer'), about: 'reads notes only' },
},
```

Repare em duas coisas. O nome do perfil é o que você passa para toda sessão daqui em diante. E `startPath: '/notes'` é a página que cada sessão abre primeiro. O seu app vai entrar de outro jeito, e [Configurar a autenticação do seu app](../how-to/configure-auth.md) mostra as outras formas.

## Exemplo resolvido: o smoke

`qa smoke` abre o `startPath` uma vez por perfil, tira um print e lista toda requisição que falhou:

```bash
node bin/qa.mjs smoke
```

```text
admin        /notes  errors: none  <repo>/evidence/smoke/admin/01-start.png
viewer       /notes  errors: none  <repo>/evidence/smoke/viewer/01-start.png
```

Leia coluna por coluna: o perfil, a página onde ele parou, as requisições que falharam, o print. Perfil que parou em `/login` não entrou. Linha com erro quer dizer que o app não está saudável o bastante para teste, e nada depois desta página vale a pena até isso ser resolvido.

## Prática guiada (você decide)

Abra os dois prints. Antes de olhar, decida qual perfil deve ver o formulário **New note**, pelo que diz o `about`. Depois rode o smoke de um perfil só, e de um perfil que não existe:

```bash
node bin/qa.mjs smoke viewer
node bin/qa.mjs smoke editor
```

> **Esperado:** o primeiro comando imprime só a linha do `viewer`. O segundo imprime `qa: unknown profile "editor". Known: admin, viewer` e sai com código 1. Se aparecer `net::ERR_CONNECTION_REFUSED at http://localhost:4173/notes`, a demo não está rodando: suba de novo no terminal dela.

Próxima: [2. Seu primeiro caso de teste](02-your-first-case.md)
