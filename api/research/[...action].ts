/**
 * Vercel serverless entry for the research API (/api/research/*). Uses the same handlers as the Vite
 * dev middleware. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the hosting project's
 * environment (server-side variables, never VITE_*). Other Node hosts can mount handleNodeRequest.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleNodeRequest } from '../../server/research/node';

export default function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  return handleNodeRequest(req, res);
}
