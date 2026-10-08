// Checks the tutorial challenge (page 06) by end state: what is in evidence/ and in the app,
// not which commands you typed. Run from the repo root: node examples/check-challenge.mjs
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, openSession } from 'mini-qa-harness';

const cfg = await loadConfig();
const SEED = ['Welcome', 'Groceries'];

function results(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...results(p));
    else if (e.name === 'result.json') out.push({ dir, ...JSON.parse(readFileSync(p, 'utf8')) });
  }
  return out;
}

function fail(what, next) {
  console.log(`NOT YET: ${what}`);
  console.log(`  next: ${next}`);
  process.exit(1);
}

// 1. A reproduce() result, run as the profile the criterion talks about.
const all = results(cfg.evidenceDir);
if (!all.length) fail('no reproduce() result under evidence/', 'run your case with reproduce(..., { times: 2 }) so it writes result.json');
const asViewer = all.filter((r) => r.profile === 'viewer');
if (!asViewer.length) fail(`${all.length} result(s) found, none ran as the viewer profile`, 'the criterion is about viewers: pass { profile: \'viewer\' } to reproduce()');

// 2. A bug seen in every run, at least twice, from fresh sessions.
const bugs = asViewer.filter((r) => r.verdict === 'BUG' && r.times >= 2);
if (!bugs.length) {
  const seen = asViewer.map((r) => `${r.caseId}: ${r.summary}`).join(', ');
  fail(`no viewer case ends as BUG k/k with k >= 2 (found: ${seen})`, 'open the screenshots of your runs and compare what the screen allowed with the criterion');
}

// 3. The runs' own network log proves it: a write the viewer should not have been able to make, accepted.
const proven = bugs.find((r) => readdirSync(r.dir).filter((d) => d.startsWith('run-')).every((run) => {
  const ev = JSON.parse(readFileSync(join(r.dir, run, 'evidence.json'), 'utf8'));
  return ev.profile === 'viewer' && ev.network.some((c) => c.method === 'DELETE' && /^\/api\/notes\/\d+/.test(c.url) && c.status >= 200 && c.status < 300);
}));
if (!proven) fail('your BUG verdict is not backed by the network log of every run', 'the verdict must come from what the page did as viewer; check s.since(mark) in each run');

// 4. Data rule: the notes you did not create are still there.
const s = await openSession({ profile: 'admin', caseId: '_check', trace: 'off', config: cfg });
const notes = await (await s.page.request.get(cfg.baseUrl + '/api/notes')).json();
await s.close();
rmSync(join(cfg.evidenceDir, '_check'), { recursive: true, force: true });
const missing = SEED.filter((t) => !notes.some((n) => n.title === t));
if (missing.length) fail(`seed note(s) gone: ${missing.join(', ')}. A test only deletes data it created`, 'restart the demo (it resets the data), create your own note in the case, and run again');

console.log(`DONE: ${proven.caseId} ${proven.summary} as viewer, backed by the network log, seed data intact.`);
