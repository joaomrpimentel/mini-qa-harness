# Configuração

`qa.config.mjs` na pasta de trabalho, ou o arquivo que a variável de ambiente `QA_CONFIG` indicar. É um módulo JavaScript cujo export default é um objeto. Sem o arquivo, valem os padrões abaixo e nenhum perfil existe. Quem carrega é `loadConfig()`, em `src/config.mjs`.

```js
import { storageState } from 'mini-qa-harness';
export default {
  baseUrl: 'https://staging.example.com',
  startPath: '/dashboard',
  profiles: { admin: { auth: storageState('.qa/auth/admin.json') } },
};
```

## Chaves

| Chave | Tipo | Padrão | Significado |
|---|---|---|---|
| `baseUrl` | string | `'http://localhost:4173'` | Raiz do app testado. A `/` do fim é removida. Caminho relativo em `session.goto()` é somado a ele, e as URLs de rede na evidência são gravadas relativas a ele. |
| `startPath` | string | `'/'` | Onde começam as sessões, o `qa smoke`, o `qa login` e o `qa jam smoke`. Use uma rota interna quando `/` manda para o login. |
| `viewport` | `{ width, height }` | `{ width: 1440, height: 900 }` | Viewport de toda sessão. A janela do Jam tem esse tamanho mais 100 px de altura. |
| `locale` | string | `'en-US'` | Locale do browser. |
| `headless` | boolean | `true` | Sessão headless. Não vale para o `openJam`, que tem a própria opção `headless`. |
| `channel` | string ou undefined | `undefined` | Canal do browser do Playwright para sessões e ajudantes do GitHub. `undefined` é o Chromium que vem com o Playwright. O Jam usa sempre `'chromium'`. |
| `evidenceDir` | string | `'evidence'` | Onde as sessões gravam screenshots, `evidence.json`, `trace.zip` e `result.json`. Vira caminho absoluto. |
| `workDir` | string | `'.qa'` | Estado local que não entra no git: `jam-ext/`, `jam-profile/`, `gh-profile/` e, por convenção, logins gravados e segredos. Vira caminho absoluto. |
| `dataPrefix` | string | `'QA-'` | Prefixo de todo registro que um teste cria. Quem lê são as pessoas e os agentes (a skill e o prompt do testador); a biblioteca não força. |
| `network.include` | RegExp[] | `[/./]` | A resposta só é gravada se a URL completa casar com pelo menos um padrão. |
| `network.ignore` | RegExp[] | arquivos estáticos | A resposta é pulada se a URL casar com algum padrão. O padrão pula `.js .mjs .css .map .png .jpg .jpeg .gif .svg .ico .webp .woff .woff2 .ttf`. Configurar substitui o padrão. |
| `network.bodyLimit` | number | `800` | Máximo de caracteres do corpo de resposta guardado por entrada. |
| `redact` | RegExp[] | `[]` (somado aos embutidos) | Padrões a mais apagados de URL, corpo, texto de console e erro de página. Use a flag `g`. Sempre somados à lista embutida, nunca no lugar dela. |
| `profiles` | object | `{}` | Mapa de nome de perfil para `{ auth, ...qualquer coisa }`. Ver abaixo. |
| `github.issueRefRepo` | string | `''` | Quando preenchido (`'owner/repo'`), o `qa issue render` troca `#123` solto por `owner/repo#123`. |

`network` e `github` são mesclados chave a chave com o padrão, então `network: { include: [/\/api\//] }` mantém o `ignore` e o `bodyLimit` padrão.

## Perfis

```js
profiles: {
  admin:  { auth: storageState('.qa/auth/admin.json'), about: 'acesso total' },
  viewer: { auth: cookie({ name: 'session', value: fromEnv('QA_VIEWER_TOKEN') }) },
}
```

| Campo | Tipo | Significado |
|---|---|---|
| `auth` | adaptador ou `null` | Aplicado a todo contexto novo do perfil. Ver [adaptadores de auth](api.md#adaptadores-de-auth). |
| qualquer outro | qualquer | Fica no objeto do perfil e a biblioteca ignora. `about` é convenção para descrever o papel aos agentes. |

Sessão aberta sem perfil é `anonymous`, sem auth. Nome de perfil desconhecido lança `unknown profile "<name>". Known: <nomes>`.

## Padrões de redact embutidos

Aplicados sempre antes de qualquer coisa ir para o disco, nesta ordem, e depois os padrões de `redact`:

| Padrão | Entrada | Gravado como |
|---|---|---|
| JWT, `eyJ...` com três partes separadas por ponto | `eyJhbGciOi...c2ln` | `[REDACTED]` |
| `Bearer <token>`, sem diferenciar maiúscula | `Authorization: Bearer abc.def` | `Authorization: Bearer [REDACTED]` |
| valor de `token`, `access_token`, `api_key`, `key`, `password` na query | `/cb?token=s3cret&x=1` | `/cb?token=[REDACTED]&x=1` |

Header de requisição e cookie nunca são gravados.
