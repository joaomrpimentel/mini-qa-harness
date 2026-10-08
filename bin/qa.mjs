#!/usr/bin/env node
// qa: the command-line side of the harness. Library functions do the work; this file parses args.
import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, profileOf } from '../src/config.mjs';
import { openSession } from '../src/session.mjs';
import { setupJam, loginJam, openJam } from '../src/jam.mjs';
import { loginGitHub, uploadToGitHub, checkIssueImages } from '../src/github.mjs';
import { renderIssueFile, draftImages } from '../src/report.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const HELP = `qa: mini QA harness

  qa init                              write qa.config.mjs and .gitignore entries
  qa smoke [profile...]                open startPath with each profile, screenshot, list errors
                                       (exit 1 on any 401 or 5xx)
  qa login <profile>                   sign in by hand once; saves the storage state of that profile
  qa jam setup                         download and patch the Jam extension into .qa/jam-ext
  qa jam login                         sign in to Jam once (visible window)
  qa jam smoke [profile]               check the Jam popup offers "Record Tab"
  qa gh login                          sign in to GitHub once (visible window), for uploads
  qa gh upload <owner/repo> <file...>  upload images, print {file: url} JSON
  qa issue render <draft.md> [--upload <owner/repo>] [--out body.md]
                                       draft -> title (stdout) + body file, uploading local images
  qa gh check <issue-url>              count images in an issue body that loaded

Config: ./qa.config.mjs (or QA_CONFIG). Docs: docs/en/README.md`;

const [cmd, sub, ...rest] = process.argv.slice(2);

async function smoke(cfg, profiles) {
  const names = profiles.length ? profiles : Object.keys(cfg.profiles);
  if (!names.length) names.push(undefined);
  let failed = 0;
  for (const name of names) {
    const s = await openSession({ profile: name, caseId: `smoke/${name ?? 'anonymous'}`, trace: 'off', config: cfg });
    try {
      await s.goto(cfg.startPath);
      await s.page.waitForTimeout(800);
      const shot = await s.shot('start');
      const errors = s.network.filter((e) => e.status >= 400).map((e) => `${e.status} ${e.method} ${e.url}`);
      // 403 can be right for a weaker profile; 401 (not signed in) and 5xx never are.
      const fatal = s.network.some((e) => e.status === 401 || e.status >= 500);
      console.log(`${(name ?? 'anonymous').padEnd(12)} ${s.page.url().replace(cfg.baseUrl, '') || '/'}  errors: ${[...new Set(errors)].slice(0, 5).join('; ') || 'none'}  ${shot}`);
      if (fatal) failed++;
    } finally {
      await s.close();
    }
  }
  return failed;
}

async function login(cfg, name) {
  const prof = profileOf(cfg, name);
  if (prof.auth?.kind !== 'storageState') throw new Error(`profile "${name}" does not use storageState(); nothing to record`);
  const browser = await chromium.launch({ headless: false, channel: cfg.channel });
  const context = await browser.newContext({ viewport: null, locale: cfg.locale });
  const page = await context.newPage();
  await page.goto(cfg.baseUrl + cfg.startPath);
  console.log(`Sign in as "${name}" in the window, then come back here and press Enter.`);
  await new Promise((r) => process.stdin.once('data', r));
  mkdirSync(dirname(prof.auth.path), { recursive: true });
  await context.storageState({ path: prof.auth.path });
  await browser.close();
  console.log(`saved ${prof.auth.path}. Treat it like a password: it is a live session.`);
}

function init() {
  if (existsSync('qa.config.mjs')) console.log('qa.config.mjs exists, left as is');
  else { copyFileSync(join(ROOT, 'qa.config.example.mjs'), 'qa.config.mjs'); console.log('wrote qa.config.mjs'); }
  const ignore = ['.qa/', 'evidence/'];
  const gi = existsSync('.gitignore') ? readFileSync('.gitignore', 'utf8') : '';
  const missing = ignore.filter((l) => !gi.split('\n').includes(l));
  if (missing.length) writeFileSync('.gitignore', gi + (gi && !gi.endsWith('\n') ? '\n' : '') + missing.join('\n') + '\n');
  console.log('.gitignore covers .qa/ and evidence/');
}

try {
  const cfg = await loadConfig();
  if (cmd === 'init') init();
  else if (cmd === 'smoke') process.exitCode = await smoke(cfg, [sub, ...rest].filter(Boolean)) ? 1 : 0;
  else if (cmd === 'login') await login(cfg, sub);
  else if (cmd === 'jam' && sub === 'setup') { const r = await setupJam(cfg); console.log(`Jam ${r.version} unpacked in ${r.ext}`); }
  else if (cmd === 'jam' && sub === 'login') await loginJam(cfg);
  else if (cmd === 'jam' && sub === 'smoke') {
    const jam = await openJam({ profile: rest[0], config: cfg });
    await jam.page.goto(cfg.baseUrl + cfg.startPath, { waitUntil: 'networkidle' });
    const text = (await jam.popupText()).replace(/\n+/g, ' | ');
    console.log(text.slice(0, 160));
    await jam.close();
    if (!/Record Tab/.test(text)) { console.error('popup does not offer "Record Tab": signed in? run qa jam login'); process.exitCode = 1; }
  }
  else if (cmd === 'gh' && sub === 'login') console.log('signed in as', await loginGitHub(cfg));
  else if (cmd === 'gh' && sub === 'upload') console.log(JSON.stringify(await uploadToGitHub(cfg, rest[0], rest.slice(1)), null, 1));
  else if (cmd === 'gh' && sub === 'check') { const r = await checkIssueImages(cfg, rest[0]); console.log(`images ${r.images}, loaded ${r.loaded}`); if (r.loaded < r.images) process.exitCode = 1; }
  else if (cmd === 'issue' && sub === 'render') {
    const draft = rest[0];
    const opt = (k) => { const i = rest.indexOf(k); return i === -1 ? undefined : rest[i + 1]; };
    let urls = {};
    const repo = opt('--upload');
    if (repo) {
      const imgs = draftImages(readFileSync(draft, 'utf8')).map((p) => resolve(dirname(draft), p));
      if (imgs.length) urls = await uploadToGitHub(cfg, repo, imgs);
    }
    const { title, body } = renderIssueFile(draft, { urls, issueRefRepo: cfg.github.issueRefRepo });
    writeFileSync(opt('--out') ?? 'body.md', body);
    console.log(title);
  }
  else console.log(HELP);
} catch (e) {
  console.error('qa:', e.message);
  process.exitCode = 1;
}
