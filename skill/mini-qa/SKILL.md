---
name: mini-qa
description: |
  Test a web app feature through its UI with small parallel tester agents, verify
  every finding against the environment before calling it a bug, record the
  reproduction (screenshots, network, optional Jam video) and draft bug reports
  a human approves before anything is posted. Uses the mini-qa-harness library
  (Playwright). Use when asked to test, QA, validate or "homologate" a feature or
  ticket in a running environment, to turn a test failure into a reproducible bug
  report, to record a bug with Jam, or when the user says "/mini-qa".
---

# Mini QA

Every feature under test leaves with one of two results: a comment saying what was tested and that nothing was found, or a bug report a developer can reproduce without asking a question. Nothing in between gets posted.

The harness docs explain the why (`docs/en/explanation/`). This skill is the order of work and the rules.

## Roles

| Who | Does | Never does |
|---|---|---|
| Tester agents (smaller model, e.g. Sonnet) | drive the UI with `openSession`/`reproduce`, one charter each, return a session report and bug drafts | read source code, call the API by hand, read the database or logs, post anything |
| You (main session) | prepare the environment, write charters, verify each finding, record, render drafts | decide what gets posted |
| The user | picks the feature, edits drafts, gives the order to post | |

The split between who tests and who verifies is the core of the design. A tester that reads the code tests what the code says, and the report ends up confirming the implementation instead of the requirement.

## Phases

Open a todo list with these phases before starting.

1. **Intake.** Read the ticket and its acceptance criteria. Copy the criteria verbatim: they become the "Requirement" line of any bug, and a paraphrase there becomes an invented fact. Find the PR and the related front/back tickets that ship together.
2. **Check the environment.** Is the build under test actually deployed (version, commit, image digest)? Migrations applied? Feature flags on? Test data that the criteria need exists? See `references/verify.md`, "Environment traps".
3. **Harness up.** `npx qa smoke` must sign in with every profile the criteria need. A criterion about permissions needs one profile per role. Missing profile: add it to `qa.config.mjs` (see the auth how-to), do not reuse a stronger one.
4. **Spawn testers.** Several small agents in parallel, two or three cases each, 15 minutes each, with `references/tester-prompt.md` filled in. Two agents never edit the same record. Pass screen helpers (`helpers/<screen>.mjs`) when they exist; write one from the first agent's script when it does not.
5. **Verify each finding.** Against evidence, not the agent's prose: open the screenshots, `evidence.json` and `trace.zip`. Rule out the environment, then name the oracle. See `references/verify.md`.
6. **Record** confirmed bugs (`references/record.md`). Jam is optional; the Playwright trace and screenshots are always there.
7. **Draft and hand over.** Render each draft with `templates/bug-report.md`, show the user. **Post only on the user's order**, with the text the user approved (`references/post.md`).
8. **Clean up.** No `dataPrefix` records left in the environment (checked through the UI), local evidence removed once posted, sessions and profiles kept or wiped as the user decides.

## Fixed rules

- **Testers use the UI only.** No source, no curl, no database, no logs. The network the page itself makes is evidence and is recorded by the session.
- **A bug is reproduced k/k from a fresh session** (`reproduce(..., { times: 2 })` at least) before it enters a report. `FLAKY 1/2` is an observation, not a bug.
- **Rule out the environment before calling it a bug.** Stale deploy, missing migration, missing permission, missing data have all looked like bugs.
- **Missing preconditions give `NOT_TESTED` with a reason**, never `BUG` and never `OK`.
- **Every finding names its oracle**: the requirement it contradicts (Claim), the product's own behaviour elsewhere (Product), a previous version (History), a comparable product, user expectation, purpose, a standard, or a familiar problem. No oracle, no bug: it becomes an observation in the comment.
- **Post only on the user's order.** If the user edited the draft, post the user's text.
- **Test data carries `dataPrefix`** and leaves through the UI at the end. Other people's data is never touched. Edits go to records created for testing, because edit history usually cannot be deleted.
- **Secrets never appear** in output, drafts, screenshots or commits. Tokens are minted or loaded by auth adapters and redacted from evidence. Testers are told not to open `.qa/`.
- **Recordings tell the bug, not the method.** Jam title and description describe what fails and how; they do not mention agents, automation or headless browsers. The reader is a developer reproducing a bug.

## Closing checklist

- [ ] Each tested criterion has a verdict: OK, BUG k/k, or NOT_TESTED with reason
- [ ] Each posted bug has requirement, steps, expected, actual (exact screen text plus network status), evidence images that load (`qa gh check`)
- [ ] No `dataPrefix` data left in the environment
- [ ] Local evidence of posted bugs deleted, unless the user wants to keep it
