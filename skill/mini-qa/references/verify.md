# Verifying a finding

The tester's report is a claim. Verification decides whether it is a bug in the feature, a problem of the environment, or nothing. Look at artifacts, not at the agent's wording: agents report confident conclusions that the evidence does not support, and a reviewer who reads only the conclusion inherits the mistake.

## Order

1. **Open the evidence.** `evidence/<case>/run-*/`: the screenshots in order, `evidence.json` (network, console, page errors), `trace.zip` (`npx playwright show-trace evidence/<case>/run-1/trace.zip`). Does each screenshot show what its caption says?
2. **Check reproducibility.** `result.json` says `BUG 2/2`? `FLAKY` goes back to the tester or becomes an observation.
3. **Rule out the environment** with the table below. Reproduce it yourself if needed; unlike the tester, you may read code, call the API and read logs.
4. **Name the oracle.** Which requirement or expectation does the behaviour contradict? Quote it.
5. **Find the likely cause** in the code of the version under test, when it helps route the bug. Keep it out of the issue body unless the team wants it there: a bug report describes behaviour. It may also change the owner: the failing call may come from old code, not the PR under test.
6. **Classify**: BUG (draft goes to the user), NOT_TESTED with reason (goes in the comment), observation (goes in the comment, low severity, no issue), or nothing.

## Environment traps

| Symptom | Usual cause | How to tell |
|---|---|---|
| A button or field the feature adds is not on screen | Front end of the environment is older than the feature | Compare the deployed version/digest with the PR merge |
| 500 with "invalid column" or "relation does not exist" | Migration not applied | Check the schema or migration table |
| 403 for a profile that should have access | Permission data missing in this environment | Compare with the reference environment before calling it a bug |
| 503, "service unavailable", "not deployed" | Dependency not running here | Health endpoint, deployment list |
| A case is impossible because a kind of record does not exist | Test data missing | NOT_TESTED, reason missing-data |
| Redirect to login with a valid session | Started at "/" or a public route | Start from `startPath` |
| Passes once, fails once | Timing, leftover data, another agent editing the same record | Rerun alone with `reproduce` |

Every environment has its own list. Add rows to this table as you meet them: it is the most valuable page of the skill after a few weeks of use.

## Oracles

From Bolton's FEW HICCUPPS. A finding should name at least one.

| Oracle | The product is inconsistent with... |
|---|---|
| Claim | the acceptance criteria, docs, or what the product says it does |
| Product | itself: the same action works on another screen |
| History | a previous version |
| Comparable | similar products the users know |
| User desires | what a reasonable user expects |
| Purpose | the reason the feature exists |
| Standards | a law, accessibility rule or platform convention |
| Image | the organisation's image (embarrassing text, broken layout) |
| Familiar problem | a known bug pattern (lost update, double submit) |

## Severity

| Level | Means |
|---|---|
| Blocker | the main flow of the feature cannot be completed, or data is lost or exposed |
| High | a criterion fails with no workaround |
| Medium | a criterion fails with a workaround, or the message misleads |
| Low | cosmetic, wording, minor inconsistency |
