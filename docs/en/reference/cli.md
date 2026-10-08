# CLI

`qa` (`bin/qa.mjs`). Run it as `npx qa <command>` in a project that depends on the harness, or `node bin/qa.mjs <command>` from a clone. Every command reads `qa.config.mjs` (or `QA_CONFIG`) first. Without a command, or with an unknown one, it prints the help and exits 0. Errors print `qa: <message>` and exit 1.

| Command | Does | Writes | Exit |
|---|---|---|---|
| `qa init` | copies `qa.config.example.mjs` to `qa.config.mjs` if missing; appends `.qa/` and `evidence/` to `.gitignore` if missing | `qa.config.mjs`, `.gitignore` | 0 |
| `qa smoke [profile...]` | for each profile (all configured profiles when none given, `anonymous` when none configured): opens `startPath`, waits 800 ms, takes a screenshot, prints one line | `evidence/smoke/<profile>/01-start.png`, `evidence.json` | 1 if any profile saw a `401` or a `5xx`. Other 4xx (a `403` for a weaker profile, say) are listed but do not fail |
| `qa login <profile>` | opens a visible browser on `baseUrl + startPath`, waits for Enter in the terminal, saves the storage state | the `storageState` path of the profile | 1 if the profile does not use `storageState()` |
| `qa jam setup` | downloads and patches the Jam extension | `.qa/jam-ext/` | 0 |
| `qa jam login` | opens a visible Chromium with the extension on `jam.dev/login`; returns when the window closes, or after 25 minutes | `.qa/jam-profile/` | 0 |
| `qa jam smoke [profile]` | opens `startPath` in the Jam browser, prints the first 160 characters of the popup text | | 1 if the popup text lacks `Record Tab` |
| `qa gh login` | opens a visible browser on `github.com/login`, prints `signed in as <login>` once signed in; gives up after 15 minutes | `.qa/gh-profile/` | 1 on timeout |
| `qa gh upload <owner/repo> <file...>` | uploads the files as attachments, prints `{ "file": "url" }` JSON | | 1 on failure |
| `qa issue render <draft.md> [--upload <owner/repo>] [--out <file>]` | with `--upload`, uploads every local image referenced in the draft (paths resolved from the draft's folder); renders title and body; prints the title | `--out`, default `body.md` | 1 if a local image has no URL |
| `qa gh check <issue-url>` | prints `images N, loaded M` | | 1 if `M < N` |

## `qa smoke` output

One line per profile:

```text
admin        /notes  errors: none  /path/to/evidence/smoke/admin/01-start.png
```

Columns: profile name padded to 12, final path relative to `baseUrl`, up to five distinct `status METHOD url` entries with status 400 or above (or `none`), screenshot path. A final path different from `startPath` (for example `/login`) means the profile did not sign in.

Smoke sessions run with `trace: 'off'`.
