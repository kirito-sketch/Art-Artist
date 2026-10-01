# Research Dashboard (`/research`)

> **Product name: Art and Artist.** Legacy/internal codename: Ana. The codename survives only in
> technical identifiers (for example storage keys, the `ana_research` local database name, the
> `ANA_PROTOTYPE_VERSION` constant and some file names). It never appears in visible UI.

A researcher-only view of usability-test data. Desktop-first, in Art and Artist's paper and type. It shows the
raw research data clearly and correctly. There are no AI summaries, heatmaps, replay, screenshots or
export.

- **URL:** `https://<deployment>/research` (on a static preview, `?dashboard`). Separate from the
  existing `?research` Research Mode.
- **Code:** `src/research-dashboard/` (`Dashboard.tsx`, `data.ts`, `labels.ts`, `dashboard.css`). It
  is a lazily loaded chunk, so neither its code nor the Supabase browser client ship to the prototype
  or to participants.

## Researcher permissions

- **Sign-in:** Supabase Auth, email and password.
- **Reads:** the browser uses the public anon/publishable key plus the researcher's Supabase Auth
  session. Row Level Security decides everything:
  - users in `research_researchers` can read all research tables and update only `status` and
    `researcher_note` on feedback;
  - anyone else gets zero rows;
  - the anon key alone gets "permission denied".
- **Gate:** after sign-in the app calls `research_is_researcher()`. A signed-in non-researcher sees
  "No access". That screen is a courtesy only; even a hand-made request with their token returns
  nothing (verified: `200 []` for reads, and an update that changed no rows).
- **No server key:** the dashboard never uses the service key. The hidden route is not the protection;
  RLS is.

**Adding a researcher (once):**
1. Supabase → Authentication → Users → Add user: email and password, with auto-confirm on.
2. SQL Editor:
   ```sql
   insert into research_researchers (user_id, note)
   select id, 'researcher' from auth.users where email = 'you@example.com';
   ```

Needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the deployment (already set in Vercel). The
anon/publishable key is public by design and appears in the dashboard chunk only.

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
| Feedback items | Participant feedback, excluding survey answers |

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

## Later (not built)

CSV export (simple once wanted: the views already hold the rows), AI synthesis, heatmaps, replay and
screenshots are deliberately out of scope for V1.
