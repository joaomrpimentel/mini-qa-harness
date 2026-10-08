// Turns a bug draft (Markdown on disk) into an issue title and body ready for `gh issue create`.
//
// The draft's first "# " heading is the title. Frontmatter is dropped. Every local image path is
// swapped for its uploaded URL, and the render refuses to finish if a local image is left,
// because a broken image in a posted issue is evidence the reader cannot see.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

export function renderIssue(markdown, { urls = {}, issueRefRepo = '' } = {}) {
  let s = markdown.replace(/^﻿/, '');
  if (s.startsWith('---\n')) {
    const end = s.indexOf('\n---', 4);
    if (end !== -1) s = s.slice(s.indexOf('\n', end + 1) + 1);
  }
  s = s.replace(/^\s+/, '');
  const m = s.match(/^#\s+(.+)\n/);
  if (!m) throw new Error('draft must start with a "# Title" line');
  const title = m[1].trim();
  s = s.slice(m[0].length).replace(/^\s+/, '');

  const byName = Object.fromEntries(Object.entries(urls).map(([k, v]) => [basename(k), v]));
  s = s.replace(/(!?\[[^\]]*\]\()([^)\s]+)(\))/g, (all, open, target, close) => {
    if (/^https?:\/\//.test(target)) return all;
    const url = byName[basename(target)];
    return url ? open + url + close : all;
  });
  const left = [...s.matchAll(/!\[[^\]]*\]\((?!https?:\/\/)([^)]+)\)/g)].map((x) => x[1]);
  if (left.length) throw new Error('images without uploaded URL: ' + left.join(', '));

  // "#123" alone is ambiguous once the issue lives in another repo than the feature.
  if (issueRefRepo) s = s.replace(/(?<![\w/])#(\d+)\b/g, `${issueRefRepo}#$1`);
  return { title, body: s.trimEnd() + '\n' };
}

export function renderIssueFile(path, opts) {
  return renderIssue(readFileSync(path, 'utf8'), opts);
}

// Local images referenced by a draft, so the CLI can upload exactly those.
export function draftImages(markdown) {
  return [...markdown.matchAll(/!\[[^\]]*\]\((?!https?:\/\/)([^)\s]+)\)/g)].map((x) => x[1]);
}
