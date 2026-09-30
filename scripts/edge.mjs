// Bundles the edge-case checks for node (they are TypeScript, shared with the app) and runs them.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = 'node_modules/.cache/edge-checks.mjs';
await build({ entryPoints: ['scripts/edge-node.ts'], bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'error' });
const r = spawnSync(process.execPath, [outfile, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
