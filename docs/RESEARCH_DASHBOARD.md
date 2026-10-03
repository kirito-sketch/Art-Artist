# Research Dashboard (`/research`)

> **Product name: Art and Artist.** Legacy/internal codename: Ana. The codename survives only in
> technical identifiers (for example storage keys, the `ana_research` local database name, the
> `ANA_PROTOTYPE_VERSION` constant and some file names). It never appears in visible UI.

A researcher-only view of usability-test data. Desktop-first, in Art and Artist's paper and type. It shows the
raw research data clearly and correctly. There are no AI summaries, heatmaps, replay, screenshots or
export.

- **URL:** `https://<deployment>/research` (on a static preview, `?dashboard`). Separate from the
  existing `?research` Research Mode.
- **Code:** `src/research-dashboard/` (`Dashboard.tsx`, `data.ts`, `labels.ts`, `dashboard.css`), a
  lazily loaded chunk; `server/research/handlers.ts` (`dashboard()`) for the read API.

## Access model

`/research` sits behind the **shared access password** (`APP_ACCESS_PASSWORD`), the same one that
unlocks the normal app. There is no researcher sign-in, no Supabase Auth and no separate dashboard key.
See docs/ACCESS.md.

```
Browser /research ──(no access cookie)──> password page (Vercel middleware)
Browser /research ──(access cookie)─────> dashboard
  → GET/POST /api/research/dashboard/*      (same cookie required; checked in middleware and API)
  → Supabase with SUPABASE_SERVICE_ROLE_KEY (server-only)
```

- The browser holds **no Supabase client and no Supabase key** (not even the anon key), and no
  password or key in storage: only the HttpOnly access cookie the server set.
- The API returns only the columns the dashboard shows: never token hashes, client idempotency ids
  or other internals.
- If the access expires (7 days) or the password changes, the dashboard says so; reloading shows the
  password page.
- `research_researchers`, `research_is_researcher()` and the RLS read policies remain in the database,
  unused by the dashboard. Nothing was dropped.

### Dashboard API

| Endpoint | Returns |
|---|---|
| `GET /api/research/dashboard/studies` | All studies: id, slug, title, status, participant type, planned version |
| `GET /api/research/dashboard/study?id=<studyId>` | That study's tasks, sessions (with participant code, optional name, craft, experience, type), task attempts and feedback |
| `GET /api/research/dashboard/events?session=<id>[&until=<sequence>]` | One session's events in order, optionally up to a feedback item's position |
| `GET /api/research/dashboard/events?attempts=<id,id,…>` | Events for a set of task attempts (up to 200) |
| `POST /api/research/dashboard/feedback-status` `{id, status}` | Sets a feedback item's review status (new, reviewed, actionable, fixed, wont_fix) |

Invalid ids return 400, wrong methods 405, no valid access cookie 401, `APP_ACCESS_PASSWORD` or the
backend not configured 503.

## Information architecture

Top bar (always visible):
- **Study** selector (the Individual Creative study and the Production House study, never merged);
- the **Overview · Sessions · Tasks · Feedback** sections;
- the **Version** filter;
- Refresh and Sign out.

Deep links use the hash: `#/sessions/<id>`, `#/tasks/<id>`.

## Version handling

The prototype version is a global filter that applies to every view. With "All versions" and more than
one version present, a banner always says so, for example "Showing 2 prototype versions combined
(V29: 14 · V30: 1). Choose a version to compare like with like." The Overview always shows the
per-version breakdown, and every session, attempt and feedback card carries its version badge.
Versions are never combined without that being visible.

## Overview

| Metric | Definition |
|---|---|
| Sessions | Sessions in the study (and version) |
| Completed / Abandoned / In progress | By session status |
| Completion rate | Completed sessions ÷ all sessions |
| Avg task difficulty | Mean of all difficulty ratings (1 very easy, 5 very difficult) |
| Feedback items | Participant feedback, excluding survey and first-run answers |

**Task 1, Getting started (first run, splash to the main product)**, for studies that have it:
attempts, completion rate, abandoned (count and rate), skipped, median time to first Home (completed
attempts), average "understand what it is for" and "getting started" ratings (1 very difficult, 5 very
easy), then every participant's answer to "what do you think Art and Artist helps you do?", what was
unclear during the introduction or setup, and the feedback sent during the first run, each linked to
its session. Built from the existing attempts and feedback rows (`source = first_run`), no new
analytics tables.

Session detail shows the first-run answers under Task 1 and the onboarding steps in the path and
trail ("First run: Splash", "First run: Profile: craft", "Reached the main product (new account)").
Sessions that started before Task 1 existed show it as "Not part of this session (task added later)";
their task numbers follow the current list (their old Task 1 now reads Task 2).

Then two tables:
- **Prototype versions:** sessions, completed, abandoned and average difficulty per version.
- **Tasks:** attempts, completion, with difficulty, abandoned, skipped, median time, average
  difficulty and feedback count per task.

There are no charts.

## Sessions

The list shows participant (code first, optional name secondary), role/craft, version, started, tasks
completed (n of the study's total), status, average difficulty and feedback count. Filters: status
(completed, abandoned, in progress) and participant type, plus the global study and version.

**Session detail:**
- **Participant summary:** status, version, craft, experience, persona, device, start time and length.
- **One card per task:**
  - outcome, plus "success detected" and "used I'm stuck";
  - time, difficulty, and expectation (Yes or No);
  - the **path**, built from that attempt's events, for example
    `Feedback → Discover → People → Profile: Aditi Ghosh`;
  - the participant's own words ("Expected: …", "Confusing: …");
  - any feedback given during the task.
- **Final survey** answers, in question order.
- **Event trail:** every event in sequence, translated into a sentence ("Opened role: Director of
  Photography (Neela Akasham)", "Selected Posts", "Tapped I'm stuck"). Raw data sits behind a small
  "raw" disclosure per event.

**Wrong turns:** V1 shows the path and does not label detours; the researcher interprets it. Back taps
and "I'm stuck" are visible in the path. No detour score is presented as fact.

## Tasks

The table uses the same columns as the Overview. Completion counts completed and completed-with-
difficulty out of finished attempts; median time is over completed attempts. Opening a task shows its
instruction, success events, metrics and every attempt, for example:

```
P009 · completed · 4s · difficulty 2 · V29 (2026-10-01)        Posts → Post by Devika Sharma
P011 · abandoned · - · difficulty - · V29 (2026-10-01)
P012 · skipped · 2s · difficulty - · V29 (2026-10-01)            I'm stuck → Feedback
P014 · completed with difficulty · 4s · difficulty 5 · V29       Posts → Post by Devika Sharma
P015 · completed · 0s · difficulty 1 · V30 (2026-10-08)          Discover → Posts → Post by Devika Sharma
```

## Feedback inbox

Category chips with counts:
- All
- Confusing
- Couldn't find
- Visual issue
- Didn't work
- Suggestion
- Other

Further filters: task, version, screen and review status.

Each card shows:
- category (and "from I'm stuck" when relevant);
- version and timestamp;
- the participant's comment;
- participant code (linking to the session), task and screen;
- the **recent interaction context**, derived from events up to the feedback's position, for example
  `Discover → People → Profile: Aditi Ghosh → Back → I'm stuck → Feedback`;
- the **review status** selector: New · Reviewed · Actionable · Fixed · Won't fix. It saves
  immediately through RLS, and participants never see it.

## Study health

The question this section answers: *is the test itself working?* It is computed in the browser from the study's data plus all of its events (`dashboard/study-events`, paged, password-protected). The logic is in `src/research-dashboard/health.ts`, and it works for every study, old or new.

- **Funnel:**
  - sessions;
  - completed;
  - ended early (chose Stop);
  - **left without finishing** (still open with 30 minutes of no activity; closing the tab never ended a session, so older data needs this);
  - in progress;
  - completion rate, median session time, median finished per session;
  - sessions that came back after an interruption (`session_resumed`);
  - drop-off during getting started.
- **By scenario:**
  - reached, finished and skipped;
  - stopped **in the app** versus **at the questions**. The new studies record `task_questions_shown`; older ones only show it for automatic successes;
  - people who used I'm stuck;
  - Back presses (median and total);
  - median time;
  - finished by the app versus by the participant (plus "without the app event" for tasks that have one);
  - median ease, on a 1 to 5 scale where 5 is very easy, read from the stored difficulty.
- **Where unfinished sessions stopped:** the last scenario reached, and whether it was in the app or at its questions.
- **Why people were stuck:** the short study's fixed reasons.
- **Phone and desktop:** sessions, completion and median finished.
- **Export this study (JSON):** tasks, sessions, attempts, feedback and events, for analysis elsewhere.

### Home comparison

When a study has sessions with an assigned Home (`session_started.metadata.homeVariant`), Study health shows two extra things.

**A Home filter.** Choose Both, Today's Home or New Home. Everything below the filter narrows to the sessions that saw that Home.

**A Home comparison table.** One row per arm:

- sessions;
- completed;
- median scenarios finished;
- for the new Home, how many reached the end of Home;
- how many opened something from Home;
- how many searched from Home;
- for each scenario: finished out of reached, median time, and median ease.

Sessions from before the split appear as "Not assigned (older build)". The numbers are small, so read them as direction, not proof. Code: `compareHome` and `homeArms` in `src/research-dashboard/health.ts`, which are unit-tested.

## Later (not built)

CSV export (simple once wanted: the views already hold the rows), AI synthesis, heatmaps, replay and
screenshots are deliberately out of scope for V1.
