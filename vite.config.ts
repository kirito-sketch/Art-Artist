import { defineConfig, loadEnv, type Plugin, type ViteDevServer, type PreviewServer } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Research API during `npm run dev` and `npm run preview`: mounts /api/research/* on the local server.
 * Server-side variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEARCH_DEBUG_KEY) are read here, in
 * Node, from .env / .env.local and handed to the handler. They are never `define`d into the bundle:
 * Vite only ships VITE_* variables to the browser.
 */
function researchApi(mode: string): Plugin {
  const all = loadEnv(mode, process.cwd(), '');
  const env = { SUPABASE_URL: all.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: all.SUPABASE_SERVICE_ROLE_KEY, RESEARCH_DEBUG_KEY: all.RESEARCH_DEBUG_KEY };
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

// Relative base so the build can be served from any path (artifact, static host, file preview).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), researchApi(mode)],
}));
