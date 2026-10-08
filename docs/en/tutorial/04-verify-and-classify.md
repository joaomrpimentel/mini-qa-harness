# 4. Bug or environment?

On page 3 the pinned delete failed 2 out of 2 times from fresh sessions. Reproducible is not the same as a bug in the feature, though. Test environments break in their own ways: a service that was never deployed, a migration nobody ran, a permission that exists in production but not here. A report blaming the feature for any of these wastes a developer's afternoon.

## The idea: the evidence decides, not the status code

A failing request and a red message on screen look the same whatever the cause. What tells them apart is in the evidence: the response body, the route, what the rest of the app does. The harness has three verdicts so that a case it could not really test does not have to pretend:

| Verdict | Means |
|---|---|
| `OK` | the requirement held |
| `BUG` | the requirement failed, and the cause is in what is being tested |
| `NOT_TESTED` + `reason` | the case could not be judged here; `env-down`, `missing-data`, `no-access`, `blocked-by-other-bug` or `script-error` |

`NOT_TESTED` is a result, and it goes in the report to the team. It tells them a criterion is still open and why.

## Worked example: two failures side by side

Run the case for the requirement "An admin can export all notes as CSV":

```bash
node examples/export-csv.mjs
```

```text
BUG 2/2
  run 1: screen said ["Export failed."]; GET /api/export -> 503 {"error":"export-service unavailable","hint":"not deployed in this environment"}
  run 2: screen said ["Export failed."]; GET /api/export -> 503 {"error":"export-service unavailable","hint":"not deployed in this environment"}
```

It says `BUG 2/2` because of the rule at the top of the file, which you can read in full:

```js
function classify(call) {
  if (call.status >= 400) return { verdict: 'BUG' };
  return { verdict: 'OK' };
}
```

Put the two failures next to each other:

| | Pinned delete (page 3) | Export |
|---|---|---|
| Status | `500` | `503` |
| Body | empty (`"body": null` in `evidence.json`) | `export-service unavailable`, `not deployed in this environment` |
| What the app is saying | something broke while handling a valid request | the service behind this button does not exist here |

The rule treats them the same. You can't.

## Guided practice (you decide)

Decide which verdict and reason the export case deserves. Copy the example to `cases/export-csv.mjs` and change `classify` so a `503` returns that verdict with its reason, while other errors stay `BUG`. Then run `node cases/export-csv.mjs`.

> **Expected:** the summary is `NOT_TESTED 2/2` and each run line ends with `(reason: env-down)`. If you still get `BUG 2/2`, your new condition comes after the `>= 400` line, which catches the `503` first.

Before calling the export a real `NOT_TESTED`, a verifier would also confirm the hint is true: is the export service in the deployment list of this environment? The full checklist is in [Verification](../explanation/verification.md).

Next: [5. Write the report](05-write-the-report.md)
