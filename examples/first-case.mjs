// Tutorial, page 02: one test case, one session, no repetition yet.
// Criterion under test: "An admin can delete any note."
// Run against the demo app: node examples/first-case.mjs
import { openSession } from 'mini-qa-harness';

const PINNED = false; // the note this case creates: pinned or not

// 1. Open a signed-in session. Evidence goes to evidence/first-case/.
const s = await openSession({ profile: 'admin', caseId: 'first-case' });
const p = s.page;
const title = `QA-demo first ${Date.now() % 10000}`;

// 2. Arrange: a note of our own.
await s.goto('/notes');
await p.getByPlaceholder('Title').fill(title);
if (PINNED) await p.getByLabel('Pin to top').check();
await p.getByRole('button', { name: 'Save note' }).click();
const card = p.locator('article').filter({ hasText: title });
await card.waitFor();
await s.shot('note-created');

// 3. Act: delete it, and remember where the network log was before the click.
const m = s.mark();
await card.getByRole('button', { name: 'Delete note' }).click();
await p.getByRole('button', { name: 'Yes, delete' }).click();
await p.waitForTimeout(800);
const messages = await s.messages();
await s.shot('after-delete');

// 4. Assert through the screen: reload and look for the note.
await p.reload({ waitUntil: 'networkidle' });
const stillThere = await p.locator('article').filter({ hasText: title }).count();
await s.shot('after-reload');

const verdict = stillThere ? 'BUG' : 'OK';
console.log('screen said:', messages);
console.log('requests:', s.since(m).map((c) => `${c.method} ${c.url} -> ${c.status}`));
console.log('verdict:', verdict);

// 5. Close: writes evidence/first-case/evidence.json.
await s.close({ verdict });
