// Bundles every src/**/*.test.ts for node (they import app TypeScript) and runs them with node:test.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const find = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? find(p) : p.endsWith('.test.ts') ? [p] : [];
});
const entries = find('src');
// Outside node_modules: node's test runner skips anything under it.
const outdir = join(tmpdir(), 'aa-unit-tests');
rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });
await build({ entryPoints: entries, bundle: true, platform: 'node', format: 'esm', outdir, outbase: 'src', outExtension: { '.js': '.mjs' }, logLevel: 'error', loader: { '.jpg': 'empty', '.png': 'empty', '.css': 'empty', '.svg': 'empty', '.webp': 'empty' }, define: { 'import.meta.env': '{}' } });
const files = entries.map((e) => join(outdir, e.replace(/^src\//, '').replace(/\.ts$/, '.mjs')));
const r = spawnSync(process.execPath, ['--test', '--test-reporter=dot', ...files], { stdio: 'inherit' });
process.exit(r.status ?? 1);
