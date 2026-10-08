# How to record a bug with Jam

A [Jam](https://jam.dev) link gives the developer a video of the reproduction with the network requests and console next to it. The harness drives the Jam browser extension inside Playwright's Chromium, because Jam has no public API to create a recording. Record only bugs that are already confirmed `BUG k/k` and verified.

## 1. Set up once

```bash
npx qa jam setup     # downloads the extension to .qa/jam-ext and patches its manifest
npx qa jam login     # a window opens on jam.dev/login; sign in, then close the window
npx qa jam smoke     # must print a popup text that contains "Record Tab"
```

`qa jam smoke` takes an optional profile (`npx qa jam smoke admin`). If it ends with `popup does not offer "Record Tab": signed in? run qa jam login`, the Jam session in `.qa/jam-profile` is missing or expired. `qa jam setup` needs the `unzip` command on the machine.

## 2. Write the recording script

Copy `examples/jam-record.mjs` and change only the part between `jam.start()` and `jam.stopAndCreate(...)`.

```js
const jam = await openJam({ profile: 'admin' });
const { page } = jam;
await showCursor(jam.context);            // before the first navigation
await page.goto('https://staging.example.com/orders', { waitUntil: 'networkidle' });

await jam.start();
await humanClick(page, page.getByRole('button', { name: 'Cancel order' }));
await humanClick(page, page.getByRole('button', { name: 'Yes, cancel' }));
await page.waitForTimeout(2500);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const links = await jam.stopAndCreate(title, description);
```

- Create the data the bug needs before `start()`, with a normal `openSession`. The video should show only the reproduction.
- Navigate to the app before `start()`: the extension records the app tab, and `start()` fails with `app tab not found` if there is none.
- Inside the recorded part use `humanClick` and `humanType`, not `locator.click()` or `fill()`. Headless Chromium draws no cursor; with `showCursor` and the human helpers the video shows the mouse travel to each target and a red pulse on each click.
- End on the state after a reload, so the video proves whether the result persisted.

## 3. Write the title and description

They describe the bug, for a developer who will reproduce it: what fails, on which data and screen, what the screen and the network show, what was expected, the ticket. They do not mention agents, automation, scripts or headless browsers.

> **Deleting a pinned note returns 500 and the note stays in the list**
>
> Admin deletes the pinned note "QA-demo jam". The confirmation calls DELETE /api/notes/{id}, which returns 500 with an empty body. The screen shows "Something went wrong. Please try again." After reload the note is still listed. Expected: the note is deleted, or a message explains that pinned notes must be unpinned first.

## 4. Run it

```bash
node record-bug-1.mjs "<title>" "<description>"
```

The script prints the `https://jam.dev/c/...` link. An empty result means the Jam stayed as a local draft in the extension. The Jam belongs to the signed-in account; put the link first under Evidence in the bug draft.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Jam extension missing. Run: npx qa jam setup` | `.qa/jam-ext` does not exist | `npx qa jam setup` |
| Popup stuck on "Starting Jam" | the extension has no host permission and waits for a real click on its icon | rerun `qa jam setup`, which adds `host_permissions: ["<all_urls>"]` |
| `app tab not found; navigate the page before recording` | no tab on the host of `baseUrl` | `page.goto(...)` the app before `jam.start()` |
| `Jam preview (iui.html) did not open after Stop Recording` | Jam changed its preview, or the stop click missed | run once with `openJam({ headless: false })` and inspect the frames |
| No link, popup says "drafts unfinished" | `Create` was not clicked | same as above; the preview text may have changed |
| Video squeezed, with black bars | headed run under a tiling window manager | keep the default `headless: true` |

The selectors live in `src/jam.mjs`: popup texts `Record Tab`, `Stop Recording`, and `Title`/`Create` inside the `iui.html` frame. A Jam release that renames them breaks this module first.

## Related

- [API reference: Jam](../reference/api.md#jam)
- [Post to GitHub](post-to-github.md)
