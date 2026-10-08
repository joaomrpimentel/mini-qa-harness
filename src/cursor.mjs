// A drawn cursor for recordings. Headless Chromium has no mouse pointer, so a video of a
// headless run shows things changing with no hint of where the click happened.
//
// showCursor(context) before the first navigation; then humanClick/humanType instead of
// locator.click()/fill() inside the recorded flow. The position survives navigation and reload.
const KEY = 'qa-cursor';

export async function showCursor(context, { hostIncludes } = {}) {
  await context.addInitScript(({ KEY, hostIncludes }) => {
    if (hostIncludes && !location.host.includes(hostIncludes)) return;
    const install = () => {
      if (document.getElementById(KEY)) return;
      const c = document.createElement('div');
      c.id = KEY;
      c.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M3 2l7 19 2.6-7.6L20 11z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none', transform: 'translate(-3px,-2px)', transition: 'left 16ms linear, top 16ms linear' });
      document.documentElement.appendChild(c);
      const pos = JSON.parse(sessionStorage.getItem(KEY) || '[720,450]');
      c.style.left = pos[0] + 'px'; c.style.top = pos[1] + 'px';
      addEventListener('mousemove', (e) => {
        c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px';
        sessionStorage.setItem(KEY, JSON.stringify([e.clientX, e.clientY]));
      }, true);
      // A short red pulse on every click, so the viewer sees the click land.
      addEventListener('mousedown', (e) => {
        const r = document.createElement('div');
        Object.assign(r.style, { position: 'fixed', left: e.clientX - 18 + 'px', top: e.clientY - 18 + 'px', width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #e11d48', background: 'rgba(225,29,72,.18)', zIndex: 2147483646, pointerEvents: 'none', transition: 'transform .45s ease-out, opacity .45s ease-out' });
        document.documentElement.appendChild(r);
        requestAnimationFrame(() => { r.style.transform = 'scale(1.8)'; r.style.opacity = '0'; });
        setTimeout(() => r.remove(), 500);
      }, true);
    };
    if (document.documentElement) install(); else addEventListener('DOMContentLoaded', install);
  }, { KEY, hostIncludes });
}

// Moves the mouse to the centre of the target at roughly human speed, pauses, clicks.
export async function humanClick(page, locator, { pause = 350 } = {}) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) return locator.click();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const [x0, y0] = await page.evaluate((k) => JSON.parse(sessionStorage.getItem(k) || '[720,450]'), KEY).catch(() => [720, 450]);
  const steps = Math.max(12, Math.min(40, Math.round(Math.hypot(x - x0, y - y0) / 20)));
  await page.mouse.move(x0, y0);
  await page.mouse.move(x, y, { steps });
  await page.waitForTimeout(pause);
  await page.mouse.click(x, y);
}

export async function humanType(page, locator, text, { delay = 60 } = {}) {
  await humanClick(page, locator);
  await locator.pressSequentially(text, { delay });
}
