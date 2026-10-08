# 5. Write the report

You have a bug that reproduces 2 out of 2 times and that you checked against the environment on page 4. The last step is to write it so a developer can reproduce it without asking you anything.

## The idea: every field answers a question the developer would ask

`templates/bug-report.md` is a fill-in form, and each section is a question the developer would otherwise ask you. When developers from Apache, Eclipse and Mozilla were surveyed on what makes a good bug report, steps to reproduce came out as the most wanted, and incomplete or inaccurate information as the biggest obstacle ([Bettenburg et al., 2008](https://neverworkintheory.org/2011/08/30/what-makes-a-good-bug-report.html)). Three rules turn the form into a good report:

- **Requirement, copied verbatim.** Paraphrase it and you have written a requirement that nobody agreed to
- **Actual, quoted exactly.** The text the screen showed, in backticks, plus method, route and status from `evidence.json`
- **Evidence, one image per step that proves something**, each with a caption saying what to look at

The frontmatter at the top (`case`, `reproduced`, `oracle`, `severity`) is for whoever reviews the draft. The render step drops it before posting.

## Worked example

Put the draft next to the screenshots it uses:

```bash
mkdir -p bugs
cp evidence/delete-pinned/run-1/0*.png bugs/
cp templates/bug-report.md bugs/BUG-1.md
```

Here is the Actual section filled in from `run-1`. Every value comes from the evidence, nothing from memory:

```markdown
## Actual

The screen shows `Something went wrong. Please try again.` `DELETE /api/notes/{id}` returns `500` with an empty body. After reload the note is still listed.
```

The title says what fails, where, and what the user sees, in one line: `# Deleting a pinned note returns 500 and the note stays in the list`. The Evidence section points at the three screenshots by relative path, `![error](02-after-delete.png)`.

## Guided practice (you decide)

Fill in the rest of `bugs/BUG-1.md`. Two fields need a decision of yours, and the tables in [Verification](../explanation/verification.md) help:

- **oracle**: what makes this behaviour wrong? Look at the requirement on page 2
- **severity**: Blocker, High, Medium or Low, plus one sentence on who is affected and what they cannot do

Then render it the way you would before posting:

```bash
node bin/qa.mjs issue render bugs/BUG-1.md
```

> **Expected:** `qa: images without uploaded URL: 01-pinned-note-created.png, 02-after-delete.png, 03-after-reload.png`, exit code 1, and no `body.md`. This refusal is on purpose. An issue whose images point at your disk would show the developer three broken pictures.

The render needs each image uploaded to GitHub first. `--upload owner/repo` does that, and [Post a bug to GitHub](../how-to/post-to-github.md) walks through it, including the sign-in it needs. For the tutorial, the draft is the result: the oracle you chose is probably `Claim`, because the requirement says an admin can delete *any* note. Severity is your call, as long as the sentence after it backs it up.

Next: [6. Challenge](06-challenge.md)
