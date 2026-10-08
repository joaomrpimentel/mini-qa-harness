// Worked example from the tutorial: "an admin can delete any note".
// Run against the demo app: node examples/delete-pinned.mjs
import { reproduce } from 'mini-qa-harness';

const result = await reproduce('delete-pinned', { profile: 'admin', times: 2 }, async (s, { run }) => {
  const title = `QA-demo pinned ${run}-${Date.now() % 10000}`;
  const p = s.page;

  // Arrange: a pinned note of our own, so we never touch someone else's data.
  await s.goto('/notes');
  await p.getByPlaceholder('Title').fill(title);
  await p.getByLabel('Pin to top').check();
  await p.getByRole('button', { name: 'Save note' }).click();
  const card = p.locator('article').filter({ hasText: title });
  await card.waitFor();
  await s.shot('pinned-note-created');

  // Act: delete it the way a person would.
  const m = s.mark();
  await card.getByRole('button', { name: 'Delete note' }).click();
  await p.getByRole('button', { name: 'Yes, delete' }).click();
  await p.waitForTimeout(800);
  const messages = await s.messages();
  await s.shot('after-delete');

  // Assert through the UI: reload and look again.
  await p.reload({ waitUntil: 'networkidle' });
  const stillThere = await p.locator('article').filter({ hasText: title }).count();
  await s.shot('after-reload');

  const calls = s.since(m);
  if (!stillThere) return { verdict: 'OK', observed: 'note gone after reload' };
  return {
    verdict: 'BUG',
    observed: `note still listed after reload; screen said ${JSON.stringify(messages)}; ` +
      calls.map((c) => `${c.method} ${c.url} -> ${c.status}`).join(', '),
    leftover: title,
  };
});

console.log(result.summary);
for (const r of result.runs) console.log(`  run ${r.run}: ${r.observed}`);
