// Records a bug reproduction with Jam (https://jam.dev) by driving the Jam browser extension
// inside Playwright's Chromium. Jam has no public API to create a recording, so the extension
// is the only way in. This is the most fragile part of the harness: it depends on the
// extension's popup text ("Record Tab", "Stop Recording", "Create") and on the preview iframe
// (iui.html). If Jam changes its UI, these selectors are where it breaks.
//
//   const jam = await openJam({ profile: 'admin' });
//   await showCursor(jam.context);
//   await jam.page.goto(...);                 // set the scene before recording
//   await jam.start();
//   ... humanClick / humanType the reproduction ...
//   const links = await jam.stopAndCreate(title, description);
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { loadConfig, profileOf } from './config.mjs';
import { applyAuth, record } from './session.mjs';

export const JAM_EXTENSION_ID = 'iohjgamcilhbgmhbnllfolmkmmekfmci';

export function jamPaths(cfg) {
  return { ext: join(cfg.workDir, 'jam-ext'), profile: join(cfg.workDir, 'jam-profile') };
}

// Downloads the extension from the Chrome Web Store update endpoint, unpacks it and adds
// host_permissions. Without that, the extension only injects into a tab after a real click on
// its toolbar icon (activeTab), which never happens under automation, and the popup hangs on
// "Starting Jam". The manifest "key" keeps the extension ID stable.
export async function setupJam(cfg) {
  const { ext } = jamPaths(cfg);
  mkdirSync(cfg.workDir, { recursive: true });
  const crx = join(cfg.workDir, 'jam.crx');
  const url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=140.0.0.0&acceptformat=crx2,crx3&x=id%3D${JAM_EXTENSION_ID}%26uc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`extension download failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // CRX3: "Cr24", version, header length, header, then a plain zip.
  if (buf.toString('latin1', 0, 4) !== 'Cr24') throw new Error('download is not a CRX file');
  const zipStart = 12 + buf.readUInt32LE(8);
  writeFileSync(crx + '.zip', buf.subarray(zipStart));
  rmSync(ext, { recursive: true, force: true });
  execFileSync('unzip', ['-q', crx + '.zip', '-d', ext]);
  rmSync(join(ext, '_metadata'), { recursive: true, force: true });
  rmSync(crx + '.zip');
  const mf = join(ext, 'manifest.json');
  const manifest = JSON.parse(readFileSync(mf, 'utf8'));
  manifest.host_permissions = ['<all_urls>'];
  writeFileSync(mf, JSON.stringify(manifest, null, 2));
  return { ext, version: manifest.version };
}

function launchArgs(ext) {
  return [
    `--disable-extensions-except=${ext}`,
    `--load-extension=${ext}`,
    `--allowlisted-extension-id=${JAM_EXTENSION_ID}`,
    '--auto-accept-this-tab-capture',
  ];
}

// Opens a visible window so a person can sign in to Jam once. The session stays in the profile dir.
export async function loginJam(cfg) {
  const { ext, profile } = jamPaths(cfg);
  if (!existsSync(ext)) throw new Error('Jam extension missing. Run: npx qa jam setup');
  const context = await chromium.launchPersistentContext(profile, { headless: false, viewport: null, channel: 'chromium', args: launchArgs(ext) });
  const page = context.pages()[0] ?? await context.newPage();
  await page.goto('https://jam.dev/login');
  await new Promise((r) => { context.on('close', r); setTimeout(r, 25 * 60 * 1000); });
}

// Always headless by default. A visible window gets resized by tiling window managers, and the
// tab capture records the real window size, so the video comes out squeezed with black bars.
export async function openJam({ profile, headless = true, config } = {}) {
  const cfg = config ?? await loadConfig();
  const prof = profileOf(cfg, profile);
  const { ext, profile: dir } = jamPaths(cfg);
  if (!existsSync(ext)) throw new Error('Jam extension missing. Run: npx qa jam setup');
  // channel 'chromium' = full Chromium. Branded Chrome ignores --load-extension, and the default
  // headless shell cannot run extensions.
  const context = await chromium.launchPersistentContext(dir, {
    headless, channel: 'chromium', viewport: cfg.viewport, locale: cfg.locale,
    args: [...launchArgs(ext), `--window-size=${cfg.viewport.width},${cfg.viewport.height + 100}`],
  });
  await applyAuth(context, cfg, prof);
  const sw = context.serviceWorkers().find((w) => w.url().includes(JAM_EXTENSION_ID))
    ?? await context.waitForEvent('serviceworker', { timeout: 15000 });
  const page = context.pages()[0] ?? await context.newPage();
  const log = record(page, cfg);
  const host = new URL(cfg.baseUrl).host;

  // Jam opens jam.dev/welcome on start and that tab steals focus. Close everything that is not
  // the app, then focus the app tab, because the popup records the active tab of its window.
  async function focusApp() {
    await sw.evaluate(async (host) => {
      const tabs = await chrome.tabs.query({});
      const app = tabs.find((t) => t.url?.includes(host));
      if (!app) throw new Error('app tab not found; navigate the page before recording');
      for (const t of tabs) if (t.id !== app.id && !t.url?.startsWith('chrome-extension')) await chrome.tabs.remove(t.id);
      await chrome.tabs.update(app.id, { active: true });
      await chrome.windows.update(app.windowId, { focused: true });
    }, host);
  }

  // The popup opens as a background tab in the app's window. In a separate window it finds no tab to record.
  async function openPopup() {
    const next = context.waitForEvent('page', (p) => p.url().includes('popup.html'));
    await sw.evaluate(async ({ id, host }) => {
      const [app] = (await chrome.tabs.query({})).filter((t) => t.url?.includes(host));
      await chrome.tabs.create({ url: `chrome-extension://${id}/popup.html`, active: false, windowId: app.windowId });
    }, { id: JAM_EXTENSION_ID, host });
    const popup = await next;
    await popup.waitForLoadState();
    await popup.waitForTimeout(2500);
    return popup;
  }

  return {
    context, page, sw, network: log.network, console: log.console,
    focusApp, openPopup,

    // Popup text, for a smoke check: it should offer "Record Tab".
    async popupText() {
      await focusApp();
      const p = await openPopup();
      const text = await p.locator('body').innerText();
      await p.close();
      return text;
    },

    async start() {
      await focusApp();
      const popup = await openPopup();
      await popup.getByText('Record Tab').click();
      await page.waitForTimeout(4500); // countdown
    },

    // Stop from the popup, not from the in-page bar: a reload recreates the bar's iframe.
    // Returns every jam.dev/c/... link found after Create. Empty array = it stayed a local draft.
    async stopAndCreate(title, description) {
      const stop = await openPopup();
      await stop.getByText('Stop Recording').click();
      await page.waitForTimeout(12000);
      const ui = page.frames().find((f) => f.url().includes('iui.html'));
      if (!ui) throw new Error('Jam preview (iui.html) did not open after Stop Recording');
      await ui.getByText('Title', { exact: true }).click().catch(() => {});
      await page.keyboard.type(title);
      await page.keyboard.press('Tab');
      await page.keyboard.type(description);
      await page.waitForTimeout(800);
      // "Create" has no button role in the preview; find it by text.
      await ui.getByText('Create', { exact: true }).last().click();
      await page.waitForTimeout(15000);
      const find = () => [...document.querySelectorAll('a,input')].map((a) => a.href || a.value).filter((h) => /jam\.dev\/c\//.test(h || ''));
      const links = await Promise.all(context.pages().map((p) => p.evaluate(find).catch(() => [])));
      for (const f of page.frames()) links.push(await f.evaluate(find).catch(() => []));
      for (const p of context.pages()) if (/jam\.dev\/c\//.test(p.url())) links.push([p.url()]);
      return [...new Set(links.flat())];
    },

    close: () => context.close(),
  };
}
