// A test session: a logged-in page that records its own evidence.
//
//   const s = await openSession({ profile: 'admin', caseId: 'delete-pinned' });
//   await s.goto('/notes');
//   const m = s.mark();
//   await s.page.getByRole('button', { name: 'Delete' }).click();
//   await s.shot('after-delete');
//   s.since(m)          // requests since the mark that changed state or failed
//   await s.close();    // writes evidence/<caseId>/evidence.json
//
// What it records is what the page itself did. The agent never calls the API directly,
// so the network log is evidence of the UI's behaviour, not of a hand-made request.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, profileOf, redact } from './config.mjs';

export async function newContext(browser, cfg, profile, extra = {}) {
  const context = await browser.newContext({ viewport: cfg.viewport, locale: cfg.locale, ...extra });
  await applyAuth(context, cfg, profile);
  return context;
}

export async function applyAuth(context, cfg, profile) {
  if (profile.auth) await profile.auth.apply(context, { config: cfg, profile: profile.name });
}

// Attaches network + console recorders to a page. Shared with the Jam recorder.
export function record(page, cfg) {
  const log = { network: [], console: [], pageErrors: [] };
  const base = cfg.baseUrl;
  page.on('response', async (r) => {
    const req = r.request();
    const url = r.url();
    if (req.resourceType() === 'document') return;
    if (!cfg.network.include.some((re) => re.test(url))) return;
    if (cfg.network.ignore.some((re) => re.test(url))) return;
    const entry = {
      t: new Date().toISOString(),
      method: req.method(),
      url: redact(cfg, url.startsWith(base) ? url.slice(base.length) || '/' : url).slice(0, 300),
      status: r.status(),
    };
    // Bodies only where they explain something: errors and writes.
    if (r.status() >= 400 || req.method() !== 'GET') {
      try { entry.body = redact(cfg, (await r.text()).slice(0, cfg.network.bodyLimit)); } catch { entry.body = null; }
    }
    log.network.push(entry);
  });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') log.console.push({ type: m.type(), text: redact(cfg, m.text()).slice(0, 500) });
  });
  page.on('pageerror', (e) => log.pageErrors.push(redact(cfg, e.message).slice(0, 500)));
  return log;
}

// trace: 'off' | 'on' | 'retain-on-failure'. With retain-on-failure the Playwright trace
// (DOM snapshots, network bodies, console) is kept only when close() gets a verdict other than OK.
export async function openSession({ profile, caseId = 'session', trace = 'retain-on-failure', config } = {}) {
  const cfg = config ?? await loadConfig();
  const prof = profileOf(cfg, profile);
  const browser = await chromium.launch({ headless: cfg.headless, channel: cfg.channel });
  const context = await newContext(browser, cfg, prof);
  if (trace !== 'off') await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  const log = record(page, cfg);
  const dir = join(cfg.evidenceDir, caseId);
  mkdirSync(dir, { recursive: true });
  const shots = [];
  const startedAt = new Date().toISOString();

  const s = {
    browser, context, page, config: cfg, profile: prof.name, dir, ...log, shots,

    // Navigate relative to baseUrl and wait for the page to settle.
    async goto(path = cfg.startPath) {
      await page.goto(path.startsWith('http') ? path : cfg.baseUrl + path, { waitUntil: 'networkidle' });
    },

    // Numbered screenshot: 01-label.png, 02-label.png ... so the folder reads as the steps.
    async shot(label, opts = {}) {
      const name = `${String(shots.length + 1).padStart(2, '0')}-${label.replace(/[^\w.-]+/g, '_').slice(0, 60)}.png`;
      const path = join(dir, name);
      await page.screenshot({ path, ...opts });
      shots.push({ file: name, label, url: redact(cfg, page.url()) });
      return path;
    },

    // Index into the network log; pair with since() to get what one action caused.
    mark() { return log.network.length; },

    // Requests since a mark that wrote something or failed. GET 200s are noise in a bug report.
    since(m, { all = false } = {}) {
      const slice = log.network.slice(m);
      return all ? slice : slice.filter((e) => e.method !== 'GET' || e.status >= 400);
    },

    // Visible toasts, alerts and dialogs: the text a user would quote in a bug report.
    async messages() {
      const sel = '[role=status],[role=alert],[role=alertdialog],[role=dialog],[class*=toast i],[class*=snackbar i],[class*=notification i]';
      return (await page.locator(sel).allInnerTexts()).map((t) => t.trim()).filter(Boolean);
    },

    async close({ verdict, notes } = {}) {
      const keepTrace = trace === 'on' || (trace === 'retain-on-failure' && verdict && verdict !== 'OK');
      if (trace !== 'off') await context.tracing.stop(keepTrace ? { path: join(dir, 'trace.zip') } : {}).catch(() => {});
      const evidence = {
        caseId, profile: prof.name, baseUrl: cfg.baseUrl, startedAt, endedAt: new Date().toISOString(),
        verdict: verdict ?? null, notes: notes ?? null, trace: keepTrace ? 'trace.zip' : null,
        shots, network: log.network, console: log.console, pageErrors: log.pageErrors,
      };
      writeFileSync(join(dir, 'evidence.json'), JSON.stringify(evidence, null, 2));
      await browser.close();
      return evidence;
    },
  };
  return s;
}
