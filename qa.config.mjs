// Config for the demo app (demo/server.mjs), used by the tutorial.
// For your own app, start from qa.config.example.mjs instead.
import { cookie, jwtHs256 } from 'mini-qa-harness';

const demoSession = (sub, role) => cookie({
  name: 'demo_session',
  value: jwtHs256({ secret: process.env.DEMO_SECRET ?? 'demo-only-secret', claims: { sub, role } }),
});

export default {
  baseUrl: 'http://localhost:4173',
  startPath: '/notes',
  network: { include: [/\/api\//] },
  profiles: {
    admin: { auth: demoSession('admin', 'admin'), about: 'creates and deletes notes' },
    viewer: { auth: demoSession('viewer', 'viewer'), about: 'reads notes only' },
  },
};
