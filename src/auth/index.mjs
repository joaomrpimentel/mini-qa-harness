// Auth adapters. Each one returns { kind, apply(context, env) }.
// apply() runs on a fresh BrowserContext before the first navigation, so it works the same
// for a normal context and for the persistent context that carries the Jam extension.
//
// Values (token, header value) can be a string or an async function, so a token can be
// minted per session instead of copied once and left to expire mid-run.
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';

async function resolveValue(v, env) {
  return typeof v === 'function' ? await v(env) : v;
}

// --- value providers ---------------------------------------------------------

export const fromEnv = (name) => () => {
  const v = process.env[name];
  if (!v) throw new Error(`environment variable ${name} is empty`);
  return v;
};

export const fromFile = (path) => () => readFileSync(path, 'utf8').trim();

// Runs a command and uses its stdout. Good for an existing token script or a CLI like `gcloud auth print-identity-token`.
export const fromCommand = (cmd, args = []) => () => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

// Signs an HS256 JWT. Use only against a test environment whose signing key you are allowed to hold.
// claims: object or (env) => object. ttlSeconds is added as exp; iat and nbf are set to now.
export function jwtHs256({ secret, claims, ttlSeconds = 20 * 60 }) {
  return async (env) => {
    const key = await resolveValue(secret, env);
    const now = Math.floor(Date.now() / 1000);
    const body = { ...(await resolveValue(claims, env)), iat: now, nbf: now, exp: now + ttlSeconds };
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const unsigned = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(body)}`;
    return `${unsigned}.${createHmac('sha256', key).update(unsigned).digest('base64url')}`;
  };
}

// --- adapters ----------------------------------------------------------------

// Sets one cookie. domain defaults to the host of baseUrl.
export function cookie({ name, value, domain, path = '/', secure, httpOnly = true, sameSite = 'Lax' }) {
  return {
    kind: 'cookie',
    async apply(context, env) {
      const url = new URL(env.config.baseUrl);
      await context.addCookies([{
        name,
        value: await resolveValue(value, env),
        domain: domain ?? url.hostname,
        path,
        secure: secure ?? url.protocol === 'https:',
        httpOnly,
        sameSite,
      }]);
    },
  };
}

// Adds a header, e.g. Authorization: Bearer <token>, to requests that go to the origin of
// baseUrl (or to the origins listed in `origins`). Requests to CDNs and third parties go
// without it, so the token does not leak to every host the page loads from.
export function header({ name = 'Authorization', value, prefix = 'Bearer ', origins }) {
  return {
    kind: 'header',
    async apply(context, env) {
      const v = prefix + await resolveValue(value, env);
      const allowed = new Set(origins ?? [new URL(env.config.baseUrl).origin]);
      await context.route((url) => allowed.has(url.origin), (route) =>
        route.continue({ headers: { ...route.request().headers(), [name]: v } }));
    },
  };
}

// Reuses a Playwright storage state (cookies + localStorage) saved by `qa login <profile>`.
// This is the adapter for apps behind SSO, MFA or any login an agent should not type into.
export function storageState(path) {
  return {
    kind: 'storageState',
    path,
    async apply(context) {
      if (!existsSync(path)) throw new Error(`no saved login at ${path}. Run: npx qa login <profile>`);
      const state = JSON.parse(readFileSync(path, 'utf8'));
      if (state.cookies?.length) await context.addCookies(state.cookies);
      if (state.origins?.length) {
        await context.addInitScript((origins) => {
          const o = origins.find((x) => x.origin === location.origin);
          if (o) for (const { name, value } of o.localStorage) localStorage.setItem(name, value);
        }, state.origins);
      }
    },
  };
}

// Runs several adapters in order, e.g. a cookie plus a feature-flag header.
export function combine(...adapters) {
  return {
    kind: 'combine',
    async apply(context, env) {
      for (const a of adapters) await a.apply(context, env);
    },
  };
}
