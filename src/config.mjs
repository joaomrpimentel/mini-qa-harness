// Loads qa.config.mjs from the working directory and fills in defaults.
// The config is plain JS so auth adapters can be real functions, not strings.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const STATIC_ASSET = /\.(js|mjs|css|map|png|jpe?g|gif|svg|ico|webp|woff2?|ttf)(\?|$)/i;

// Strings that look like credentials. Applied to every URL and body the harness writes to disk.
const DEFAULT_REDACT = [
  /eyJ[\w-]+\.[\w-]+\.[\w-]+/g,               // JWT
  /(bearer\s+)[\w.~+/-]+=*/gi,                // Authorization: Bearer ...
  /([?&](?:token|access_token|api_key|key|password)=)[^&\s"]+/gi,
];

export const defaults = {
  baseUrl: 'http://localhost:4173',
  // Many apps redirect "/" to a login page even with a valid session. Agents start here instead.
  startPath: '/',
  viewport: { width: 1440, height: 900 },
  locale: 'en-US',
  headless: true,
  // Playwright browser channel. undefined = the bundled Chromium.
  channel: undefined,
  evidenceDir: 'evidence',
  // Local state that never goes into git: browser profiles, the Jam extension, secrets.
  workDir: '.qa',
  // Prefix for every record a test creates, so cleanup can find it and nobody mistakes it for real data.
  dataPrefix: 'QA-',
  network: {
    include: [/./],
    ignore: [STATIC_ASSET],
    bodyLimit: 800,
  },
  redact: DEFAULT_REDACT,
  profiles: {},
  github: {
    // Rewrites bare "#123" in drafts to "<issueRefRepo>#123". Leave empty to keep "#123".
    issueRefRepo: '',
  },
};

export async function loadConfig(path = process.env.QA_CONFIG || 'qa.config.mjs') {
  const file = resolve(path);
  let user = {};
  if (existsSync(file)) {
    const mod = await import(pathToFileURL(file).href);
    user = mod.default ?? mod;
  }
  const cfg = {
    ...defaults,
    ...user,
    network: { ...defaults.network, ...user.network },
    github: { ...defaults.github, ...user.github },
    redact: [...DEFAULT_REDACT, ...(user.redact ?? [])],
  };
  cfg.baseUrl = cfg.baseUrl.replace(/\/$/, '');
  cfg.workDir = resolve(cfg.workDir);
  cfg.evidenceDir = resolve(cfg.evidenceDir);
  return cfg;
}

export function profileOf(cfg, name) {
  if (!name) return { name: 'anonymous', auth: null };
  const p = cfg.profiles[name];
  if (!p) {
    const known = Object.keys(cfg.profiles).join(', ') || '(none configured)';
    throw new Error(`unknown profile "${name}". Known: ${known}`);
  }
  return { name, ...p };
}

export function redact(cfg, text) {
  let out = String(text ?? '');
  for (const re of cfg.redact) {
    out = out.replace(re, (m, keep) => (typeof keep === 'string' && m.startsWith(keep) ? keep : '') + '[REDACTED]');
  }
  return out;
}
