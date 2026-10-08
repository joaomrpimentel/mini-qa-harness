# Como logar cada perfil de teste

Perfil é um nome no `qa.config.mjs` com um adaptador de auth. Toda sessão aberta com aquele perfil já começa logada, então o agente nunca digita senha. Critério de permissão pede um perfil por papel.

## 1. Escolha o adaptador

| O app loga por | Use |
|---|---|
| SSO, MFA, captcha, ou um login que você prefere não automatizar | `storageState(path)`, gravado uma vez à mão com `qa login` |
| Cookie de sessão cujo valor você consegue obter (variável de ambiente, arquivo, comando) | `cookie({ name, value })` |
| Header `Authorization` (SPA que guarda o token em memória) | `header({ value })` |
| JWT que você tem permissão de assinar num ambiente de teste | `cookie` ou `header` com `value: jwtHs256({...})` |
| Mais de um dos acima (cookie e um header de feature flag) | `combine(a, b, ...)` |

## 2a. Gravar um login à mão (`storageState`)

1. Declare o perfil:

   ```js
   import { storageState } from 'mini-qa-harness';
   export default {
     baseUrl: 'https://staging.example.com',
     startPath: '/dashboard',
     profiles: {
       admin: { auth: storageState('.qa/auth/admin.json') },
     },
   };
   ```

2. Rode `npx qa login admin`. Abre uma janela em `baseUrl + startPath`.
3. Logue com o usuário de teste admin, volte ao terminal e aperte Enter. Os cookies e o localStorage daquela janela vão para `.qa/auth/admin.json`.
4. Confira: `npx qa smoke admin` tem que mostrar o caminho inicial e `errors: none`.

Repita para cada perfil. Quando a sessão vencer, rode `qa login` de novo. Só cookie e localStorage voltam; app que guarda a sessão no sessionStorage precisa de `cookie` ou `header`.

## 2b. Mandar cookie ou header

O valor pode ser string ou provedor, e aí o token é lido quando a sessão abre, não copiado uma vez no começo:

```js
import { cookie, header, fromEnv, fromFile, fromCommand } from 'mini-qa-harness';

profiles: {
  viewer: { auth: cookie({ name: 'session', value: fromEnv('QA_VIEWER_TOKEN') }) },
  api:    { auth: header({ value: fromFile('.qa/secrets/api.token') }) },
  ops:    { auth: header({ value: fromCommand('gcloud', ['auth', 'print-identity-token']) }) },
}
```

Padrões do `cookie`: `domain` é o host do `baseUrl`, `path` é `/`, `secure` segue o protocolo do `baseUrl`, `httpOnly` é `true`, `sameSite` é `Lax`. Se o app lê o cookie num domínio pai dividido por vários subdomínios (front em `app.example.com`, API em `api.example.com`), use `domain: '.example.com'`, e `sameSite: 'None'` com `secure: true` quando a requisição for entre sites.

O `header` manda `<name>: <prefix><value>`, com `name` `Authorization` e `prefix` `Bearer ` por padrão. O header só vai para a origem do `baseUrl`; requisição para CDN e outros hosts sai sem ele. Se a API mora em outra origem, liste: `header({ value, origins: ['https://api.example.com'] })`.

## 2c. Gerar um token por sessão (`jwtHs256`)

Só contra ambiente de teste cuja chave de assinatura você tem permissão de guardar. Dá um perfil por papel sem copiar a sessão real de ninguém, e um token novo a cada sessão, então rodada longa não morre quando o token vence.

```js
import { cookie, jwtHs256, fromFile } from 'mini-qa-harness';

const as = (sub, role) => cookie({
  name: 'jwt',
  value: jwtHs256({ secret: fromFile('.qa/secrets/jwt.key'), claims: { sub, role }, ttlSeconds: 1200 }),
});

profiles: {
  manager: { auth: as('qa-manager', 'manager') },
  clerk:   { auth: as('qa-clerk', 'clerk') },
}
```

Os nomes dos claims (`sub`, `role`, `email`...) têm que ser os que o backend lê. `iat`, `nbf` e `exp` são preenchidos pela função. O usuário de teste precisa existir em todo lugar onde o app confere (tabela de usuários, store de permissão): token válido para usuário que o backend não conhece costuma voltar 400 ou 403, o que parece bug e não é.

## 3. Segredo fica de fora

- Chave, token e login gravado ficam em `.qa/`. O `npx qa init` põe `.qa/` e `evidence/` no `.gitignore`.
- Diga aos agentes de teste para não abrir `.qa/` (o prompt da skill já diz).
- O que vai para o disco passa por `redact`: JWT, bearer token e o valor de `token=`, `access_token=`, `api_key=`, `key=`, `password=` na query viram `[REDACTED]`. Acrescente padrões seus (CPF, hostname interno) em `redact` no config. Ver [referência do config](../reference/config.md).

## Relacionados

- [Referência do config](../reference/config.md) e [da API](../reference/api.md#adaptadores-de-auth)
- [Como funciona](../explanation/how-it-works.md)
