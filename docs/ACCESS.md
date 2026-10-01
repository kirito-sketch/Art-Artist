# Access

Art and Artist has one shared password for the private parts of the deployment.

| | Routes | Needs the password |
|---|---|---|
| **Public** | `/test`, `/test/*` (the participant test, including the simulated app inside it) | No |
| | Static files (`/assets/*`, `/images/*`) | No (the test needs them) |
| | Participant research API: `/api/research/study`, `session`, `event`, `task/start`, `task/complete`, `feedback`, `session/complete`, `health` | No |
| **Private** | `/` and every other app page (including `/?research`, `/?test`, `/index.html`) | Yes |
| | `/research` (Research Dashboard) | Yes |
| | `/api/research/dashboard/*` (dashboard reads, feedback status) | Yes (401 without it) |

`/api/research/debug*` keeps its own `RESEARCH_DEBUG_KEY` and is off unless that is set.

## How it works

- **Where it is checked:** on the server, before anything is served. On Vercel, Routing Middleware
  (`middleware.ts`) runs on every request; the dashboard API checks again itself
  (`server/research/handlers.ts`). The local Vite dev and preview servers run the same check
  (`vite.config.ts`). All logic: `server/access.ts`.
- **Password page:** "Art and Artist · Private prototype · Enter the access password to continue."
  A plain HTML form that posts to `/api/access`; a wrong password shows "That password isn't correct."
  After success the visitor returns to the page they asked for (same-site paths only).
- **Session:** a cookie `aa_access`, `HttpOnly; SameSite=Lax; Secure` (on https), `Path=/`, 7 days.
  It holds an expiry signed with HMAC-SHA-256 keyed from the password, never the password itself.
  Changing the password signs everyone out. One cookie unlocks both the app and `/research`.
- **Not used:** localStorage, query-string passwords, frontend-only checks, Supabase Auth, researcher
  sign-in, `RESEARCH_DASHBOARD_KEY` (removed).
- **Public test stays separate:** visiting `/test` sets no cookie and grants nothing. A participant
  who edits the URL to `/` or `/research` sees the password page.
- **Fails closed:** if `APP_ACCESS_PASSWORD` is not set on the server, the private pages show
  "Access isn't set up on this server yet" and the dashboard API returns 503. `/test` is unaffected.

## Setup

1. Vercel → Project → Settings → Environment Variables: add `APP_ACCESS_PASSWORD` (Production, and
   Preview if you use preview links). Server-only: never a `VITE_` variable. Redeploy.
2. Vercel → Project → Settings → Deployment Protection: turn **Vercel Authentication off** for the
   URL participants use (it applies to the whole deployment, `/test` included). The password above
   then protects the private parts.
3. Locally (optional): `APP_ACCESS_PASSWORD=...` in `.env.local` turns the same gate on for
   `npm run dev`. Leave it empty for open local work.
