# How to run a QA round with Claude Code

The `mini-qa` skill turns a Claude Code session into the coordinator of a test round: it spawns tester agents, verifies what they report and drafts the bugs. You stay the one who decides what gets posted.

## Before you start

- The harness is installed in the project you will test from (`npm install mini-qa-harness`, or a clone of this repo) and `npx qa smoke` signs in with every profile you need. See [configure auth](configure-auth.md).
- The environment under test is reachable from your machine.

## 1. Install the skill

Copy `skill/mini-qa/` to one of the places Claude Code reads skills from:

```bash
# for you, in every project
cp -r node_modules/mini-qa-harness/skill/mini-qa ~/.claude/skills/

# for this project only (commit it, so the team gets it too)
mkdir -p .claude/skills && cp -r node_modules/mini-qa-harness/skill/mini-qa .claude/skills/
```

From a clone of this repo, the source is `skill/mini-qa/`. The copy does not update itself: when you pull a new version of the harness, copy it again.

## 2. Start the round

In Claude Code, from the project directory:

```text
/mini-qa test ticket #123 on staging. Criteria are in the issue.
```

Any request to test, QA or validate a feature in a running environment also loads the skill. The session opens a todo list with the eight phases from `SKILL.md`: intake, check the environment, harness up, spawn testers, verify, record, draft and hand over, clean up.

## 3. Answer what only you know

The session will ask, or you should say up front:

- which environment and build is under test, and where to check what is deployed
- which profiles map to which roles in the criteria
- whether a record the test needs exists, or must be created with the `dataPrefix`
- where bugs go (repo per service, labels, assignee, project fields)

## 4. Let the testers run

The session fills `skill/mini-qa/references/tester-prompt.md` once per charter and starts several agents in parallel, two or three cases each, with a 15 minute time box. A smaller model (Sonnet) is enough for the testers. Two rules the session enforces and you should check if you write charters yourself:

- two agents never edit the same record, or one reports the other's edit as a bug
- each agent tests through the UI only; if one starts reading code or calling the API, the session sends it a message to correct course

Each agent returns a session report (per case: steps, expected, observed, evidence folder, verdict) and, for each `BUG 2/2`, a draft in `bugs/BUG-<n>.md`.

## 5. The session verifies

For each finding, the main session opens the screenshots, `evidence.json` and `trace.zip` instead of trusting the agent's summary, rules out the environment (stale deploy, missing migration, missing permission or data), and names the oracle the behaviour contradicts. Here, unlike the testers, it may read code, call the API and read logs. The checklist is `skill/mini-qa/references/verify.md`, and the reasoning behind it is in [verification](../explanation/verification.md).

The result is one of: BUG (draft comes to you), NOT_TESTED with a reason, observation, or nothing.

## 6. Review and give the order

Read each draft. Edit it if you want; the session posts your text, not its own. Nothing goes to GitHub until you say so. Then follow [post to GitHub](post-to-github.md), or let the session run those commands.

## 7. Clean up

Ask the session to confirm through the UI that no record with the `dataPrefix` is left, and to delete local evidence of bugs already posted.

## Related

- [Record with Jam](record-with-jam.md), [write a screen helper](write-a-screen-helper.md)
- [How it works](../explanation/how-it-works.md)
