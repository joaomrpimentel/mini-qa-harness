# 2. Your first test case

On page 1 both profiles signed in. Now one of them does something and the harness keeps the proof.

## The idea: the session records what the page did

`openSession` gives you a Playwright page that is already signed in and that writes down, on its own, every API request the page makes, every console error, and every screenshot you ask for. You never call the API yourself. Whatever ends up in the evidence is what the screen really did when a person clicked, and that is what a bug report needs.

A case has four named parts. Keep them in this order and every case you write reads the same way:

1. **Arrange**: create the data the case needs, with a `QA-` name, so you never touch someone else's notes
2. **Act**: do the thing the requirement talks about, through buttons and fields
3. **Assert**: confirm the result through the screen, after a reload
4. **Close**: write the evidence to disk

## Worked example

The requirement is "An admin can delete any note". Open `examples/first-case.mjs`. Three calls carry the case:

- `s.shot('label')` saves `01-label.png`, `02-label.png` and so on, so the folder reads like the steps
- `s.mark()` remembers how long the network log is right before the click, and `s.since(mark)` returns only what that click caused, leaving out the plain `GET`s that succeeded
- `s.close({ verdict })` writes `evidence.json` and closes the browser

```js
// 3. Act: delete it, and remember where the network log was before the click.
const m = s.mark();
await card.getByRole('button', { name: 'Delete note' }).click();
await p.getByRole('button', { name: 'Yes, delete' }).click();
...
// 4. Assert through the screen: reload and look for the note.
await p.reload({ waitUntil: 'networkidle' });
const stillThere = await p.locator('article').filter({ hasText: title }).count();
```

Run it:

```bash
node examples/first-case.mjs
```

```text
screen said: [ 'Note deleted.' ]
requests: [ 'DELETE /api/notes/3 -> 204' ]
verdict: OK
```

`evidence/first-case/` now holds three screenshots and `evidence.json`. Open the JSON: under `network` you find the `POST` that created the note and the `DELETE` that removed it, each with its status. That file is where a verifier looks later, so get used to reading it.

## Guided practice (you decide)

The example creates a note that is not pinned. Copy it and change that one thing:

```bash
mkdir -p cases
cp examples/first-case.mjs cases/my-first-case.mjs
```

In `cases/my-first-case.mjs`, set `const PINNED = true;` and change `caseId: 'first-case'` to `caseId: 'my-first-case'`. Before running, write down the verdict you expect. Then run `node cases/my-first-case.mjs`.

> **Expected:** `screen said: [ 'Something went wrong. Please try again.' ]`, `requests: [ 'DELETE /api/notes/4 -> 500' ]` (the id may differ) and `verdict: BUG`. `evidence/my-first-case/` also has a `trace.zip` that the first run did not have: the session keeps the Playwright trace only when the verdict is not OK.

You found something. Don't report it yet: one run proves very little, and page 3 is about why.

Next: [3. Reproduce before you believe](03-reproduce.md)
