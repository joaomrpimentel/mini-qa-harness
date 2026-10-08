# Evidence files

Everything a session records lands under `evidenceDir` (default `evidence/`), one folder per `caseId`.

```text
evidence/
  delete-pinned/
    result.json              # written by reproduce()
    run-1/
      01-pinned-note-created.png
      02-after-delete.png
      03-after-reload.png
      evidence.json          # written by session.close()
      trace.zip              # only when kept, see below
    run-2/
      ...
```

## Screenshots

`NN-<label>.png`: `NN` is the 1-based order within the session, padded to two digits. In `<label>`, every run of characters other than letters, digits, `_`, `.` and `-` becomes `_`, and the label is cut at 60 characters. The folder listing reads as the steps of the case.

## `evidence.json`

Written by `session.close()`.

| Field | Type | Meaning |
|---|---|---|
| `caseId` | string | as passed to `openSession` |
| `profile` | string | profile name or `anonymous` |
| `baseUrl` | string | |
| `startedAt`, `endedAt` | ISO 8601 string | |
| `verdict` | string or null | as passed to `close()` |
| `notes` | string or null | as passed to `close()`; `reproduce()` passes `observed` or `reason` |
| `trace` | `'trace.zip'` or null | whether a trace file was kept |
| `shots` | array | `{ file, label, url }`, `url` redacted |
| `network` | array | see below |
| `console` | array | `{ type, text }`, errors and warnings only, `text` redacted and cut at 500 characters |
| `pageErrors` | string[] | uncaught exceptions, redacted, cut at 500 characters |

### Network entries

One entry per response the page received, except documents (page navigations), URLs that match no `network.include` pattern, and URLs that match a `network.ignore` pattern.

| Field | Type | Meaning |
|---|---|---|
| `t` | ISO 8601 string | when the response was handled |
| `method` | string | `GET`, `POST`, ... |
| `url` | string | relative to `baseUrl` when on the same origin, absolute otherwise; redacted; cut at 300 characters |
| `status` | number | HTTP status |
| `body` | string, null, or absent | present only when status is 400 or above or the method is not `GET`. Redacted, cut at `network.bodyLimit` characters. `null` when the body could not be read |

Entries are pushed when the response is handled, so an entry whose body had to be read can land after a later one. Sort by `t` when order matters. Request headers, request bodies and cookies are never recorded.

## `trace.zip`

A Playwright trace with screenshots and DOM snapshots of every action, plus network and console. Open it with:

```bash
npx playwright show-trace evidence/delete-pinned/run-1/trace.zip
```

| `trace` option | `trace.zip` is kept |
|---|---|
| `'off'` | never; tracing does not start |
| `'retain-on-failure'` (default) | when `close()` gets a verdict that is not `'OK'` (`BUG`, `NOT_TESTED`, ...). No verdict: not kept |
| `'on'` | always |

The trace is not redacted. It can contain tokens and personal data seen by the page: do not attach it to a public issue without checking it.

## `result.json`

Written by `reproduce()` in `<evidenceDir>/<caseId>/`.

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

`verdict` is `OK`, `BUG` or `NOT_TESTED` when every run agrees, `FLAKY` otherwise. Each run carries whatever the case function returned besides `verdict`.

## Redaction

URLs, bodies, console text and page errors pass through `redact()` before they are stored. Built-in patterns and how to add your own: [config](config.md#built-in-redaction). Screenshots and traces show what the page showed and are not redacted.
