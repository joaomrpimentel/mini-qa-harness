# How to post a verified bug to GitHub

Do this only after the person who owns the round has read the draft and given the order. If they edited it, post their version.

## Before you start

- `gh` is installed and signed in (`gh auth status`).
- The draft starts with a `# Title` line and references its images by relative path, as in `templates/bug-report.md`.

## 1. Sign in to GitHub in the harness browser, once

```bash
npx qa gh login
```

A window opens on `github.com/login`. Sign in; the window closes by itself once the page shows a signed-in user (it gives up after 15 minutes). The session lives in `.qa/gh-profile`. `gh` cannot upload attachments, and this browser session is what uploads the images.

## 2. Render the issue body, uploading the images

```bash
TITLE=$(npx qa issue render bugs/BUG-1.md --upload acme/notes-api --out body.md)
```

This uploads every local image the draft references to `acme/notes-api` (it drops them on the comment box of a new issue and never submits it), writes `body.md` with the `user-attachments` URLs in place of the local paths, and prints the title. Frontmatter is dropped. If an image is left without a URL, it stops with `images without uploaded URL: ...` and writes nothing.

Use the repo where the issue will live: an attachment uploaded through one repo is meant to be shown in that repo.

To upload without rendering, `npx qa gh upload acme/notes-api a.png b.png` prints `{ "a.png": "https://github.com/user-attachments/..." }`.

## 3. Create the issue and check the images

```bash
gh issue create -R acme/notes-api --title "$TITLE" --body-file body.md
npx qa gh check https://github.com/acme/notes-api/issues/42
```

`qa gh check` prints `images N, loaded M` and exits with code 1 when `M < N`. Fix a broken image before anyone reads the issue.

Open the issue in the repo of the service that has the bug, and reference the feature ticket by full name (`acme/product#123`). To have bare `#123` in drafts rewritten, set `github.issueRefRepo: 'acme/product'` in `qa.config.mjs`.

## 4. Comment on the feature ticket

Write `comment.md`:

```markdown
Tested on staging on 2026-10-08, through the UI (Notes screen).

| Criterion | Result |
|---|---|
| An admin can delete any note | Bug: acme/notes-api#42 |
| Viewers can read notes but cannot delete them | OK |
| Export CSV downloads all notes | Not tested: export service not deployed in staging |
```

```bash
gh issue comment 123 -R acme/product --body-file comment.md
```

When nothing was found, say what was tested and that nothing was found.

## Related

- [CLI reference](../reference/cli.md), [bug report reference](../reference/bug-report.md)
- [Record with Jam](record-with-jam.md)
