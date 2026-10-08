# 1. Run the demo and sign in two people

This tutorial takes about 45 minutes. You start the notes app that ships with the repo, which has bugs planted in it, and by the last page you have found one of them on your own, with evidence a developer could act on. Each page teaches one thing and ends with something you run and an **Expected** block telling you what you should see.

| Page | You learn to |
|---|---|
| 1 (this one) | start the demo and check that each test profile signs in |
| [2](02-your-first-case.md) | write one test case that records its own evidence |
| [3](03-reproduce.md) | repeat a failure from a fresh session before believing it |
| [4](04-verify-and-classify.md) | tell a bug from a problem of the environment |
| [5](05-write-the-report.md) | turn the evidence into a bug report draft |
| [6](06-challenge.md) | find a bug with no instructions, checked by a script |

You need Node 20 or newer, and to be comfortable reading a short JavaScript file. Playwright experience helps but is not required.

## Set up

Clone the repo, install, and download the browser Playwright drives:

```bash
npm install
npx playwright install chromium
```

Start the demo in a terminal of its own and leave it running:

```bash
node demo/server.mjs
```

```text
demo notes app on http://localhost:4173  (users: admin/demo, viewer/demo)
```

## The idea: a profile is a person the harness can be

A test about permissions needs more than one person. The harness calls each of them a **profile**: a name, plus a way to sign in that needs no typing. Open `qa.config.mjs` at the repo root. It has two profiles, `admin` and `viewer`, and both sign in the same way, by putting a session cookie in the browser before the first page loads:

```js
profiles: {
  admin: { auth: demoSession('admin', 'admin'), about: 'creates and deletes notes' },
  viewer: { auth: demoSession('viewer', 'viewer'), about: 'reads notes only' },
},
```

The two things to notice are the profile names, which you pass to every session from now on, and `startPath: '/notes'`, the page each session opens first. Your own app will sign in differently; [Configure auth for your app](../how-to/configure-auth.md) covers the other ways.

## Worked example: the smoke check

`qa smoke` opens `startPath` once per profile, takes a screenshot and lists every request that failed:

```bash
node bin/qa.mjs smoke
```

```text
admin        /notes  errors: none  <repo>/evidence/smoke/admin/01-start.png
viewer       /notes  errors: none  <repo>/evidence/smoke/viewer/01-start.png
```

Read it column by column: the profile, the page it ended on, failed requests, the screenshot. A profile that ended on `/login` did not sign in. A line with errors means the app is not healthy enough to test, and nothing after this page is worth running until it is fixed.

## Guided practice (you decide)

Open the two screenshots. Before you look, decide which profile you expect to see the **New note** form, given what `about` says. Then check one profile on its own, and a profile that does not exist:

```bash
node bin/qa.mjs smoke viewer
node bin/qa.mjs smoke editor
```

> **Expected:** the first command prints only the `viewer` line. The second prints `qa: unknown profile "editor". Known: admin, viewer` and exits with code 1. If you get `net::ERR_CONNECTION_REFUSED at http://localhost:4173/notes`, the demo is not running: start it again in its own terminal.

Next: [2. Your first test case](02-your-first-case.md)
