// Exports every docs/diagrams/*.excalidraw to SVG (light and dark) with Excalidraw's own exportToSvg,
// running the real Excalidraw package in Playwright's Chromium. Fonts are inlined, so the SVG renders
// the same on GitHub. Optional: --png also writes a PNG preview next to each SVG.
//   node docs/diagrams/src/export.mjs [--png]
import { chromium } from 'playwright';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const png = process.argv.includes('--png');
const files = readdirSync(DIR).filter((f) => f.endsWith('.excalidraw'));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.setContent(`<html><body style="margin:0"><div id=o></div>
<script type="importmap">{"imports":{"react":"https://esm.sh/react@19.0.0","react-dom":"https://esm.sh/react-dom@19.0.0","react/jsx-runtime":"https://esm.sh/react@19.0.0/jsx-runtime"}}</script>
<script type="module">
import { exportToSvg } from "https://esm.sh/@excalidraw/excalidraw@0.18.0?external=react,react-dom";
window.toSvg = async (elements, dark) => {
  const svg = await exportToSvg({ elements, files: {}, exportPadding: 24,
    appState: { exportBackground: true, viewBackgroundColor: '#ffffff', exportWithDarkMode: dark } });
  return svg.outerHTML;
};
window.ready = true;
</script></body></html>`);
await page.waitForFunction('window.ready', null, { timeout: 60000 });

for (const f of files) {
  const els = JSON.parse(readFileSync(join(DIR, f), 'utf8')).elements.filter((e) => !e.isDeleted);
  for (const dark of [false, true]) {
    const out = join(DIR, f.replace(/\.excalidraw$/, dark ? '.dark.svg' : '.svg'));
    const svg = await page.evaluate(([e, d]) => window.toSvg(e, d), [els, dark]);
    writeFileSync(out, svg);
    if (png) {
      const p = await browser.newPage();
      await p.setContent(`<body style="margin:0">${svg}</body>`);
      await p.waitForTimeout(500);
      await p.locator('svg').screenshot({ path: out.replace(/\.svg$/, '.png') });
      await p.close();
    }
    console.log(out.slice(DIR.length + 1));
  }
}
await browser.close();
