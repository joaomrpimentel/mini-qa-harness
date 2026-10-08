# 6. Challenge

No worked example and no commands to copy on this page. You have everything you need from pages 1 to 5.

## The requirement

The notes app has a second rule:

> Viewers can read notes but cannot delete them.

Find out whether it holds, the way you did for the admin. Some of this you decide yourself, and that is part of the test.

## What to produce

- One case file of your own in `cases/`, run with `reproduce` and at least `times: 2`
- The case runs as the profile the requirement talks about
- The verdict comes from what the screen and the page's own requests showed, never from calling the API yourself
- The case touches only data it created. `Welcome` and `Groceries` belong to someone else
- If the verdict is `BUG`, a draft `bugs/BUG-2.md` from the template, with requirement, steps, expected, actual and evidence

## How it is checked

By end state: what is in `evidence/` and in the app, not what you typed.

```bash
node examples/check-challenge.mjs
```

The check passes when some case under `evidence/` ran as the right profile, reached the same verdict in every run, has that verdict backed by the network log of every run, and left the data it did not create alone. When it fails, it tells you what is missing and where to look, not what the answer is. Read the message, look at your screenshots, and run it again.

If you deleted a note you did not create, stop the demo and start it again (`node demo/server.mjs`), which resets the data, then fix the case so it makes its own.

> When the check says `DONE`, delete what this tutorial created: `rm -rf evidence bugs cases`. Restarting the demo clears the notes, including the pinned `QA-demo` notes that, as you know by now, the app does not let you delete.

> The draft `bugs/BUG-2.md` is the result you would hand to a person for review. The [mini-qa skill](../how-to/run-with-claude-code.md) runs this same loop with LLM tester agents, several at a time, and keeps that review step: nothing gets posted until a human says so. [How it works](../explanation/how-it-works.md) explains why.
