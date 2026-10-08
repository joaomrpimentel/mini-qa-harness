// Runs one test case k times, each in a brand new browser session, and counts how many runs
// reached the same verdict. A failure seen once may be timing, leftover data or a cold cache;
// a failure seen k out of k times from a clean start is something a developer can reproduce too.
//
//   const r = await reproduce('delete-pinned', { profile: 'admin', times: 2 }, async (s) => {
//     ...drive the UI...
//     return { verdict: 'BUG', observed: '500 on DELETE, note still listed after reload' };
//   });
//   r.summary   // "BUG 2/2"
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from './config.mjs';
import { openSession } from './session.mjs';

export const VERDICTS = ['OK', 'BUG', 'NOT_TESTED'];

export async function reproduce(caseId, { profile, times = 2, config, trace } = {}, fn) {
  const cfg = config ?? await loadConfig();
  const runs = [];
  for (let i = 1; i <= times; i++) {
    const s = await openSession({ profile, caseId: `${caseId}/run-${i}`, config: cfg, trace });
    let result;
    try {
      result = await fn(s, { run: i });
      if (!VERDICTS.includes(result?.verdict)) throw new Error(`case must return { verdict: ${VERDICTS.join(' | ')} }`);
    } catch (e) {
      // A crash in the script is not a verdict about the app.
      result = { verdict: 'NOT_TESTED', reason: 'script-error', observed: e.message.replace(/\x1b\[[0-9;]*m/g, '') };
      await s.shot('script-error').catch(() => {});
    }
    await s.close({ verdict: result.verdict, notes: result.observed ?? result.reason ?? null });
    runs.push({ run: i, ...result });
  }
  const first = runs[0].verdict;
  const same = runs.filter((r) => r.verdict === first).length;
  const out = {
    caseId, profile: profile ?? 'anonymous', times,
    verdict: same === times ? first : 'FLAKY',
    summary: `${same === times ? first : 'FLAKY'} ${same}/${times}`,
    runs,
  };
  mkdirSync(join(cfg.evidenceDir, caseId), { recursive: true });
  writeFileSync(join(cfg.evidenceDir, caseId, 'result.json'), JSON.stringify(out, null, 2));
  return out;
}
