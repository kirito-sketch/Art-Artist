# Research data system

The data foundation for unmoderated usability testing of the Ana prototype: storage, security and
instrumentation. The participant experience is documented in docs/RESEARCH_TEST_MODE.md (`/test`) and
the researcher view in docs/RESEARCH_DASHBOARD.md (`/research`).

## 1. Architecture

```
Participant
  → Test Mode (next phase; today: window.__anaResearch in development)
  → the real Ana prototype, observed by ResearchObserver
  → research client (src/research-data/client.ts): ordered queue, batching, retry, de-duplication
  → Research API  POST /api/research/*  (server/research/handlers.ts, server only)
  → Supabase Postgres  research_* tables  (service role, RLS on)
  → future Research Dashboard (/research): researchers sign in with Supabase Auth, read through RLS
```

| Layer | Where | Knows secrets? |
|---|---|---|
| Prototype UI | `src/` | No |
| ResearchObserver | `src/research-data/ResearchObserver.tsx` | No. Reads the store, emits semantic events, never changes state |
| Research client | `src/research-data/client.ts` | Holds only the participant's opaque session token |
| Taxonomy + sanitiser | `src/research-data/taxonomy.ts` | No. Shared by client and server |
| Research API | `server/research/handlers.ts`, mounted by `server/research/node.ts` | **Yes**: `SUPABASE_SERVICE_ROLE_KEY` |
| Hosting adapters | `vite.config.ts` (dev and preview), `api/research.ts` + `vercel.json` rewrite (Vercel) | Read the env, pass it to the API |
| Database | `supabase/migrations/*.sql`, `supabase/seed.sql` | n/a |

Research data never mixes with Ana's demo data. The demo data (people, houses, projects, roles,
credits, posts, messages) is fixture data inside the browser bundle. Research data is only in the
`research_*` tables in Supabase, and nothing links the two except plain ids like `o-neela-dop`
recorded as `object_id` text. So resetting fixtures, reloading, or switching personas cannot change
or delete a research record.

The existing Research Mode (`?research`, Shift+E to exit, Aditi acting for Konark) is unchanged. It
still works exactly as before and records nothing unless a research session has been started.

## 2. Supabase integration

- `@supabase/supabase-js` is used **only on the server** (the research API). The browser bundle
  contains no Supabase client and no Supabase key at all; it talks only to `/api/research`.
- Server variables have no `VITE_` prefix, so Vite never ships them to the browser. This was
  verified by building with canary values and scanning `dist/`: no matches.
- During `npm run dev` and `npm run preview` the Vite plugin in `vite.config.ts` serves
  `/api/research/*` from `server/research/node.ts`. In production, deploy `api/research.ts` (with the `vercel.json` rewrite)
  as a Vercel function, or mount `handleNodeRequest` on any Node server. **A static host (including
  the claude.ai artifact) has no API, so research logging is simply off there.** The client stays
  inactive and the prototype works normally.

### Environment variables

| Variable | Side | Purpose |
|---|---|---|
| `SUPABASE_URL` | server | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Writes research data. Never in a `VITE_` variable, never in the browser |
| `RESEARCH_DEBUG_KEY` | server | Optional. Enables the internal debug view (16+ characters). Empty means off |
| `VITE_RESEARCH_API_BASE` | browser | API base, default `/api/research` |
| `VITE_RESEARCH_ENABLED` | browser | `false` switches research logging off in a build |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | browser | Future dashboard only. The anon key is public by design and RLS locks it out of research tables |

On Vercel, `vercel.json` rewrites `/api/research/<action>` (including two-segment actions such as
`task/start`) to the single function `api/research.ts` as `?action=<action>`. Server imports use
explicit `.js` extensions because Vercel runs each function file as Node ESM without bundling.
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are read only by the Research Dashboard, which is a
lazily loaded chunk; they never appear in the prototype bundle. The anon/publishable key is public by
design, and RLS keeps research tables closed to it.

Copy `.env.example` to `.env.local`. All `.env*` files except the example are git-ignored.

## 3. Database schema

All tables are in `public`, prefixed `research_`, with Row Level Security enabled. Migration:
`supabase/migrations/20261001000000_research_foundation.sql`.

**Enums**
- `research_participant_type`: individual_creative, production_house, other
- `research_study_status`: draft, active, paused, completed
- `research_session_status`: active, completed, abandoned
- `research_attempt_outcome`: in_progress, completed, completed_with_difficulty, abandoned, skipped
- `research_feedback_category`: confusing, couldnt_find, visual_issue, didnt_work, suggestion, other
- `research_feedback_status`: new, reviewed, actionable, fixed, wont_fix

| Table | What it is | Key columns |
|---|---|---|
| `research_studies` | A study, for example "Ana Individual Creative Usability Test (V29)" | `slug` (unique), `title`, `status`, `participant_type`, `prototype_version` (planned build), `notes`, `started_at`, `ended_at` |
| `research_participants` | A person taking part, with no email and no demographics | `participant_code` (P001, P002 ... auto, or researcher-assigned), optional `display_name`, `participant_type`, `primary_craft`, `experience_level`, `consented_at` |
| `research_sessions` | One participant testing one study on one build | `study_id`, `participant_id`, `token_hash` (sha256, unique), `client_start_id` (idempotency), **`prototype_version`** (written once, never updated), `selected_persona`, `status`, `started_at`, `completed_at`, `device_type`, `viewport_width/height`, `client_info` (coarse browser/OS/touch, never the full user agent) |
| `research_tasks` | A task in a study | `study_id`, `key` (stable handle, for example `show-interest-role`), `sequence`, `title`, `instruction`, `participant_type`, `success_events text[]`, `success_object_type`, `success_object_id`, `is_active` |
| `research_task_attempts` | A participant attempting a task | `session_id`, `task_id`, `client_attempt_id` (idempotency), `started_at`, `completed_at`, `duration_ms` (computed by the server), `outcome`, `success_detected`, `difficulty_rating` 1-5, `expectation_match` 1-5, `feedback_text`, `wrong_turn_count` |
| `research_events` | The behavioural log: the source of truth for journeys | `session_id`, `task_attempt_id`, `client_event_id` (idempotency), **`sequence`** (strictly increasing per session), `event_name`, `screen`, `object_type`, `object_id`, `metadata jsonb` (≤ 2 KB, sanitised), `client_ts`, `created_at` |
| `research_feedback` | A feedback item | `session_id`, `task_attempt_id`, `event_id`, `client_feedback_id` (idempotency), `category`, `screen`, `participant_comment`, `prototype_version` (copied from the session by the server), `persona`, `trail_until_sequence`, `interaction_context`, `attachment_url` (reserved for screenshots), `status` and `researcher_note` (researcher-only) |
| `research_researchers` | Future dashboard allowlist: Supabase Auth user ids | `user_id` |

`success_events` is an array rather than a single `success_event` so that, for example, "save a
project or a role" can succeed on either `project_saved` or `role_saved`.

**Indexes.** The dashboard's queries are covered by these indexes:
- sessions by (study, started_at), participant, version and started_at;
- attempts by (session, started_at), (task, outcome), plus a partial unique index allowing one open attempt per task;
- events by (session, sequence) via the unique key, by attempt, by (name, time) and by time;
- feedback by session, (category, time) and (status, time).

**Integrity.** Foreign keys restrict deleting a study or participant that has sessions. Deleting a
session cascades to its attempts, events and feedback. Check constraints bound every text length,
rating range and JSON size.

## 4. Relationships

```
research_studies 1 ── * research_tasks
research_studies 1 ── * research_sessions * ── 1 research_participants
research_sessions 1 ── * research_task_attempts * ── 1 research_tasks
research_sessions 1 ── * research_events  (* ── 0..1 research_task_attempts)
research_sessions 1 ── * research_feedback (── 0..1 attempt, ── 0..1 event)
```

One backend serves both study types. A Production House study is a study with
`participant_type = 'production_house'` and its own tasks. The draft `ana-production-house-v29` study
is seeded to prove this, with tasks for the Slate, a project, a role, interested people, adding to a
project and issuing a credit.

## 5. Event taxonomy

The authoritative list is `RESEARCH_EVENTS` in `src/research-data/taxonomy.ts`. Names outside it are
dropped by both client and server. Events say what happened in Ana terms, never which element was
touched.

| Group | Events |
|---|---|
| Research lifecycle | `session_started`, `session_completed`, `task_started`, `task_completed`, `task_skipped`, `feedback_opened`, `feedback_submitted`, `stuck_reported`, `task_instruction_opened`, `survey_submitted` |
| Navigation | `home_viewed`, `discover_opened`, `inbox_opened`, `own_profile_viewed`, `screen_opened` {route}, `navigated_back` {from}, `sheet_opened` {sheet} |
| Discovery | `discover_tab_selected` {tab}, `discover_filter_selected` {filter} |
| Objects opened | `role_opened`, `project_opened`, `person_profile_opened`, `house_profile_opened`, `post_opened`, `conversation_opened`, `notifications_opened`, `saved_opened`, `settings_opened` |
| Actions / state | `role_saved` / `_unsaved`, `project_saved` / `_unsaved`, `post_saved` / `_unsaved`, `person_followed` / `_unfollowed`, `house_followed` / `_unfollowed`, `interest_sent`, `interest_withdrawn`, `message_sent`, `credit_accepted`, `identity_switched` {from, to}, `availability_changed` {open} |
| Production House (reserved) | `interest_reviewed`, `project_member_added`, `credit_issued`, `role_published` |

Object types: role, project, person, house, post, conversation, credit, task.

**How events are produced.** `ResearchObserver` (mounted once inside the store provider) diffs store
state: route stack, tab, sheet, saved items, following, interests, the participant's own message ids,
acting identity, availability and credit acceptance. Discover's section and craft chip are local
state, so `DiscoverScreen` has one observe-only effect. No product action was changed.
Hesitation and wrong turns are read from the stream (for example `role_opened`, `navigated_back`,
`role_opened` again), so the client does not need to detect them.

## 6. Privacy rules

- Never recorded: passwords, auth secrets, message contents, anything typed into prototype fields,
  clipboard, search text, or the full user agent. `message_sent` carries only the conversation id.
- `sanitizeMetadata` (client **and** server) keeps at most 12 flat keys with short strings, numbers
  and booleans. It drops any key that looks like text or personal data (`text`, `message`, `note`,
  `comment`, `email`, `phone`, `query`, `password`, `token` ...).
- Ids and route names must be short tokens (no spaces or free text).
- The only participant words stored are the ones a study explicitly asks for: a task's
  `feedback_text` and a feedback item's `participant_comment` (both ≤ 2000 characters).
- Participants are codes. Name is optional; there is no email and there are no demographics.

## 7. API endpoints

All `POST` with a JSON body. After session start, every call sends
`Authorization: Bearer <session token>`. Responses never include database ids or other participants'
data.

| Endpoint | Body | Effect |
|---|---|---|
| `POST /api/research/session` | `studySlug`, `consent: true`, `prototypeVersion`, `clientStartId`, optional `persona`, `participantCode`, `participant{displayName, participantType, primaryCraft, experienceLevel}`, `client{deviceType, viewportWidth, viewportHeight, browser, os, touch}` | Creates (or reuses by code) the participant and creates the session. Returns `token`, `participantCode`, study title, and tasks (key, sequence, title, instruction, success events and object type, so Test Mode can notice success). Study must be `active` |
| `POST /api/research/event` | `events[]` (≤ 50): `id`, `seq`, `name`, `screen`, `objectType`, `objectId`, `metadata`, `ts`, `attemptId` | Stores events once each, links them to the attempt and marks the attempt `success_detected` when a task's success event arrives |
| `POST /api/research/task/start` | `taskKey`, `attemptId` | Opens an attempt. A repeat, or a second open attempt for the same task, returns the existing one |
| `POST /api/research/task/complete` | `attemptId`, `outcome`, `difficulty`, `expectationMatch`, `feedbackText` | Closes the attempt and computes `duration_ms`. Repeats are ignored |
| `POST /api/research/feedback` | `id`, `category`, `comment`, `screen`, `attemptId`, `eventId`, `context{persona, route, tab, sheet, acting, taskKey, lastSequence, source, question, rating}` | Stores once. The server copies `prototype_version` from the session. `source` is `button` (Feedback control), `stuck` (I'm stuck) or `survey` (final survey answer, with `question` and, for the 1–5 question, `rating`) |
| `POST /api/research/session/complete` | `status` (completed / abandoned) | Closes the session and abandons any open attempts. Repeats are ignored |
| `GET /api/research/study` | header `x-study-type` (individual_creative / production_house) | The newest active study of that type: slug, title, description, task count. Participant-facing only |
| `GET /api/research/health` | | `{ ok, configured, database: reachable / unreachable / not_configured, latencyMs }`, from a head-only round trip to `research_studies`. 200 when reachable, 503 otherwise. Reveals no data or error detail |
| `GET /api/research/debug/page`, `GET /api/research/debug` | header `x-research-debug-key` | Internal development view. Returns **404 unless `RESEARCH_DEBUG_KEY` is set**, and 401 without the right key |

Limits: body ≤ 32 KB, 50 events per call, text lengths and JSON sizes are bounded by the API and the
database. Closed sessions accept no more writes (409).

### Client API (`src/research-data/client.ts`)

```ts
import { research } from '../research-data/client';
await research.startSession({ studySlug: 'ana-individual-creative-v29', consent: true }); // persona comes from context
research.startTask('show-interest-role');
research.track('role_opened', { objectType: 'role', objectId: 'o-neela-dop' });   // usually automatic
research.completeTask('show-interest-role', { outcome: 'completed', difficulty: 2, expectationMatch: 4 });
research.submitFeedback({ category: 'confusing', comment: 'Optional words' });   // context attached automatically
research.completeSession();
```

Every call is a no-op without an active session. A session token held by a tab only counts on the
surface that started it or called `research.resume()` (Test Mode) in that page load, so the normal
prototype opened later in the same tab records nothing. Test Mode also uses `research.subscribe()`
(to notice task success), `research.activeStudy()` and `research.session()`. In development,
`window.__anaResearch` exposes the same object for the console and test scripts.

## 8. Session-token model

- On session start the server makes 32 random bytes (base64url, 43 characters). It stores only
  `sha256(token)` in `research_sessions.token_hash` and returns the token once.
- The browser keeps the token in `sessionStorage` for that tab. A reload resumes the session; a new
  tab or a closed browser does not.
- Every later write looks the session up by hash, and can only add rows to that session. The token
  grants **no reads at all**: there is no participant read endpoint.
- Database row ids are never sent to the browser, so they cannot be used as a handle either.
- A lost start response cannot be replayed into a second token: `client_start_id` is unique and a
  repeat gets 409.

## 9. Prototype versioning

- `src/version.ts` is the single source: `ANA_PROTOTYPE_VERSION = 'V29'`,
  `ANA_PROTOTYPE_BUILD_DATE = '2026-10-01'`, and the label `V29 (2026-10-01)`. Bump it whenever a
  build is shared for testing.
- The client sends the label at session start. The server writes it to
  `research_sessions.prototype_version`, which is never updated afterwards.
- Feedback copies the version **from the session row on the server**, not from the request. So a
  feedback item always names the build that session tested, whatever the app version is later.
- `research_studies.prototype_version` records the build a study was planned for; sessions record
  what was actually tested.

## 10. Failure behaviour

- Product actions (Show Interest, Follow, Save, navigation, messaging) never wait for, or depend on,
  research storage. The observer reacts after state has already changed, and the client never throws.
- If the API or Supabase is down, writes stay in one ordered queue, persisted in `sessionStorage`
  (max 300). They retry after 2, 5, 15, 30 and 60 s, then are dropped with a development-only
  warning. 4xx responses are dropped immediately, because they will never succeed.
- A database outage returns 5xx (retry), never 401, so the client cannot mistake an outage for a bad
  token and throw data away.
- **De-duplication:**
  - every write has a client id with a unique constraint (events, attempts, feedback, session start);
  - task and session completion only update rows that are still open;
  - one open attempt per task per session is enforced by a partial unique index;
  - the client also ignores an identical event repeated within 400 ms, which covers a double tap, a
    Strict Mode double effect or a remount.
- **Ordering:** `sequence` is assigned in the browser at the moment of the action, and is unique per
  session. Task starts are queued before the events inside them. The journey never depends on
  timestamps or network arrival order.

## 11. Researcher-access model

| Who | Can | Cannot |
|---|---|---|
| **anon key** (anyone with the public key, which includes participants) | Nothing on research tables: all privileges revoked, RLS on, no anon policies | Read or write any research row |
| **Participant** (holds a session token) | Write to its own session through the API | Read anything: no read endpoint exists |
| **Server API** (service role) | Everything; bypasses RLS | It is never exposed to the browser |
| **Signed-in user listed in `research_researchers`** (future dashboard) | `SELECT` on all research tables; `UPDATE (status, researcher_note)` on feedback | Write anything else |
| **Signed-in user not listed** | Nothing: RLS filters every row out | |

Recommended protection for `/research` (next phase): Supabase Auth (email magic link) for the
researcher; add their user id to `research_researchers`; the dashboard reads with the anon key plus
the researcher's session, so RLS does the gatekeeping. Keep the route out of prototype navigation.
Until then, the only read path is the internal debug view, protected by `RESEARCH_DEBUG_KEY` and off
by default.

## 12. Example queries and data flow

Journey for a session (the trail):

```sql
select sequence, event_name, screen, object_type, object_id, metadata
from research_events where session_id = :session order by sequence;
```

The trail leading to a feedback item (derived, not copied):

```sql
select e.sequence, e.event_name, e.screen
from research_feedback f
join research_events e on e.session_id = f.session_id and e.sequence <= f.trail_until_sequence
where f.id = :feedback order by e.sequence desc limit 12;
```

Task results for a study and build:

```sql
select t.sequence, t.title, count(*) attempts,
       avg(a.duration_ms)::int avg_ms, avg(a.difficulty_rating)::numeric(3,1) difficulty,
       sum((a.success_detected)::int) detected_success,
       sum((a.outcome = 'abandoned' or a.outcome = 'skipped')::int) gave_up
from research_task_attempts a
join research_tasks t on t.id = a.task_id
join research_sessions s on s.id = a.session_id
where t.study_id = :study and s.prototype_version = 'V29 (2026-10-01)'
group by t.sequence, t.title order by t.sequence;
```

Wrong turns (back right after opening something) per attempt:

```sql
select task_attempt_id, count(*) filter (where event_name = 'navigated_back') backs
from research_events where session_id = :session group by task_attempt_id;
```

New feedback to review:

```sql
select f.created_at, f.category, f.screen, f.participant_comment, p.participant_code, f.prototype_version
from research_feedback f join research_sessions s on s.id = f.session_id
join research_participants p on p.id = s.participant_id
where f.status = 'new' order by f.created_at desc;
```

Data flow for one action: the participant taps Show interest, then Send. The store records the
interest (the product does its normal thing). `ResearchObserver` sees a new key in `interestsSent`
and calls `research.track('interest_sent', { objectType: 'role', objectId })`. The client gives it the
next `sequence`, the current screen and the open attempt, and batches it. `POST /api/research/event`
validates the token, sanitises the event and inserts it once. Because `interest_sent` is a success
event of task `show-interest-role`, the attempt is marked `success_detected = true`.

## Setup (what you do in Supabase)

You need a Supabase account (free tier is fine), Node 18+, and this repository.

1. **Create a project.** supabase.com → New project. Pick a name (for example `ana-research`) and a
   region near your participants, set a database password (store it in a password manager), then
   create. Wait about two minutes for it to finish.
2. **Copy the keys.**
   - Project Settings → Data API: copy the **Project URL**.
   - Project Settings → API Keys: copy the **secret** key (`sb_secret_...`; on older projects the
     legacy **service_role** key) and the **publishable** key (`sb_publishable_...`, or the legacy
     **anon** key). Either style works. The publishable/anon key is only needed for the lockout check
     and the future dashboard.
3. **Add environment variables.** In the repository: `cp .env.example .env.local`, then fill in
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Optionally set `VITE_SUPABASE_ANON_KEY`, and a long
   random `RESEARCH_DEBUG_KEY` if you want the debug view. Never commit `.env.local` (it is ignored).
4. **Apply the migration.** Either way works:
   - **Dashboard:** SQL Editor → New query → paste all of
     `supabase/migrations/20261001000000_research_foundation.sql` → Run. It should report success.
   - **CLI:** `npx supabase login`, `npx supabase link --project-ref <your-ref>`, then `npx supabase db push`.
5. **Seed the development study.** SQL Editor → paste `supabase/seed.sql` → Run (safe to re-run).
   Table Editor should now show `research_studies` with 2 rows and `research_tasks` with 12.
6. **Run the prototype.** `npm install`, then `npm run dev`. Open http://localhost:5173/api/research/health:
   it should say `{"ok":true,"configured":true}`.
7. **Verify end to end.** With the dev server running: `npm run research:e2e`. It runs a complete
   session (start, task, events, completion with ratings, feedback, completion), reads it back with
   the service role, checks every relationship, and checks that the anon key is locked out. Expect
   `41 passed, 0 failed` with the anon key set (36 without it). It writes one test session per run.
8. **Start a session from the real UI (development).** In the browser console on the prototype:
   `await __anaResearch.startSession({ studySlug: 'ana-individual-creative-v29', consent: true })`,
   then `__anaResearch.startTask('show-interest-role')`, use Ana normally, and finish with
   `__anaResearch.completeTask('show-interest-role', { outcome: 'completed', difficulty: 2 })` and
   `__anaResearch.completeSession()`. `__anaResearch.clear()` forgets the session in that tab.
9. **Inspect records.** Supabase Table Editor (`research_sessions`, `research_events` sorted by
   `sequence`, ...), or the internal view at http://localhost:5173/api/research/debug/page (enter your
   `RESEARCH_DEBUG_KEY`). The debug view is development-only: not linked anywhere, and switched off
   when the key is unset.
10. **Deploy (when you share the build).** On a static host research logging stays off. To record
    from a hosted build, deploy to Vercel (the `api/` function is picked up automatically) and set
    `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project's environment variables
    (Production and Preview), not as `VITE_` variables.

Later, to give yourself dashboard access: create your user in Authentication → Users, then in the SQL
editor run `insert into research_researchers (user_id, note) values ('<your auth user id>', 'me');`.

## Validation done in this phase

There were no Supabase credentials in the build environment. So the migration, seed and API were
validated against a local stack of the same parts: Postgres 16 with Supabase's roles (`anon`,
`authenticated`, `service_role` with BYPASSRLS) and default grants, recreated by
`scripts/research/local-supabase-shim.sql`; PostgREST 12 with JWT role switching; and the real
`@supabase/supabase-js` client. Results:
- migration applies cleanly;
- the seed is idempotent;
- `npm run research:e2e` passes 41 of 41;
- a browser run through the real UI stored a correct, gap-free journey;
- with the backend taken down mid-session, the UI kept working and the queue delivered everything
  in order after recovery.

Run step 7 once against your own project to confirm the same on hosted Supabase.
