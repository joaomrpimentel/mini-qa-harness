# API

Everything is exported from `mini-qa-harness` (`src/index.mjs`). ES modules only, Node 20 or later.

```js
import { openSession, reproduce, cookie, jwtHs256, openJam } from 'mini-qa-harness';
```

Functions that take `config` load `qa.config.mjs` with `loadConfig()` when it is omitted.

## Config

### `loadConfig(path?)`

`path` defaults to `process.env.QA_CONFIG` or `'qa.config.mjs'`. Returns the merged config ([keys](config.md)), with `baseUrl` stripped of its trailing slash, `workDir` and `evidenceDir` absolute, and `redact` = built-ins plus user patterns.

### `redact(config, text)`

Returns `text` as a string with every `config.redact` pattern replaced by `[REDACTED]`. A prefix captured by the first group of a pattern (as in `Bearer `) is kept.

## Auth adapters

An adapter is `{ kind, apply(context, env) }`. `apply` runs on a new Playwright `BrowserContext` before the first navigation, with `env = { config, profile }`. The same adapter works for normal sessions and for the persistent context used by Jam.

A **value** is a string or a function `(env) => string | Promise<string>`, called each time a context is created.

| Function | Returns | Does |
|---|---|---|
| `cookie({ name, value, domain?, path = '/', secure?, httpOnly = true, sameSite = 'Lax' })` | adapter, `kind: 'cookie'` | `context.addCookies` with one cookie. `domain` defaults to the host of `baseUrl`; `secure` defaults to `true` when `baseUrl` is `https:`. |
| `header({ name = 'Authorization', value, prefix = 'Bearer ', origins })` | adapter, `kind: 'header'` | adds `name: prefix + value` through `context.route`, only to requests whose origin is in `origins` (default: the origin of `baseUrl`). |
| `storageState(path)` | adapter, `kind: 'storageState'`, plus `path` | Reads a Playwright storage state file: adds its cookies, and sets its localStorage entries per origin through an init script. Throws `no saved login at <path>. Run: npx qa login <profile>` when the file is missing. |
| `combine(...adapters)` | adapter, `kind: 'combine'` | Applies each adapter in order. |

### Value providers

| Function | Returns a value that |
|---|---|
| `fromEnv(name)` | reads `process.env[name]`; throws `environment variable <name> is empty` if unset or empty |
| `fromFile(path)` | reads the file as UTF-8, trimmed |
| `fromCommand(cmd, args = [])` | runs the command (no shell) and uses its trimmed stdout |
| `jwtHs256({ secret, claims, ttlSeconds = 1200 })` | signs an HS256 JWT. `secret` and `claims` are values (string/object or function). `iat` and `nbf` are now, `exp` is now + `ttlSeconds`; they override fields of the same name in `claims`. |

## Sessions

### `openSession({ profile?, caseId = 'session', trace = 'retain-on-failure', config? })`

Launches Chromium (`config.headless`, `config.channel`), creates a context with `viewport` and `locale`, applies the profile's auth, opens a page and starts recording. Evidence goes to `<evidenceDir>/<caseId>/`, created on open. `caseId` may contain `/` to nest folders.

`trace`: `'off'`, `'on'` (always keep `trace.zip`) or `'retain-on-failure'` (keep it only when `close()` gets a verdict other than `'OK'`). Traces include screenshots and DOM snapshots.

Returns a session `s`:

| Member | Type | Meaning |
|---|---|---|
| `s.page`, `s.context`, `s.browser` | Playwright objects | |
| `s.config` | object | the loaded config |
| `s.profile` | string | profile name, or `'anonymous'` |
| `s.dir` | string | absolute evidence folder |
| `s.network` | array | live network log, see [evidence](evidence.md#network-entries) |
| `s.console` | array | `{ type: 'error' \| 'warning', text }` |
| `s.pageErrors` | string[] | uncaught page exceptions |
| `s.shots` | array | `{ file, label, url }` per screenshot |
| `await s.goto(path = startPath)` | | navigates to `baseUrl + path` (or `path` if it starts with `http`) and waits for `networkidle` |
| `await s.shot(label, opts?)` | string | screenshot `NN-<label>.png`, returns its path. `opts` go to `page.screenshot` (e.g. `{ fullPage: true }`) |
| `s.mark()` | number | current length of `s.network` |
| `s.since(mark, { all = false }?)` | array | network entries after the mark; without `all`, only non-GET or status 400 and above |
| `await s.messages()` | string[] | trimmed, non-empty inner texts of elements matching `[role=status]`, `[role=alert]`, `[role=alertdialog]`, `[role=dialog]`, and classes containing `toast`, `snackbar` or `notification` |
| `await s.close({ verdict?, notes? }?)` | object | stops tracing, writes `evidence.json`, closes the browser, returns the evidence object |

### `reproduce(caseId, { profile?, times = 2, config?, trace? }, fn)`

Runs `fn(s, { run })` `times` times, each in a new session with `caseId` `<caseId>/run-<n>`. `fn` must return `{ verdict, ...anything }` with `verdict` one of `VERDICTS` (`'OK'`, `'BUG'`, `'NOT_TESTED'`). If `fn` throws or returns another verdict, that run becomes `{ verdict: 'NOT_TESTED', reason: 'script-error', observed: <message> }` and a `script-error` screenshot is attempted. Each session is closed with `verdict` and `notes` = `observed`, else `reason`, else `null`.

Returns, and writes to `<evidenceDir>/<caseId>/result.json`:

```js
{ caseId, profile, times, verdict, summary, runs: [{ run, verdict, ...whatever fn returned }] }
```

`verdict` is the first run's verdict when all runs agree, else `'FLAKY'`. `summary` is `'<verdict> <same>/<times>'`, for example `'BUG 2/2'` or `'FLAKY 1/2'`.

### `newContext(browser, config, profile, extra?)` and `record(page, config)`

Lower-level pieces of `openSession`. `newContext` creates a context with viewport, locale and `extra` options and applies `profile.auth` (`profile` is `{ name, auth }`). `record` attaches the network, console and page error recorders to a page and returns `{ network, console, pageErrors }`.

## Cursor

| Function | Does |
|---|---|
| `showCursor(context, { hostIncludes? }?)` | adds an init script that draws an arrow cursor following the mouse and a red pulse on each mousedown. Position is kept in sessionStorage, so it survives navigation and reload. With `hostIncludes`, only on hosts containing that string. Call before the first navigation. |
| `humanClick(page, locator, { pause = 350 }?)` | scrolls the target into view, moves the mouse from the last cursor position to its centre in 12 to 40 steps, waits `pause` ms, clicks. Falls back to `locator.click()` when the target has no bounding box. |
| `humanType(page, locator, text, { delay = 60 }?)` | `humanClick` on the target, then `pressSequentially(text, { delay })`. |

## Jam

`JAM_EXTENSION_ID` is `'iohjgamcilhbgmhbnllfolmkmmekfmci'`.

### `setupJam(config)`

Downloads the extension CRX from the Chrome Web Store update endpoint, strips the CRX3 header, unzips it to `<workDir>/jam-ext` (requires the `unzip` command), removes `_metadata`, adds `host_permissions: ["<all_urls>"]` to the manifest. Returns `{ ext, version }`.

### `openJam({ profile?, headless = true, config? })`

Launches a persistent Chromium context (channel `'chromium'`, profile dir `<workDir>/jam-profile`) with the extension loaded, applies the profile's auth, waits up to 15 s for the extension service worker and starts recording network and console on the first page. Throws `Jam extension missing. Run: npx qa jam setup` without `jam-ext`.

Returns:

| Member | Meaning |
|---|---|
| `context`, `page`, `sw` | persistent context, first page, extension service worker |
| `network`, `console` | recorders, same format as a session |
| `await focusApp()` | closes tabs that are not the app or the extension, activates the app tab (the one whose URL contains the `baseUrl` host) |
| `await openPopup()` | opens the extension popup as a background tab in the app window and returns its page |
| `await popupText()` | focuses the app, opens the popup, returns its text and closes it |
| `await start()` | clicks `Record Tab` in the popup, waits 4.5 s for the countdown |
| `await stopAndCreate(title, description)` | clicks `Stop Recording`, fills title and description in the preview (`iui.html` frame), clicks `Create`, returns the unique `jam.dev/c/...` links found in pages and frames. Empty array: no link was created. |
| `await close()` | closes the context |

`loginJam(config)` opens a visible window on `jam.dev/login` with the extension loaded and resolves when the window closes (what `qa jam login` runs).

## GitHub

Both use the persistent browser profile in `<workDir>/gh-profile`, signed in with `qa gh login`.

| Function | Returns | Does |
|---|---|---|
| `loginGitHub(config)` | login name | opens a visible window on `github.com/login` in that profile, polls every 5 s for up to 15 min until signed in, returns the login |
| `uploadToGitHub(config, repo, files)` | `{ [basename]: url }` | opens `github.com/<repo>/issues/new` headless, drops each file on the textarea, waits up to 60 s for a `github.com/user-attachments/(assets\|files)/...` URL, clears the textarea; never submits. Throws `GitHub profile is not signed in. Run: npx qa gh login` when redirected to login. MIME by extension: png, jpg, jpeg, gif, webp, mp4. |
| `checkIssueImages(config, url)` | `{ images, loaded }` | opens the page, waits 6 s, counts `.markdown-body img` elements and how many finished loading with a non-zero width |

## Reports

| Function | Returns | Does |
|---|---|---|
| `renderIssue(markdown, { urls = {}, issueRefRepo = '' }?)` | `{ title, body }` | see below |
| `renderIssueFile(path, opts?)` | `{ title, body }` | `renderIssue` on the file contents |
| `draftImages(markdown)` | string[] | targets of `![...](...)` that do not start with `http://` or `https://` |

`renderIssue` steps: drop a leading BOM and a leading `---` frontmatter block; take the first line, which must be `# <title>` (else throws `draft must start with a "# Title" line`); in every Markdown link or image whose target is not `http(s)`, replace the target with `urls[basename(target)]` when present; throw `images without uploaded URL: <targets>` if a local image is left; with `issueRefRepo`, rewrite `#<digits>` not preceded by a word character or `/` to `<issueRefRepo>#<digits>`; `body` ends with one newline.
