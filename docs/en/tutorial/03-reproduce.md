# 3. Reproduce before you believe

On page 2 one run said `BUG`. A single failure can come from timing, from data a previous run left behind, or from a browser that still had something cached. The developer who gets your report starts from a clean browser, so you check from a clean browser first.

## The idea: k out of k, from fresh sessions

`reproduce(caseId, { profile, times }, fn)` runs the same case `times` times. Each run gets a brand new browser and session, its own `run-N` folder, and has to return a verdict: `OK`, `BUG` or `NOT_TESTED`. At the end it writes `result.json` and gives you a summary such as `BUG 2/2`. If the runs disagree the summary is `FLAKY 1/2`, and that is an observation for you to look into, not a bug for someone else to fix.

## Worked example

`examples/delete-pinned.mjs` is the case from page 2 inside `reproduce`. What changes is the frame around it:

```js
const result = await reproduce('delete-pinned', { profile: 'admin', times: 2 }, async (s, { run }) => {
  const title = `QA-demo pinned ${run}-${Date.now() % 10000}`;
  ...
  if (!stillThere) return { verdict: 'OK', observed: 'note gone after reload' };
  return { verdict: 'BUG', observed: `note still listed after reload; ...` };
});
console.log(result.summary);
```

The note title has the run number in it, so the second run never finds the note the first one left behind and mistakes it for its own.

```bash
node examples/delete-pinned.mjs
```

```text
BUG 2/2
  run 1: note still listed after reload; screen said ["Something went wrong. Please try again."]; DELETE /api/notes/5 -> 500
  run 2: note still listed after reload; screen said ["Something went wrong. Please try again."]; DELETE /api/notes/6 -> 500
```

Both runs failed in the same way, from scratch. Now open the trace of the first run:

```bash
npx playwright show-trace evidence/delete-pinned/run-1/trace.zip
```

The trace viewer lists every action the script took. Click one and you see the page as it was at that moment, plus the network and console tabs. Screenshots show the result. The trace shows how the page got there, which is what you need when a screenshot is not enough to explain the failure.

A crash in your own script is not a verdict about the app. If a locator never matches, `reproduce` records `NOT_TESTED` with `reason: 'script-error'`, and the failing run gets a screenshot of where it stopped (`01-script-error.png` when it stopped before any other shot). A typo like `getByPlaceholder('Titel')` gives `NOT_TESTED 2/2` after the 30-second Playwright timeout on each run.

## Guided practice (you decide)

Copy the example:

```bash
cp examples/delete-pinned.mjs cases/delete-pinned-x3.mjs
```

In the copy, change `times: 2` to `times: 3` and the case id `'delete-pinned'` to `'delete-pinned-x3'`. Before running it, predict the summary line and how many `run-N` folders will appear. Then run `node cases/delete-pinned-x3.mjs`.

> **Expected:** `BUG 3/3`, three `run` lines that each end in `-> 500`, and `evidence/delete-pinned-x3/` with `run-1` to `run-3` plus `result.json`. `BUG 2/2` means `times` did not change. Runs landing in `evidence/delete-pinned/` mean the case id did not.

Next: [4. Bug or environment?](04-verify-and-classify.md)
