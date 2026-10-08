// Tutorial, page 04: the Export CSV button.
// Criterion under test: "An admin can export all notes as CSV."
// Run against the demo app: node examples/export-csv.mjs
import { reproduce } from 'mini-qa-harness';

// The rule that turns what the page did into a verdict. Edit it on page 04.
function classify(call) {
  if (call.status >= 400) return { verdict: 'BUG' };
  return { verdict: 'OK' };
}

const result = await reproduce('export-csv', { profile: 'admin', times: 2 }, async (s) => {
  await s.goto('/notes');
  const m = s.mark();
  await s.page.getByRole('button', { name: 'Export CSV' }).click();
  await s.page.waitForTimeout(800);
  const messages = await s.messages();
  await s.shot('after-export');

  const call = s.since(m, { all: true }).find((c) => c.url.startsWith('/api/export'));
  if (!call) return { verdict: 'NOT_TESTED', reason: 'script-error', observed: 'no export request seen' };
  return { ...classify(call), observed: `screen said ${JSON.stringify(messages)}; GET ${call.url} -> ${call.status} ${call.body ?? ''}` };
});

console.log(result.summary);
for (const r of result.runs) console.log(`  run ${r.run}: ${r.observed}${r.reason ? ` (reason: ${r.reason})` : ''}`);
