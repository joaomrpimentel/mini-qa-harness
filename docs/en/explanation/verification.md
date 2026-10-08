# Verification

A tester agent's report is a claim about the app. This page explains why the harness treats it as a claim, who checks it, and what the check looks at. The checklist itself lives in the skill (`skill/mini-qa/references/verify.md`); this page is the reasoning behind it.

## Whoever produces the result does not approve it

Banking calls it maker-checker, security calls it separation of duties (NIST SP 800-53, control AC-5), and the idea is the same: the person who produces a result is not the one who approves it. In the harness there are three roles and each one checks the previous:

| Role | Produces | Is checked by |
|---|---|---|
| Tester agent | verdicts, screenshots, network log, bug drafts | the main session |
| Main session | verified findings, revised drafts, recordings | the user |
| User | the decision to post | the team reading the issue |

The tester cannot skip the check because it has no way to post. The main session cannot skip the user because posting is an explicit order, not a step of the flow.

## Agents report success they did not reach

LLM agents are confident when they are wrong. A 2026 study of agent failures, "From Confident Closing to Silent Failure", reports that between 44% and 52% of the failures it analysed on tau2-bench were the agent confidently claiming completion against what the environment actually showed, and 75.8% on AppWorld. The same paper reports that LLM judges reading the transcript miss most of these, because they anchor on confident language. "Are Autonomous Web Agents Good Testers?" measured a web testing agent (PinATA) and reported about 60% correct verdicts over a 113 case benchmark. Those numbers are as reported by the papers; the harness did not reproduce them.

The consequence for the design: the verifier looks at artifacts, not at the narrative. Anthropic's guide on agent evals draws the same line between the transcript (what the agent said and did) and the outcome (the final state of the environment), and says to grade the outcome. In practice the main session opens the screenshots in order and asks whether each one shows what its caption says, reads `evidence.json` for the status codes and error bodies, and opens `trace.zip` when the screenshots are not enough. The tester's sentence "the note was not deleted" is a pointer to `03-after-reload.png`, not evidence by itself.

## A failure seen once is not a bug yet

Flaky tests are a studied problem. Luo and colleagues analysed 201 fixes of flaky tests across 51 projects (FSE 2014) and found async waits, concurrency and test order dependency as the top causes. A browser agent adds its own: a toast that disappeared before the screenshot, a record another agent was editing, a cold cache after deploy.

So a failure enters a report only after `reproduce` reruns it from scratch, in a new browser session, and gets the same verdict every time. The result is written as a count, `BUG 2/2`, not as a yes. A count tells the reader how strong the claim is, and borrows the idea of pass^k from agent evaluation: run it k times, report how many agreed. Verdicts that disagree come out as `FLAKY 1/2`, which is an observation for the comment, not a bug for the tracker.

## NOT_TESTED is a verdict of its own

When a case cannot run, the honest answer is neither OK nor BUG. If the case needs a kind of record the environment does not have, or a role nobody configured, or a service that is not deployed, the verdict is `NOT_TESTED` with a reason (`missing-data`, `no-access`, `env-down`, `blocked-by-other-bug`, `script-error`). Calling it OK hides a gap in coverage. Calling it BUG sends a developer after a problem that lives in the environment. Given how often agents get verdicts wrong, a third answer that says "I could not tell" is worth keeping. `reproduce` also turns a crash in the test script into `NOT_TESTED` with reason `script-error`, because a script that threw says nothing about the app.

## Every bug names its oracle

An oracle is how you recognise a problem. Michael Bolton's FEW HICCUPPS lists the consistency oracles testers use: the product should be consistent with its history, its image, comparable products, the claims made about it, user desires, itself, its purpose and applicable standards, and a familiar problem pattern is also a signal. The harness asks each finding to name at least one. Most bugs in a feature test are inconsistent with a Claim (the acceptance criterion, quoted verbatim). Many others are inconsistent with the Product itself: the same action works on another screen. A finding that names no oracle is usually taste, and it becomes an observation in the comment.

Quoting the criterion verbatim matters more than it looks. The tester copies it into the "Requirement" line of the draft, and a paraphrase there turns into a fact the team never wrote.

## The environment lies

A test environment is rarely a clean copy of production. In the project this harness came from, the staging environment produced several fake bugs before anyone learned to rule it out:

| Looked like | Was |
|---|---|
| a button the feature adds is missing | the environment's front end was built before the feature |
| 500 with "invalid column name" | a migration nobody applied, because no service applied migrations on boot |
| 403 for a profile that should have access | permission data the reference environment had and staging did not |
| a case impossible to run | the kind of record it needs did not exist there |
| redirect to login with a valid session | the test started at "/" instead of an internal route |

Each of these would have become an issue against a feature that was fine. So the verifier rules out the environment before calling anything a bug, and the verifier, unlike the tester, may read code, call the API and read logs to do it. The generic version of this table is in the skill, and it grows: every environment has its own list, and after a few weeks it is the most useful page the team has about that environment.

## Charters and debriefs

Session-based test management (Jonathan and James Bach) organises exploratory testing into time-boxed sessions, each driven by a charter ("explore X with Y to discover Z") and closed by a debrief called PROOF: Past, Results, Outlook, Obstacles, Feelings. The harness maps onto it without much translation. One tester agent is one session. The charter is the prompt's "Explore <area> with <profiles> to find out whether <criteria> hold". The 15 minute time box is the session length. The session report the agent returns is the debrief, and its "Obstacles" section is where environment problems show up first: missing data, unexpected 403s, screens that look older than the feature.

## Related

- [How it works](how-it-works.md): the pieces and the flow
- [Landscape](landscape.md): the full reference list
- [Bug report reference](../reference/bug-report.md): the fields a verified bug carries
