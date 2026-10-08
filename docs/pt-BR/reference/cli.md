# CLI

`qa` (`bin/qa.mjs`). Rode como `npx qa <comando>` num projeto que depende do harness, ou `node bin/qa.mjs <comando>` num clone. Todo comando lê primeiro o `qa.config.mjs` (ou `QA_CONFIG`). Sem comando, ou com comando desconhecido, imprime a ajuda e sai com 0. Erro imprime `qa: <mensagem>` e sai com 1.

| Comando | Faz | Grava | Saída |
|---|---|---|---|
| `qa init` | copia `qa.config.example.mjs` para `qa.config.mjs` se ele não existe; acrescenta `.qa/` e `evidence/` ao `.gitignore` se faltarem | `qa.config.mjs`, `.gitignore` | 0 |
| `qa smoke [perfil...]` | para cada perfil (todos os configurados quando nenhum é passado, `anonymous` quando nenhum está configurado): abre o `startPath`, espera 800 ms, tira um screenshot, imprime uma linha | `evidence/smoke/<perfil>/01-start.png`, `evidence.json` | 1 se algum perfil viu `401` ou `5xx`. Os outros 4xx (um `403` de um perfil com menos acesso, por exemplo) aparecem na lista mas não falham |
| `qa login <perfil>` | abre um browser visível em `baseUrl + startPath`, espera Enter no terminal, grava o storage state | o caminho do `storageState` do perfil | 1 se o perfil não usa `storageState()` |
| `qa jam setup` | baixa e corrige a extensão do Jam | `.qa/jam-ext/` | 0 |
| `qa jam login` | abre um Chromium visível com a extensão em `jam.dev/login`; volta quando a janela fecha, ou depois de 25 minutos | `.qa/jam-profile/` | 0 |
| `qa jam smoke [perfil]` | abre o `startPath` no browser do Jam, imprime os primeiros 160 caracteres do texto do popup | | 1 se o texto do popup não tem `Record Tab` |
| `qa gh login` | abre um browser visível em `github.com/login`, imprime `signed in as <login>` quando loga; desiste depois de 15 minutos | `.qa/gh-profile/` | 1 se o tempo acabar |
| `qa gh upload <owner/repo> <arquivo...>` | sobe os arquivos como anexo, imprime JSON `{ "arquivo": "url" }` | | 1 se falhar |
| `qa issue render <rascunho.md> [--upload <owner/repo>] [--out <arquivo>]` | com `--upload`, sobe toda imagem local citada no rascunho (caminho resolvido a partir da pasta do rascunho); monta título e corpo; imprime o título | `--out`, padrão `body.md` | 1 se sobrar imagem local sem URL |
| `qa gh check <url-da-issue>` | imprime `images N, loaded M` | | 1 se `M < N` |

## Saída do `qa smoke`

Uma linha por perfil:

```text
admin        /notes  errors: none  /caminho/evidence/smoke/admin/01-start.png
```

Colunas: nome do perfil completado até 12 caracteres, caminho final relativo ao `baseUrl`, até cinco entradas distintas `status MÉTODO url` com status 400 ou mais (ou `none`), caminho do screenshot. Caminho final diferente do `startPath` (por exemplo `/login`) quer dizer que o perfil não logou.

As sessões do smoke rodam com `trace: 'off'`.
