// Demo app for the tutorial: a tiny notes app with two planted bugs and one environment trap.
// No dependencies. Run: node demo/server.mjs  (http://localhost:4173)
//
// Do not read this file before doing the tutorial: the point is to find the bugs through the UI.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { createHmac, timingSafeEqual } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 4173);
// Demo-only signing key. A real app never ships its key in the repo.
export const DEMO_SECRET = process.env.DEMO_SECRET ?? 'demo-only-secret';
const page = (f) => readFileSync(new URL(`./public/${f}`, import.meta.url));

let seq = 3;
let notes = [
  { id: 1, title: 'Welcome', body: 'This is the demo notes app.', pinned: true, owner: 'admin' },
  { id: 2, title: 'Groceries', body: 'eggs, rice, coffee', pinned: false, owner: 'admin' },
];

function verify(token) {
  const [h, p, sig] = String(token ?? '').split('.');
  if (!sig) return null;
  const want = createHmac('sha256', DEMO_SECRET).update(`${h}.${p}`).digest();
  const got = Buffer.from(sig, 'base64url');
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (claims.exp && claims.exp < Date.now() / 1000) return null;
  return claims;
}

function sign(claims) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const u = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ ...claims, iat: now, exp: now + 3600 })}`;
  return `${u}.${createHmac('sha256', DEMO_SECRET).update(u).digest('base64url')}`;
}

const user = (req) => verify(/(?:^|;\s*)demo_session=([^;]+)/.exec(req.headers.cookie ?? '')?.[1]);
const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(body === undefined ? '' : JSON.stringify(body)); };
const readBody = (req) => new Promise((r) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => { try { r(JSON.parse(d || '{}')); } catch { r({}); } }); });

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const me = user(req);
  const html = (f) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(page(f)); };

  if (url.pathname === '/') { res.writeHead(302, { location: me ? '/notes' : '/login' }); return res.end(); }
  if (url.pathname === '/login' && req.method === 'GET') return html('login.html');
  if (url.pathname === '/login' && req.method === 'POST') {
    const form = new URLSearchParams(await new Promise((r) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => r(d)); }));
    const role = { admin: 'admin', viewer: 'viewer' }[form.get('user')];
    if (!role || form.get('password') !== 'demo') { res.writeHead(302, { location: '/login?error=1' }); return res.end(); }
    res.writeHead(302, { location: '/notes', 'set-cookie': `demo_session=${sign({ sub: form.get('user'), role })}; Path=/; HttpOnly; SameSite=Lax` });
    return res.end();
  }
  if (url.pathname === '/logout') { res.writeHead(302, { location: '/login', 'set-cookie': 'demo_session=; Path=/; Max-Age=0' }); return res.end(); }
  if (url.pathname === '/notes') { if (!me) { res.writeHead(302, { location: '/login' }); return res.end(); } return html('notes.html'); }

  if (url.pathname.startsWith('/api/')) {
    if (!me) return json(res, 401, { error: 'not signed in' });
    if (url.pathname === '/api/me') return json(res, 200, { user: me.sub, role: me.role });
    if (url.pathname === '/api/notes' && req.method === 'GET') return json(res, 200, notes);
    if (url.pathname === '/api/notes' && req.method === 'POST') {
      if (me.role !== 'admin') return json(res, 403, { error: 'viewers cannot create notes' });
      const b = await readBody(req);
      if (!b.title?.trim()) return json(res, 400, { error: 'title is required' });
      const n = { id: seq++, title: b.title.trim(), body: b.body ?? '', pinned: !!b.pinned, owner: me.sub };
      notes.push(n);
      return json(res, 201, n);
    }
    const m = url.pathname.match(/^\/api\/notes\/(\d+)$/);
    if (m && req.method === 'DELETE') {
      const n = notes.find((x) => x.id === Number(m[1]));
      if (!n) return json(res, 404, { error: 'not found' });
      // Planted bug B: the role check that POST has is missing here.
      // Planted bug A: pinned notes blow up instead of returning a clear 409.
      if (n.pinned) return json(res, 500);
      notes = notes.filter((x) => x !== n);
      return json(res, 204);
    }
    // Environment trap: the export service is not deployed in this environment.
    if (url.pathname === '/api/export') return json(res, 503, { error: 'export-service unavailable', hint: 'not deployed in this environment' });
    return json(res, 404, { error: 'no such route' });
  }
  res.writeHead(404); res.end('not found');
}).listen(PORT, () => console.log(`demo notes app on http://localhost:${PORT}  (users: admin/demo, viewer/demo)`));
