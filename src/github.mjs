// GitHub helpers that need a browser. `gh` creates issues fine but cannot upload attachments,
// and the only stable home for an image in an issue is a github.com/user-attachments URL.
// These run in a persistent profile where a person signed in once (`qa gh login`).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const profileDir = (cfg) => join(cfg.workDir, 'gh-profile');
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4' };

export async function loginGitHub(cfg) {
  const context = await chromium.launchPersistentContext(profileDir(cfg), { headless: false, viewport: null, channel: cfg.channel });
  const page = context.pages()[0] ?? await context.newPage();
  await page.goto('https://github.com/login');
  for (let i = 0; i < 180; i++) {
    const login = await page.locator('meta[name="user-login"]').getAttribute('content').catch(() => null);
    if (login) { await context.close(); return login; }
    await page.waitForTimeout(5000);
  }
  await context.close();
  throw new Error('timed out waiting for GitHub login');
}

// Drops each file on the comment box of a new issue in `repo`, reads the attachment URL GitHub
// writes into the textarea, clears it and never submits. The new editor has no <input type=file>,
// so a synthetic drop event is the way in. Returns { "file.png": "https://github.com/user-attachments/..." }.
export async function uploadToGitHub(cfg, repo, files) {
  const context = await chromium.launchPersistentContext(profileDir(cfg), { headless: true, channel: cfg.channel });
  const page = context.pages()[0] ?? await context.newPage();
  try {
    await page.goto(`https://github.com/${repo}/issues/new`, { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) throw new Error('GitHub profile is not signed in. Run: npx qa gh login');
    const ta = page.locator('textarea').first();
    await ta.waitFor({ timeout: 30000 });
    const out = {};
    for (const f of files) {
      await ta.fill('');
      const dt = await page.evaluateHandle(([b64, name, type]) => {
        const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const d = new DataTransfer();
        d.items.add(new File([bin], name, { type }));
        return d;
      }, [readFileSync(f).toString('base64'), basename(f), MIME[extname(f).toLowerCase()] ?? 'application/octet-stream']);
      for (const ev of ['dragenter', 'dragover', 'drop']) await ta.dispatchEvent(ev, { dataTransfer: dt });
      const h = await page.waitForFunction(() => {
        const t = document.querySelector('textarea')?.value ?? '';
        return t.match(/https:\/\/github\.com\/user-attachments\/(?:assets|files)\/[\w/.-]+/)?.[0] ?? null;
      }, null, { timeout: 60000 });
      out[basename(f)] = await h.jsonValue();
    }
    await ta.fill('');
    return out;
  } finally {
    await context.close();
  }
}

// Opens an issue and counts images in the body that actually loaded.
export async function checkIssueImages(cfg, url) {
  const context = await chromium.launchPersistentContext(profileDir(cfg), { headless: true, channel: cfg.channel });
  const page = context.pages()[0] ?? await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
    const ok = await page.evaluate(() => [...document.querySelectorAll('.markdown-body img')].map((i) => i.complete && i.naturalWidth > 0));
    return { images: ok.length, loaded: ok.filter(Boolean).length };
  } finally {
    await context.close();
  }
}
