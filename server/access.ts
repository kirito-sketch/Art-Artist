/**
 * Private access for Art and Artist: one shared password (APP_ACCESS_PASSWORD, server-only).
 *
 *   Public:  /test and /test/*, static assets, the participant research API (/api/research/*
 *            except dashboard/*).
 *   Private: / and every other app page, /research, and the dashboard API
 *            (/api/research/dashboard/*). One password unlocks all of them.
 *
 * The password is checked on the server (Vercel Routing Middleware, middleware.ts; the Vite dev and
 * preview servers in vite.config.ts; the dashboard API in server/research/handlers.ts). A correct
 * password sets an HttpOnly, SameSite=Lax (Secure on https) cookie holding an expiry signed with
 * HMAC-SHA-256 keyed from the password: it never contains the password, lasts 7 days, and stops
 * working as soon as the password changes. Nothing here is imported by the browser bundle.
 *
 * Web-standard APIs only (crypto.subtle, Request, Response), so the same code runs on the Edge
 * runtime (middleware) and in Node (API, Vite).
 */
export const ACCESS_COOKIE = 'aa_access';
export const ACCESS_LOGIN_PATH = '/api/access';
const MAX_AGE_S = 7 * 24 * 60 * 60;
const enc = new TextEncoder();

// --------------------------------------------------------------------------------------------- paths
/** The participant test: always public, never gated. */
export const isPublicTestPath = (path: string) => /^\/test(\/|$)/.test(path);

/**
 * An app page (an HTML document) that needs the password: anything that is not /test, not an API and
 * not a static file. /index.html is private too, since it would otherwise boot the app directly.
 */
export function isPrivatePage(path: string): boolean {
  if (isPublicTestPath(path) || path.startsWith('/api/') || path.startsWith('/@')) return false;
  if (path === '/index.html') return true;
  const last = path.slice(path.lastIndexOf('/') + 1);
  return !last.includes('.');
}

/** Researcher-only API: the dashboard reads and feedback status. Both URL forms (rewrite and direct). */
export function isPrivateApi(url: URL): boolean {
  if (/^\/api\/research\/dashboard(\/|$)/.test(url.pathname)) return true;
  return /^\/api\/research\/?$/.test(url.pathname) && (url.searchParams.get('action') ?? '').replace(/^\/+/, '').startsWith('dashboard');
}

// ------------------------------------------------------------------------------------------- signing
const b64url = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hmac(password: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(`art-and-artist-access:v1:${password}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Constant-time comparison of a submitted password (both sides hashed to equal length first). */
export async function passwordMatches(input: string, password: string): Promise<boolean> {
  return sameString(await hmac(password, `pw:${input}`), await hmac(password, `pw:${password}`));
}

export async function issueToken(password: string, now = Date.now()): Promise<string> {
  const exp = Math.floor(now / 1000) + MAX_AGE_S;
  return `v1.${exp}.${await hmac(password, `v1.${exp}`)}`;
}

export async function tokenValid(password: string | undefined, token: string | null | undefined, now = Date.now()): Promise<boolean> {
  if (!password || !token) return false;
  const m = /^v1\.(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!m || Number(m[1]) * 1000 <= now) return false;
  return sameString(m[2], await hmac(password, `v1.${m[1]}`));
}

export function cookieValue(header: string | null | undefined, name = ACCESS_COOKIE): string | null {
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

/** For the API: does this request carry a valid access cookie? */
export const hasAccess = (cookieHeader: string | null | undefined, password: string | undefined) => tokenValid(password, cookieValue(cookieHeader));

// ---------------------------------------------------------------------------------------------- gate
/**
 * Decide one request. Returns a Response to send (gate page, login result, 401), or undefined to let
 * the request through unchanged.
 */
export async function accessGate(request: Request, password: string | undefined): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (url.pathname === ACCESS_LOGIN_PATH) return login(request, password, url);
  const api = isPrivateApi(url);
  if (!api && !isPrivatePage(url.pathname)) return undefined;
  if (await tokenValid(password, cookieValue(request.headers.get('cookie')))) return undefined;
  if (api) return new Response(JSON.stringify({ ok: false, error: password ? 'access_required' : 'access_not_configured' }), { status: password ? 401 : 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  return gatePage({ next: url.pathname + url.search, configured: !!password });
}

async function login(request: Request, password: string | undefined, url: URL): Promise<Response> {
  if (request.method !== 'POST') return Response.redirect(new URL('/', url), 303);
  let input = '';
  let next = '/';
  try {
    const form = await request.formData();
    input = String(form.get('password') ?? '');
    next = safeNext(String(form.get('next') ?? '/'));
  } catch {
    /* malformed body: treated as a wrong password */
  }
  if (!password) return gatePage({ next, configured: false });
  if (!input || input.length > 200 || !(await passwordMatches(input, password))) return gatePage({ next, configured: true, wrong: true });
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return new Response(null, {
    status: 303,
    headers: { Location: next, 'Set-Cookie': `${ACCESS_COOKIE}=${await issueToken(password)}; Path=/; Max-Age=${MAX_AGE_S}; HttpOnly; SameSite=Lax${secure}`, 'Cache-Control': 'no-store' },
  });
}

/** Only same-site paths: never another origin, never back to the login endpoint. */
function safeNext(n: string): string {
  if (!n.startsWith('/') || n.startsWith('//') || n.startsWith('/\\') || n.startsWith(ACCESS_LOGIN_PATH)) return '/';
  return n.slice(0, 500);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function gatePage(o: { next: string; configured: boolean; wrong?: boolean }): Response {
  const note = !o.configured
    ? '<p class="err" role="alert">Access isn\'t set up on this server yet.</p>'
    : o.wrong
      ? '<p class="err" role="alert">That password isn\'t correct.</p>'
      : '';
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>Art and Artist</title>
<style>
:root{color-scheme:light;--text:#111;--text-2:#6e6e73;--line:#e5e5ea;--action:#275c50;--action-pressed:#1e4a40;--danger:#c4372d}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:#f2f2f7;color:var(--text);font:16px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
main{width:100%;max-width:360px;background:#fff;border:1px solid var(--line);border-radius:20px;padding:28px 24px}
.eyebrow{margin:0 0 14px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-2)}
h1{margin:0 0 6px;font-size:24px;line-height:1.2;letter-spacing:-.02em;font-weight:700}
p{margin:0 0 20px;color:var(--text-2)}
label{display:block;font-size:13px;font-weight:600;margin:0 0 6px;color:var(--text)}
input{width:100%;height:46px;padding:0 14px;border:1px solid var(--line);border-radius:12px;font:inherit;color:var(--text);background:#fff}
input:focus{outline:2px solid var(--action);outline-offset:1px;border-color:transparent}
button{width:100%;height:48px;margin-top:14px;border:0;border-radius:999px;background:var(--action);color:#fff;font:inherit;font-weight:600;cursor:pointer}
button:active{background:var(--action-pressed)}
.err{margin:10px 0 0;color:var(--danger);font-size:14px}
</style></head>
<body><main>
<p class="eyebrow">Art and Artist</p>
<h1>Private prototype</h1>
<p>Enter the access password to continue.</p>
<form method="post" action="${ACCESS_LOGIN_PATH}">
<input type="hidden" name="next" value="${esc(o.next)}">
<label for="pw">Password</label>
<input id="pw" name="password" type="password" autocomplete="current-password" required autofocus${o.wrong ? ' aria-invalid="true"' : ''}>
${note}
<button type="submit">Continue</button>
</form>
</main></body></html>`;
  return new Response(html, { status: o.configured ? 401 : 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
}
