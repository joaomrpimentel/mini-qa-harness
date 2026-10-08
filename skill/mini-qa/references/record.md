# Recording a confirmed bug

Two kinds of recording, for two readers.

| Recording | Made by | For |
|---|---|---|
| Screenshots + `evidence.json` + `trace.zip` | every session, automatically | the verifier, and the issue body |
| Jam link (video, network, console) | `openJam`, on demand | the developer who opens the issue and wants to watch it happen |

## Jam

Setup once: `npx qa jam setup`, then `npx qa jam login` (a person signs in), then `npx qa jam smoke` must print `Record Tab`.

Write one script per bug from `examples/jam-record.mjs`:

- Prepare data **before** `jam.start()`, with a normal session. The video shows only the reproduction.
- `showCursor(jam.context)` before the first navigation, and `humanClick`/`humanType` in the recorded part. Without a drawn cursor, a headless video shows things changing with no hint of where the click happened.
- End with the state after a reload, so the video proves the result persisted (or did not).
- `stopAndCreate(title, description)` returns the `jam.dev/c/...` link. Empty array means the Jam stayed as a local draft.

Title and description tell the bug: what fails, on which data and screen, what the network and screen show, what was expected, the ticket. They do not mention agents, automation or headless browsers.

> **Deleting a pinned note returns 500 and the note stays in the list**
>
> Admin deletes the pinned note "QA-demo jam". The confirmation calls DELETE /api/notes/{id}, which returns 500 with an empty body. The screen shows "Something went wrong. Please try again." After reload the note is still listed. Expected: the note is deleted, or a message explains that pinned notes must be unpinned first.

The Jam lives in the signed-in account. Hand the link to the user; do not share it on your own.

## When Jam breaks

It drives the extension's own UI, so a Jam release can break it. Symptoms and the line to look at in `src/jam.mjs`:

| Symptom | Look at |
|---|---|
| Popup stuck on "Starting Jam" | `host_permissions` patch in `setupJam` |
| `app tab not found` | navigate the page to `baseUrl` before `start()` |
| No `iui.html` frame after stop | Jam changed the preview; inspect frames in a headed run |
| No link, "drafts unfinished" in the popup | `Create` was not clicked; the preview text changed |
