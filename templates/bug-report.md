---
# Draft metadata. Dropped by `qa issue render`; kept for whoever reviews the draft.
case: <case id>
reproduced: <BUG k/k>
oracle: <which oracle says this is wrong: Claim | Product | History | Comparable | User | Purpose | Standard | Familiar problem>
severity: <Blocker | High | Medium | Low>
---

# <What fails, where, and the visible consequence, in one line>

## Requirement violated

- **Flow / context:** <screen and task the user was doing>
- **Requirement:** <exact text of the acceptance criterion, copied, not paraphrased>
- **Related:** <#123 feature issue>
- **Route / component:** <URL path and the UI element>

## Environment

- **URL:** <base URL of the environment tested>
- **Build:** <version, commit or image digest if known>
- **Profile:** <test profile and its role>
- **Browser / OS:** Chromium <version>, headless, 1440x900

## Severity

<Blocker | High | Medium | Low>: <one sentence on who is affected and what they cannot do>

## Steps to reproduce

1. Sign in as <profile>
2. Go to `<menu>` > `<screen>`
3. <action with the exact button text in backticks>
4. <...>

## Input data

| Field | Value |
|---|---|
| <field> | <value, with test prefix> |

## Expected

<what should happen, traced to the requirement>

## Actual

<what the screen showed, quoted exactly, and what the network showed: `DELETE /api/notes/{id}` returned `500` with an empty body>

## Evidence

- **Recording (Jam: video, network, console):** <link, if recorded>
- Step 3, the confirmation dialog: ![confirm](01-confirm.png)
- Step 4, the error message: ![error](02-after-delete.png)
- After reload, the record is still listed: ![reload](03-after-reload.png)
