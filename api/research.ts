/**
 * Vercel serverless entry for the research API. vercel.json rewrites /api/research/<action> (one or
 * more segments, for example task/start) to this single function as ?action=<action>. It uses the same
 * handlers as the Vite dev middleware. Imports carry explicit .js extensions: Vercel runs each file as
 * Node ESM without bundling, and extensionless relative imports fail there (ERR_MODULE_NOT_FOUND).
 * Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as server-side variables (never VITE_*).
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleNodeRequest } from '../server/research/node.js';

export default function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  return handleNodeRequest(req, res);
}
