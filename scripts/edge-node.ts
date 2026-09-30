/* Node entry (outside src, so the app's typecheck stays browser-only) for the automated edge-case regression. Run with: npm run test:edge */
import { writeFileSync } from 'node:fs';
import { CHECKS, runChecks } from '../src/qa/checks';
import { buildMatrix, counts } from '../src/qa/matrix';

const results = runChecks();
const mark = { pass: 'PASS', fail: 'FAIL', missing: 'NO MODEL' } as const;
CHECKS.forEach((c) => console.log(`${mark[results[c.id].result].padEnd(8)} ${c.id}  ${c.title}\n         ${results[c.id].detail}`));

const n = (r: string) => Object.values(results).filter((x) => x.result === r).length;
console.log(`\n${n('pass')} pass · ${n('fail')} fail · ${n('missing')} without a model yet`);

const out = process.argv.find((a) => a.startsWith('--matrix='));
writeFileSync('src/qa/last-run.json', JSON.stringify({ date: new Date().toISOString().slice(0, 10), results }, null, 1) + '\n');
if (out) {
  writeFileSync(out.slice(9), buildMatrix(results, new Date().toISOString().slice(0, 10)));
  const c = counts(results);
  console.log(`Matrix written: ${c.total} scenarios (P0 ${c.P0}, P1 ${c.P1}, P2 ${c.P2}).`);
}
if (process.argv.includes('--strict') && n('fail')) process.exit(1);
