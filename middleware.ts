/**
 * Vercel Routing Middleware: runs before static files and rewrites on every request it matches.
 * /test stays public; the app (/ and its routes), /research and the dashboard API need the shared
 * password (APP_ACCESS_PASSWORD, server-only). All logic lives in server/access.ts.
 */
import { accessGate } from './server/access.js';

// Static files under /assets and /images never need a decision; everything else is checked.
export const config = { matcher: '/((?!assets/|images/).*)' };

export default function middleware(request: Request) {
  return accessGate(request, process.env.APP_ACCESS_PASSWORD);
}
