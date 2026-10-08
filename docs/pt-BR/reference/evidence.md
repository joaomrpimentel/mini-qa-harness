# Arquivos de evidência

Tudo o que uma sessão grava vai para `evidenceDir` (padrão `evidence/`), uma pasta por `caseId`.

```text
evidence/
  delete-pinned/
    result.json              # gravado pelo reproduce()
    run-1/
      01-pinned-note-created.png
      02-after-delete.png
      03-after-reload.png
      evidence.json          # gravado pelo session.close()
      trace.zip              # só quando guardado, ver abaixo
    run-2/
      ...
```

## Screenshots

`NN-<label>.png`: `NN` é a ordem dentro da sessão, a partir de 1, com dois dígitos. No `<label>`, toda sequência de caracteres que não seja letra, dígito, `_`, `.` ou `-` vira `_`, e o label é cortado em 60 caracteres. A listagem da pasta se lê como os passos do caso.

## `evidence.json`

Gravado pelo `session.close()`.

| Campo | Tipo | Significado |
|---|---|---|
| `caseId` | string | o que foi passado ao `openSession` |
| `profile` | string | nome do perfil ou `anonymous` |
| `baseUrl` | string | |
| `startedAt`, `endedAt` | string ISO 8601 | |
| `verdict` | string ou null | o que foi passado ao `close()` |
| `notes` | string ou null | o que foi passado ao `close()`; o `reproduce()` passa `observed` ou `reason` |
| `trace` | `'trace.zip'` ou null | se o arquivo de trace foi guardado |
| `shots` | array | `{ file, label, url }`, com `url` passada pelo redact |
| `network` | array | ver abaixo |
| `console` | array | `{ type, text }`, só erro e aviso, `text` passado pelo redact e cortado em 500 caracteres |
| `pageErrors` | string[] | exceções não tratadas, passadas pelo redact, cortadas em 500 caracteres |

### Entradas de rede

Uma entrada por resposta que a página recebeu, menos documentos (navegação de página), URLs que não casam com nenhum padrão de `network.include` e URLs que casam com algum de `network.ignore`.

| Campo | Tipo | Significado |
|---|---|---|
| `t` | string ISO 8601 | quando a resposta foi tratada |
| `method` | string | `GET`, `POST`, ... |
| `url` | string | relativa ao `baseUrl` quando é da mesma origem, absoluta nos outros casos; passada pelo redact; cortada em 300 caracteres |
| `status` | number | status HTTP |
| `body` | string, null, ou ausente | só existe quando o status é 400 ou mais ou o método não é `GET`. Passado pelo redact, cortado em `network.bodyLimit` caracteres. `null` quando o corpo não pôde ser lido |

A entrada entra no log quando a resposta é tratada, então uma entrada que precisou ler o corpo pode cair depois de uma posterior. Ordene por `t` quando a ordem importar. Header de requisição, corpo de requisição e cookie nunca são gravados.

## `trace.zip`

Trace do Playwright, com screenshot e snapshot do DOM de cada ação, mais rede e console. Para abrir:

```bash
npx playwright show-trace evidence/delete-pinned/run-1/trace.zip
```

| Opção `trace` | `trace.zip` fica |
|---|---|
| `'off'` | nunca; o trace nem começa |
| `'retain-on-failure'` (padrão) | quando o `close()` recebe veredito que não é `'OK'` (`BUG`, `NOT_TESTED`, ...). Sem veredito: não fica |
| `'on'` | sempre |

O trace não passa pelo redact. Ele pode conter token e dado pessoal que a página viu: não anexe em issue pública sem olhar antes.

## `result.json`

Gravado pelo `reproduce()` em `<evidenceDir>/<caseId>/`.

```json
{
  "caseId": "delete-pinned",
  "profile": "admin",
  "times": 2,
  "verdict": "BUG",
  "summary": "BUG 2/2",
  "runs": [
    { "run": 1, "verdict": "BUG", "observed": "note still listed after reload; ..." },
    { "run": 2, "verdict": "BUG", "observed": "..." }
  ]
}
```

`verdict` é `OK`, `BUG` ou `NOT_TESTED` quando todas as rodadas concordam, `FLAKY` nos outros casos. Cada rodada carrega o que a função do caso devolveu além do `verdict`.

## Redact

URL, corpo, texto de console e erro de página passam pelo `redact()` antes de serem guardados. Os padrões embutidos e como acrescentar os seus: [config](config.md#padrões-de-redact-embutidos). Screenshot e trace mostram o que a página mostrou e não passam pelo redact.
