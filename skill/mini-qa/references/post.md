# Posting, only on the user's order

## Bug issue

1. The draft lives next to its evidence, e.g. `bugs/BUG-1.md`, with images referenced by relative path.
2. GitHub sign-in, once: `npx qa gh login` opens a window; the user signs in and it closes.
3. Render, uploading the images to the repo where the issue will live:

   ```bash
   TITLE=$(npx qa issue render bugs/BUG-1.md --upload <owner>/<repo> --out body.md)
   gh issue create -R <owner>/<repo> --title "$TITLE" --body-file body.md
   npx qa gh check <issue-url>     # every image must load
   ```

   `render` drops frontmatter, takes the title from the first `# ` heading, swaps local image paths for `user-attachments` URLs and refuses to finish if a local image is left. With `github.issueRefRepo` set, a bare `#123` becomes `owner/repo#123`.

4. Jam link, when there is one, is the first item under Evidence.

Open the issue in the repo of the service that has the bug, and reference the feature ticket by full name (`owner/repo#123`). Labels, assignee and project fields follow the team's convention; ask the user once and write it down.

## Comment on the feature ticket

Starts with "Tested on <environment> on <date>, through the UI (<screen>)". Then the result per acceptance criterion, a table when there are three or more, with the link to each bug. NOT_TESTED cases with their reason. No bug: say it was tested and nothing was found.

```bash
gh issue comment <n> -R <owner>/<repo> --body-file comment.md
```
