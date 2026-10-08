# How to write a screen helper

A tester agent with a 15 minute time box can spend half of it finding the right button. A screen helper keeps the selectors the first agent discovered on a screen, so the next agent on that screen starts from them.

## When

Write one after the first case that passes through a screen, from that case's script. Do not write helpers ahead of time for screens nobody tested.

## 1. Create the file

One file per screen, under `helpers/`, named after the screen: `helpers/notes.mjs`, `helpers/orders.mjs`. Export the route and small functions that take a Playwright `page` (or the session, for navigation):

```js
// Screen helper for /notes. Selectors from the delete-pinned case.
export const ROUTE = '/notes';

export async function open(s) {
  await s.goto(ROUTE);
}

export function card(page, title) {
  return page.locator('article').filter({ hasText: title });
}

// Clicks Delete and confirms. Does not assert the outcome.
export async function remove(page, title) {
  await card(page, title).getByRole('button', { name: 'Delete note' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await page.waitForTimeout(800);
}
```

The full example for the demo app is `examples/helpers/notes.mjs`.

## 2. Write down what cost a run to find

At the top of the file, list the facts about the screen that are not obvious from looking at it: the route to start from, an accessible name that differs from the visible text (`Delete note` vs `Delete`), a confirmation dialog the request waits for, a control that only some roles see. These lines save more time than the functions.

## 3. Keep helpers neutral

- Use role, label and visible text (`getByRole`, `getByLabel`, `getByText`), like the agents do. No CSS classes from the build.
- Helpers act; they do not assert. "Delete worked" is the case's verdict, and a helper that hides a failure turns a bug into a pass.
- No test data inside the helper, except fixed records created for testing, documented as such.

## 4. Hand it to the agents

Add one line to the tester prompt: `Use helpers/notes.mjs for selectors.` When an agent finds a selector the helper lacks, or one that changed, add it to the file after the round.

## Related

- [Run with Claude Code](run-with-claude-code.md)
- [API reference](../reference/api.md)
