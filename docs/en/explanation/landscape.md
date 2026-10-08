# Landscape

Several tools let an LLM drive a browser, and some sell themselves as AI testing. This page places the harness among them: what it borrowed, what it does differently, and the references behind its rules. Descriptions reflect each project's documentation as read in October 2026.

## Browser agents and AI testing tools

| Tool | What it is | Evidence | False positives and review |
|---|---|---|---|
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | MCP server that drives a browser from accessibility snapshots, no vision model needed | `--save-trace` and `--save-video` | no notion of verdict or review |
| [Playwright Test Agents](https://playwright.dev/docs/test-agents) | planner writes a Markdown test plan, generator turns it into specs, healer replays failing tests and proposes patches | the generated tests and their reports | output is code for a person to review; the healer can patch a test around a real bug |
| [browser-use](https://github.com/browser-use/browser-use) | Python agent loop where the LLM decides every step | screenshots of the loop | no QA verdict layer |
| [Stagehand](https://docs.stagehand.dev/) | Playwright-style code with `act`, `observe`, `extract` and `agent` primitives; cached actions self-heal | whatever the script records | aimed at deterministic automation, not reporting |
| [Skyvern](https://www.skyvern.com/docs/getting-started/introduction) | vision plus LLM with planner, task agent and a validator that checks if the goal was met | recordings per task | the validator is the closest built-in checker among the agent frameworks |
| [Shortest](https://github.com/antiwork/shortest) | plain English end-to-end tests run by Claude on Playwright | test results | callback functions add code-level assertions under the LLM |
| [Midscene.js](https://midscenejs.com/introduction) | screenshot-driven automation with `aiAssert` | an HTML report replaying each action, query and assertion | assertions are model judgements |
| [QA.tech](https://qa.tech) | commercial autonomous exploratory agents on every PR | screenshots, console, network and the agent's reasoning at the failure | the public site does not describe human review |
| [Momentic](https://bug0.com/knowledge-base/momentic-features) | commercial; steps stored as natural-language intent, resolved at runtime | platform reports | sells AI assertions as the way to reduce false positives |

The pattern across the field: most effort goes into keeping tests running when the UI changes. Few tools separate "the agent says this is a bug" from "this is a verified bug", and none of the products above documents a person approving a report before it is filed. That gap is where this harness sits. It does not try to be a test runner or a crawler; it is the piece between an agent finding something and a team reading about it.

## Evidence and recording tools

| Tool | Captures | Notes |
|---|---|---|
| [Playwright trace](https://playwright.dev/docs/trace-viewer) | actions, DOM snapshots around each action, network with bodies, console, filmstrip | the docs recommend `retain-on-failure` when not retrying; the harness uses that default |
| [Playwright video](https://playwright.dev/docs/videos) and [HAR](https://playwright.dev/docs/mock#mocking-with-har-files) | video of the context; full network archive | not used by default; the network log in `evidence.json` is smaller and redacted |
| [Jam](https://jam.dev/docs/jam-mcp) | video, screenshots, console, network, user events, metadata | the MCP server reads, comments on and updates Jams; no public way to create one, hence the extension |
| [Replay.io](https://docs.replay.io/basics/replay-mcp/overview) | the runtime itself, replayable deterministically | stronger than video for a developer debugging; has a CLI and an MCP |
| [rrweb](https://github.com/rrweb-io/rrweb) | DOM session record and replay | open source and self-hostable, no SaaS account needed |
| [Bird Eats Bug](https://birdeatsbug.com/feature/browser-extension) | screen, clicks and keys, console, network, system info | an extension in the same space as Jam |

Loading an extension into Playwright only works with a persistent context and the bundled Chromium, as the [Playwright docs on extensions](https://playwright.dev/docs/chrome-extensions) describe. That constraint shapes `src/jam.mjs`.

## What the harness borrowed

- **Validator as a separate role**, from Skyvern's design and from maker-checker: the main session verifies, the tester does not grade itself.
- **Grade the outcome, not the transcript**, from Anthropic's guide on agent evals and the false success findings: the verifier opens artifacts.
- **Trace kept on failure**, from Playwright's own guidance: `trace.zip` exists only for runs whose verdict is not OK.
- **Reproduction as a count**, from pass^k in agent evaluation and the flaky test literature: `BUG 2/2`, not "confirmed".
- **NOT_TESTED with a reason code**, because measured verdict accuracy of testing agents leaves room for "could not tell".
- **Charters and a debrief with obstacles**, from session-based test management.
- **Named oracles**, from FEW HICCUPPS.
- **Small parallel workers with a clear objective, output format and boundary**, from Anthropic's notes on its multi-agent research system.

## What it does not do, on purpose

- **No self-healing.** When a selector stops matching, the case fails and a person looks. A healer that rewrites a test until it passes can write a real bug out of the test.
- **No posting without a person.** The tool that can open an issue is never in the tester's hands.
- **No API calls from testers.** The network log is what the UI did. A tester that builds requests by hand tests the API, which is a different job.
- **No crawling.** Testers follow charters derived from acceptance criteria. Exploration happens inside a charter, time-boxed.

Jam is optional for the same reason the trace is not: it serves the developer who opens the issue, and the harness works without it. rrweb or Replay could fill the same slot; the harness does not implement them today.

## References

Tools and documentation:

- Playwright MCP: https://playwright.dev/mcp/introduction and https://github.com/microsoft/playwright-mcp
- Playwright Test Agents: https://playwright.dev/docs/test-agents
- Playwright trace viewer: https://playwright.dev/docs/trace-viewer
- Playwright videos: https://playwright.dev/docs/videos
- Playwright HAR: https://playwright.dev/docs/mock#mocking-with-har-files
- Playwright and Chrome extensions: https://playwright.dev/docs/chrome-extensions
- browser-use: https://github.com/browser-use/browser-use
- Stagehand: https://docs.stagehand.dev/ and https://github.com/browserbase/stagehand
- Skyvern: https://www.skyvern.com/docs/getting-started/introduction
- Shortest: https://github.com/antiwork/shortest
- Midscene.js: https://midscenejs.com/introduction
- QA.tech: https://qa.tech
- Momentic (third-party summary): https://bug0.com/knowledge-base/momentic-features
- Jam MCP: https://jam.dev/docs/jam-mcp
- Replay.io MCP: https://docs.replay.io/basics/replay-mcp/overview and time travel: https://docs.replay.io/basics/time-travel/how-does-time-travel-work
- rrweb: https://github.com/rrweb-io/rrweb
- Bird Eats Bug: https://birdeatsbug.com/feature/browser-extension

Testing practice:

- Session-Based Test Management, Jonathan and James Bach: https://www.satisfice.com/sbtm
- FEW HICCUPPS, Michael Bolton: https://developsense.com/blog/2012/07/few-hiccupps and https://developsense.com/resource/Oracles.pdf
- Heuristic Test Strategy Model (SFDPOT), James Bach: https://www.satisfice.com/download/heuristic-test-strategy-model
- Bettenburg, Just, Schröter, Weiss, Premraj, Zimmermann, "What Makes a Good Bug Report?", FSE 2008: https://www.st.cs.uni-saarland.de/publications/details/bettenburg-tr-2008/ (summary: https://neverworkintheory.org/2011/08/30/what-makes-a-good-bug-report.html). Developers asked most for steps to reproduce, stack traces and test cases.
- ISO/IEC/IEEE 29119-3:2021, test documentation, including the incident report: https://www.iso.org/standard/79429.html. The field list used in the [bug report reference](../reference/bug-report.md) comes from secondary summaries such as https://www.microtool.de/en/document-management/test-documentation-with-iso-iec-ieee-29119-32021/, not from the standard text.
- Luo, Hariri, Eloussi, Marinov, "An Empirical Analysis of Flaky Tests", FSE 2014: https://siebelschool.illinois.edu/news/marinov-fse-test-of-time
- Parry, Kapfhammer, Hilton, McMinn, "A Survey of Flaky Tests", TOSEM 2022: https://eprints.whiterose.ac.uk/id/eprint/230095
- Maker-checker: https://en.wikipedia.org/wiki/Maker-checker and NIST SP 800-53 AC-5: https://www.stigviewer.com/controls/nist-800-53/AC-5

LLM agents:

- "From Confident Closing to Silent Failure", ICML 2026: https://arxiv.org/pdf/2606.09863. The 44% to 52% and 75.8% false success figures are as reported by the paper.
- Chevrot et al., "Are Autonomous Web Agents Good Testers?": https://arxiv.org/abs/2504.01495. The roughly 60% correct verdicts for PinATA is as reported by the paper.
- AgentRewardBench: https://arxiv.org/abs/2504.08942
- WebProber: https://arxiv.org/abs/2509.05197
- Anthropic, "Building effective agents": https://www.anthropic.com/engineering/building-effective-agents
- Anthropic, "How we built our multi-agent research system": https://www.anthropic.com/engineering/multi-agent-research-system
- Anthropic, "Demystifying evals for AI agents": https://anthropic.com/engineering/demystifying-evals-for-ai-agents
