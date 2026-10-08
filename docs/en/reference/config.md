# Configuration

`qa.config.mjs` in the working directory, or the file named by the `QA_CONFIG` environment variable. It is a JavaScript module whose default export is an object. If the file does not exist, the defaults below apply and no profiles are defined. Loaded by `loadConfig()` in `src/config.mjs`.

```js
import { storageState } from 'mini-qa-harness';
export default {
  baseUrl: 'https://staging.example.com',
  startPath: '/dashboard',
  profiles: { admin: { auth: storageState('.qa/auth/admin.json') } },
};
```

## Keys

| Key | Type | Default | Meaning |
|---|---|---|---|
| `baseUrl` | string | `'http://localhost:4173'` | Root of the app under test. A trailing `/` is removed. Relative paths in `session.goto()` are appended to it, and network URLs in evidence are written relative to it. |
| `startPath` | string | `'/'` | Where sessions, `qa smoke`, `qa login` and `qa jam smoke` start. Set it to an internal route when `/` redirects to the login page. |
| `viewport` | `{ width, height }` | `{ width: 1440, height: 900 }` | Browser viewport of every session. Jam windows are this size plus 100 px of height. |
| `locale` | string | `'en-US'` | Browser locale. |
| `headless` | boolean | `true` | Headless sessions. Does not affect `openJam`, which takes its own `headless` option. |
| `channel` | string or undefined | `undefined` | Playwright browser channel for sessions and the GitHub helpers. `undefined` is the bundled Chromium. Jam always uses `'chromium'`. |
| `evidenceDir` | string | `'evidence'` | Where sessions write screenshots, `evidence.json`, `trace.zip` and `result.json`. Resolved to an absolute path. |
| `workDir` | string | `'.qa'` | Local state that must stay out of git: `jam-ext/`, `jam-profile/`, `gh-profile/`, and by convention saved logins and secrets. Resolved to an absolute path. |
| `dataPrefix` | string | `'QA-'` | Prefix for every record a test creates. Read by people and agents (the skill and the tester prompt); the library does not enforce it. |
| `network.include` | RegExp[] | `[/./]` | A response is recorded only if its full URL matches at least one pattern. |
| `network.ignore` | RegExp[] | static assets | A response is skipped if its URL matches any pattern. The default skips `.js .mjs .css .map .png .jpg .jpeg .gif .svg .ico .webp .woff .woff2 .ttf`. Setting it replaces the default. |
| `network.bodyLimit` | number | `800` | Maximum characters of a response body stored per entry. |
| `redact` | RegExp[] | `[]` (added to built-ins) | Extra patterns scrubbed from URLs, bodies, console text and page errors. Use the `g` flag. Always appended to the built-in list, never replacing it. |
| `profiles` | object | `{}` | Map of profile name to `{ auth, ...anything }`. See below. |
| `github.issueRefRepo` | string | `''` | When set (`'owner/repo'`), `qa issue render` rewrites bare `#123` to `owner/repo#123`. |

`network` and `github` are merged key by key with the defaults, so setting `network: { include: [/\/api\//] }` keeps the default `ignore` and `bodyLimit`.

## Profiles

```js
profiles: {
  admin:  { auth: storageState('.qa/auth/admin.json'), about: 'full access' },
  viewer: { auth: cookie({ name: 'session', value: fromEnv('QA_VIEWER_TOKEN') }) },
}
```

| Field | Type | Meaning |
|---|---|---|
| `auth` | adapter or `null` | Applied to every new browser context of the profile. See [auth adapters](api.md#auth-adapters). |
| any other field | any | Kept on the profile object and ignored by the library. `about` is a convention for describing the role to agents. |

A session opened without a profile is `anonymous`, with no auth. An unknown profile name throws `unknown profile "<name>". Known: <names>`.

## Built-in redaction

Always applied before anything is written to disk, in this order, then the patterns from `redact`:

| Pattern | Example input | Written as |
|---|---|---|
| JWT, `eyJ...` with three dot-separated parts | `eyJhbGciOi...c2ln` | `[REDACTED]` |
| `Bearer <token>`, case-insensitive | `Authorization: Bearer abc.def` | `Authorization: Bearer [REDACTED]` |
| query value of `token`, `access_token`, `api_key`, `key`, `password` | `/cb?token=s3cret&x=1` | `/cb?token=[REDACTED]&x=1` |

Request headers and cookies are never recorded.
