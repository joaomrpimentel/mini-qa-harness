// Records the delete-pinned bug with Jam. Needs `qa jam setup` and `qa jam login` first.
// Creates a real Jam in the signed-in account. Usage:
//   node examples/jam-record.mjs "<title>" "<description>"
//
// Set the scene before start(): the video should show only the reproduction.
// Inside the recorded part, use humanClick/humanType so the viewer sees the mouse.
import { openJam, showCursor, humanClick, humanType } from 'mini-qa-harness';

const [title, description] = process.argv.slice(2);
if (!title || !description) {
  console.error('usage: node examples/jam-record.mjs "<title>" "<description>"');
  process.exit(1);
}

const jam = await openJam({ profile: 'admin' });
const { page } = jam;
await showCursor(jam.context);
await page.goto('http://localhost:4173/notes', { waitUntil: 'networkidle' });

await jam.start();
const noteTitle = `QA-demo jam ${Date.now() % 10000}`;
await humanType(page, page.getByPlaceholder('Title'), noteTitle);
await humanClick(page, page.getByLabel('Pin to top'));
await humanClick(page, page.getByRole('button', { name: 'Save note' }));
const card = page.locator('article').filter({ hasText: noteTitle });
await card.waitFor();
await page.waitForTimeout(1000);
await humanClick(page, card.getByRole('button', { name: 'Delete note' }));
await humanClick(page, page.getByRole('button', { name: 'Yes, delete' }));
await page.waitForTimeout(2500);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const links = await jam.stopAndCreate(title, description);
console.log(links.length ? links.join('\n') : 'no link: the Jam stayed as a local draft');
await jam.close();
