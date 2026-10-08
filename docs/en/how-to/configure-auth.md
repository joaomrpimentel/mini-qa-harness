# How to sign in each test profile

A profile is a name in `qa.config.mjs` plus an auth adapter. Every session opened with that profile starts signed in, so agents never type a password. Each criterion about permissions needs one profile per role.

## 1. Pick the adapter

| Your app signs in with | Use |
|---|---|
| SSO, MFA, a captcha, or a login you would rather not script | `storageState(path)`, recorded once by hand with `qa login` |
| A session cookie whose value you can get (env var, file, command) | `cookie({ name, value })` |
| An `Authorization` header (API-backed SPA with a token in memory) | `header({ value })` |
| A JWT you are allowed to sign in a test environment | `cookie` or `header` with `value: jwtHs256({...})` |
| More than one of the above (cookie plus a feature-flag header) | `combine(a, b, ...)` |

## 2a. Record a login by hand (`storageState`)

1. Declare the profile:

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

2. Run `npx qa login admin`. A browser window opens on `baseUrl + startPath`.
3. Sign in as the admin test user, then go back to the terminal and press Enter. The cookies and localStorage of that window are saved to `.qa/auth/admin.json`.
4. Check it: `npx qa smoke admin` should print the start path and `errors: none`.

Repeat for each profile. When the session expires, run `qa login` again. Only cookies and localStorage are restored; an app that keeps its session in sessionStorage needs `cookie` or `header` instead.

## 2b. Send a cookie or a header

The value can be a string or a provider, so the token is read when the session opens and not copied once at startup:

```js
import { cookie, header, fromEnv, fromFile, fromCommand } from 'mini-qa-harness';

profiles: {
  viewer: { auth: cookie({ name: 'session', value: fromEnv('QA_VIEWER_TOKEN') }) },
  api:    { auth: header({ value: fromFile('.qa/secrets/api.token') }) },
  ops:    { auth: header({ value: fromCommand('gcloud', ['auth', 'print-identity-token']) }) },
}
```

`cookie` defaults: `domain` is the host of `baseUrl`, `path` is `/`, `secure` follows the protocol of `baseUrl`, `httpOnly` is `true`, `sameSite` is `Lax`. If the app reads the cookie on a parent domain shared by several subdomains (front on `app.example.com`, API on `api.example.com`), set `domain: '.example.com'`, and `sameSite: 'None'` with `secure: true` when the requests are cross-site.

`header` sends `<name>: <prefix><value>` with `name` `Authorization` and `prefix` `Bearer ` by default. The header only goes to the origin of `baseUrl`; requests to CDNs and other hosts leave without it. If the API lives on another origin, list it: `header({ value, origins: ['https://api.example.com'] })`.

## 2c. Mint a token per session (`jwtHs256`)

Use this only against a test environment whose signing key you are allowed to hold. It gives one profile per role without copying anyone's real session, and a fresh token every session, so a long run does not die when a token expires.

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

The claim names (`sub`, `role`, `email`...) must be the ones your backend reads. `iat`, `nbf` and `exp` are set for you. The test user must exist wherever the app checks it (user table, permission store): a valid token for a user the backend does not know usually returns 400 or 403, which looks like a bug and is not.

## 3. Keep the secrets out

- Put keys, tokens and saved logins under `.qa/`. `npx qa init` adds `.qa/` and `evidence/` to `.gitignore`.
- Tell tester agents not to open `.qa/` (the tester prompt in the skill already does).
- Evidence written to disk passes through `redact`: JWTs, bearer tokens and `token=`, `access_token=`, `api_key=`, `key=`, `password=` query values are replaced by `[REDACTED]`. Add your own patterns (national ID numbers, internal hostnames) to `redact` in the config. See [config reference](../reference/config.md).

## Related

- [Config reference](../reference/config.md) and [API reference](../reference/api.md#auth-adapters)
- [How it works](../explanation/how-it-works.md)
