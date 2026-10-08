# Bug report template

`templates/bug-report.md`. A draft starts from it, is reviewed by a person, and is turned into an issue by `qa issue render`.

## Frontmatter

Kept for the reviewer, dropped by `qa issue render`.

| Field | Content |
|---|---|
| `case` | case id, the folder under `evidence/` |
| `reproduced` | the `summary` from `result.json`, e.g. `BUG 2/2` |
| `oracle` | which oracle says the behaviour is wrong (see below) |
| `severity` | `Blocker`, `High`, `Medium` or `Low` |

## Body sections

| Section | Content |
|---|---|
| `# <title>` | one line: what fails, where, and the visible consequence. Becomes the issue title |
| Requirement violated | flow or context; the acceptance criterion copied verbatim; related ticket; route and UI element |
| Environment | URL, build (version, commit or image digest), profile and role, browser and viewport |
| Severity | level and one sentence on who is affected and what they cannot do |
| Steps to reproduce | numbered, from sign-in, with exact UI text in backticks |
| Input data | table of field and value, with the test prefix |
| Expected | what should happen, traced to the requirement |
| Actual | screen text quoted exactly, plus method, route, status and body from the network |
| Evidence | Jam link first when there is one; one screenshot per step, with a caption |

## Mapping to the literature

Bettenburg et al., "What Makes a Good Bug Report?" (FSE 2008), surveyed developers of Apache, Eclipse and Mozilla: steps to reproduce, stack traces and test cases were the most wanted items, and wrong steps and incomplete information the worst obstacles. ISO/IEC/IEEE 29119-3 defines the incident report as a test document. The field list below for 29119-3 comes from secondary summaries and should be checked against the standard.

| Template section | Bettenburg et al. 2008 | ISO/IEC/IEEE 29119-3 incident report |
|---|---|---|
| Title | summary | description (summary) |
| Requirement violated | expected behaviour, traced to a source | context |
| Environment | version, build, platform | context |
| Severity | severity | originator's severity and priority assessment |
| Steps to reproduce | steps to reproduce (most wanted) | description |
| Input data | test case | description |
| Expected / Actual | expected and observed behaviour | description |
| Evidence: screenshots, network status and body | screenshots, stack traces | description, attachments |
| Evidence: Jam or `trace.zip` | test case, screenshots | attachments |
| Frontmatter `reproduced` | (reproducibility is the main obstacle reported) | |
| Not in the template | | timing, originator, risk, status: filled by the tracker |

## Oracles

From Michael Bolton's FEW HICCUPPS. A finding names at least one, or it is an observation and not a bug.

| Oracle | The product is inconsistent with |
|---|---|
| Claim | the acceptance criteria, docs, or what the product says it does |
| Product | itself: the same action works on another screen |
| History | a previous version |
| Comparable | similar products the users know |
| User desires | what a reasonable user expects |
| Purpose | the reason the feature exists |
| Standards | a law, accessibility rule or platform convention |
| Image | the organisation's image |
| Familiar problem | a known bug pattern (lost update, double submit) |

## Severity

| Level | Means |
|---|---|
| Blocker | the main flow of the feature cannot be completed, or data is lost or exposed |
| High | a criterion fails with no workaround |
| Medium | a criterion fails with a workaround, or the message misleads |
| Low | cosmetic, wording, minor inconsistency |

## Verdicts

Every tested criterion ends with one of these, in the result of `reproduce()` and in the comment on the ticket.

| Verdict | Means |
|---|---|
| `OK` | every run passed |
| `BUG k/k` | every run failed the same way; draft a report |
| `NOT_TESTED` | the case could not run. Reasons used by the tester prompt: `missing-data`, `no-access`, `env-down`, `blocked-by-other-bug`, `script-error` |
| `FLAKY j/k` | runs disagreed; rerun alone, or report as an observation |

## Sources

- Bettenburg, Just, Schröter, Weiss, Premraj, Zimmermann. What Makes a Good Bug Report? FSE 2008. https://www.st.cs.uni-saarland.de/publications/details/bettenburg-tr-2008/
- ISO/IEC/IEEE 29119-3:2021. https://www.iso.org/standard/79429.html
- Bolton, FEW HICCUPPS. https://developsense.com/blog/2012/07/few-hiccupps
