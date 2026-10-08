// qa.config.mjs: where the app is and how each test profile signs in.
// Copy to qa.config.mjs (`npx qa init`) and edit. Pick ONE auth style per profile.
import { cookie, header, storageState, jwtHs256, fromEnv, fromFile } from 'mini-qa-harness';

export default {
  baseUrl: 'http://localhost:4173',
  // Where an agent starts. Many apps send "/" to the login page even with a valid session.
  startPath: '/',
  locale: 'en-US',
  dataPrefix: 'QA-',

  // Only these requests go into evidence.json. Default: everything except static assets.
  network: { include: [/\/api\//] },

  // Extra patterns to scrub from anything written to disk (the defaults already cover JWTs and bearer tokens).
  redact: [/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g],

  profiles: {
    // 1. Sign in by hand once with `npx qa login admin`. Works with SSO and MFA.
    admin: { auth: storageState('.qa/auth/admin.json'), about: 'full access' },

    // 2. A token you already have, in an env var, sent as a cookie.
    // viewer: { auth: cookie({ name: 'session', value: fromEnv('QA_VIEWER_TOKEN') }) },

    // 3. A bearer header.
    // api: { auth: header({ value: fromEnv('QA_API_TOKEN') }) },

    // 4. Mint a token per session for a test user. Test environments only, with a key you may hold.
    // editor: {
    //   auth: cookie({
    //     name: 'jwt',
    //     value: jwtHs256({ secret: fromFile('.qa/secrets/jwt.key'), claims: { sub: 'qa-editor', role: 'editor' } }),
    //   }),
    // },
  },

  github: { issueRefRepo: '' },
};
