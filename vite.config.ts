import { defineConfig, loadEnv, type Plugin, type ViteDevServer, type PreviewServer } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { accessGate } from './server/access';
import { bootScript, bootSplashHtml } from './src/ui/splashCore';

/**
 * Research API during `npm run dev` and `npm run preview`: mounts /api/research/* on the local server.
 * Server-side variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEARCH_DEBUG_KEY) are read here, in
 * Node, from .env / .env.local and handed to the handler. They are never `define`d into the bundle:
 * Vite only ships VITE_* variables to the browser.
 */
function researchApi(mode: string): Plugin {
  const all = loadEnv(mode, process.cwd(), '');
  const env = { SUPABASE_URL: all.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: all.SUPABASE_SERVICE_ROLE_KEY, RESEARCH_DEBUG_KEY: all.RESEARCH_DEBUG_KEY, APP_ACCESS_PASSWORD: all.APP_ACCESS_PASSWORD };
  const mount = (server: ViteDevServer | PreviewServer, load: () => Promise<{ handleNodeRequest: (...a: unknown[]) => Promise<void> }>) => {
    server.middlewares.use('/api/research', async (req, res) => {
      try {
        req.url = '/api/research' + (req.url ?? '');
        await (await load()).handleNodeRequest(req, res, env);
      } catch {
        res.statusCode = 500;
        res.end('{"ok":false,"error":"server_error"}');
      }
    });
  };
  return {
    name: 'ana-research-api',
    configureServer(server) {
      mount(server, () => server.ssrLoadModule('/server/research/node.ts') as never);
    },
    async configurePreviewServer(server) {
      // Preview has no module loader; use Vite's own SSR loader once, then cache the module.
      const { createServer } = await import('vite');
      let mod: Promise<never> | null = null;
      mount(server, () =>
        (mod ??= createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' }).then((v) => v.ssrLoadModule('/server/research/node.ts') as never)),
      );
    },
  };
}

/**
 * Private access on the local dev and preview servers: the same gate Vercel runs in middleware.ts
 * (server/access.ts). Only active when APP_ACCESS_PASSWORD is set in .env.local, so plain local
 * prototype work needs no password. /test is always public.
 */
function privateAccess(mode: string): Plugin {
  const password = loadEnv(mode, process.cwd(), '').APP_ACCESS_PASSWORD || undefined;
  const gate = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!password) return next();
    try {
      const url = `http://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`;
      const isLogin = req.method === 'POST' && (req.url ?? '').split('?')[0] === '/api/access';
      const body = isLogin ? await new Promise<Buffer>((ok) => { const c: Buffer[] = []; req.on('data', (d: Buffer) => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); }) : undefined;
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
      const out = await accessGate(new Request(url, { method: req.method, headers, body: body ? new Uint8Array(body) : undefined }), password);
      if (!out) return next();
      res.statusCode = out.status;
      out.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(Buffer.from(await out.arrayBuffer()));
    } catch {
      res.statusCode = 500;
      res.end('access check failed');
    }
  };
  return {
    name: 'art-and-artist-private-access',
    configureServer: (server) => void server.middlewares.use(gate),
    configurePreviewServer: (server) => void server.middlewares.use(gate),
  };
}

/**
 * The installed app's launch splash in index.html itself: its styles, its markup and a tiny boot script
 * (src/ui/splashCore.ts). On a Home Screen launch the splash is the first thing painted and starts
 * playing before the app's JavaScript has loaded; every other page (Safari, /test, /research) removes it
 * before the first paint. One source for the mark: the app uses the same module.
 */
function launchSplashHtml(): Plugin {
  return {
    name: 'art-and-artist-launch-splash',
    transformIndexHtml(html) {
      const css = readFileSync(resolve(process.cwd(), 'src/styles/splash.css'), 'utf8');
      return html.replace('</head>', `<style data-splash>${css}</style>\n  </head>`).replace('<body>', `<body>\n    ${bootSplashHtml()}<script>${bootScript()}</script>`);
    },
  };
}

// Relative base so the build can be served from any path (artifact, static host, file preview).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [privateAccess(mode), launchSplashHtml(), react(), researchApi(mode)],
}));
