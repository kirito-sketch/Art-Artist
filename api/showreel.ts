import type { IncomingMessage, ServerResponse } from 'node:http';
import { reelMetadata } from '../server/media/metadata.js';
import { videoLink } from '../src/domain/showreel.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.statusCode = 405; res.setHeader('Allow', 'GET'); return res.end('{"error":"method_not_allowed"}'); }
  const raw = new URL(req.url ?? '/', 'https://ana.invalid').searchParams.get('url') ?? '';
  if (raw.length > 2048 || !videoLink(raw)) { res.statusCode = 400; return res.end('{"error":"unsupported_link"}'); }
  try { res.end(JSON.stringify(await reelMetadata(raw))); }
  catch { res.statusCode = 502; res.end('{"error":"metadata_unavailable"}'); }
}
