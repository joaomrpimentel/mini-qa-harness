import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderIssue, draftImages } from '../src/report.mjs';
import { redact, defaults } from '../src/config.mjs';

const draft = `---
case: delete-pinned
---

# Deleting a pinned note returns 500 and the note stays

See #12.

![after](evidence/run-1/02-after-delete.png)
`;

test('title comes from the first heading, frontmatter is dropped', () => {
  const { title, body } = renderIssue(draft, { urls: { '02-after-delete.png': 'https://github.com/user-attachments/assets/abc' } });
  assert.equal(title, 'Deleting a pinned note returns 500 and the note stays');
  assert.ok(!body.includes('case:'));
  assert.ok(body.includes('](https://github.com/user-attachments/assets/abc)'));
});

test('refuses to render with a local image left', () => {
  assert.throws(() => renderIssue(draft), /images without uploaded URL/);
});

test('bare issue refs get the repo when configured', () => {
  const { body } = renderIssue(draft, { urls: { '02-after-delete.png': 'https://x/y' }, issueRefRepo: 'acme/app' });
  assert.ok(body.includes('acme/app#12'));
});

test('draftImages lists local images only', () => {
  assert.deepEqual(draftImages(draft + '\n![r](https://x/y.png)'), ['evidence/run-1/02-after-delete.png']);
});

test('redact scrubs JWTs, bearer tokens and token query params', () => {
  const cfg = { redact: defaults.redact };
  const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.c2ln';
  assert.equal(redact(cfg, `cookie ${jwt}`), 'cookie [REDACTED]');
  assert.equal(redact(cfg, 'Authorization: Bearer abc.def'), 'Authorization: Bearer [REDACTED]');
  assert.equal(redact(cfg, '/cb?token=s3cret&x=1'), '/cb?token=[REDACTED]&x=1');
});
