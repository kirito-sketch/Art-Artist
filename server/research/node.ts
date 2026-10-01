/**
 * Node adapter for the research API: works as Connect middleware (Vite dev/preview) and as a Vercel
 * Node function. Reads at most 32 KB of JSON and maps /api/research/<action> to handleResearch.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleResearch, type ResearchEnv } from './handlers.js';

const MAX_BODY = 32 * 1024;

function readJson(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  // Vercel (and some frameworks) have already parsed the body. Vercel's getter throws on malformed JSON.
  try {
    if (req.body !== undefined) return Promise.resolve(typeof req.body === 'string' ? safeParse(req.body) : req.body);
  } catch {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        resolve(undefined);
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(safeParse(Buffer.concat(chunks).toString('utf8'))));
    req.on('error', () => resolve(undefined));
  });
}
function safeParse(s: string) {
  try {
    return s ? JSON.parse(s) : {};
  } catch {
    return undefined;
  }
}

export function envFrom(source: Record<string, string | undefined>): ResearchEnv {
  return { SUPABASE_URL: source.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY, RESEARCH_DEBUG_KEY: source.RESEARCH_DEBUG_KEY, APP_ACCESS_PASSWORD: source.APP_ACCESS_PASSWORD };
}

export async function handleNodeRequest(req: IncomingMessage & { body?: unknown }, res: ServerResponse, env: ResearchEnv = envFrom(process.env)) {
  const url = new URL(req.url ?? '/', 'http://local');
  // On Vercel the rewrite passes the action as ?action=; under Vite it is the path after /api/research/.
  const action = (url.searchParams.get('action') ?? url.pathname.replace(/^.*\/api\/research\/?/, '')).replace(/^\/+|\/+$/g, '');
  const body = req.method === 'POST' ? await readJson(req) : undefined;
  const send = (status: number, payload: unknown, type = 'application/json') => {
    res.statusCode = status;
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
  };
  if (req.method === 'POST' && body === undefined) return send(400, { ok: false, error: 'invalid_json' });
  const headers: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(req.headers)) headers[k.toLowerCase()] = Array.isArray(v) ? v[0] : v;
  const query: Record<string, string> = {};
  for (const [k, v] of url.searchParams) if (k !== 'action') query[k] = v;
  const out = await handleResearch({ method: req.method ?? 'GET', action, headers, body, query }, env);
  send(out.status, out.body, out.contentType);
}
