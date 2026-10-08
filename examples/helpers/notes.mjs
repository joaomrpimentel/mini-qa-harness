// Screen helper for the demo Notes screen (/notes).
// Selectors found while writing the delete-pinned case. A tester agent imports these
// instead of spending its time box looking for buttons.
//
// Facts about this screen that cost a run to discover:
// - "/" redirects; start at /notes.
// - Each note is an <article>; its delete button has the accessible name "Delete note",
//   while the visible text is just "Delete".
// - Delete opens a <dialog>; the request only goes out on "Yes, delete".
// - The "New note" form is hidden for the viewer role.

export const ROUTE = '/notes';

export async function open(s) {
  await s.goto(ROUTE);
}

export function card(page, title) {
  return page.locator('article').filter({ hasText: title });
}

export async function titles(page) {
  return (await page.locator('article h3').allInnerTexts()).map((t) => t.replace(/Pinned$/, '').trim());
}

export async function create(page, { title, body = '', pinned = false }) {
  await page.getByPlaceholder('Title').fill(title);
  if (body) await page.getByPlaceholder('Write something').fill(body);
  if (pinned) await page.getByLabel('Pin to top').check();
  await page.getByRole('button', { name: 'Save note' }).click();
  await card(page, title).waitFor();
}

// Clicks Delete and confirms. Does not assert the outcome: the case decides what "worked" means.
export async function remove(page, title) {
  await card(page, title).getByRole('button', { name: 'Delete note' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await page.waitForTimeout(800);
}
