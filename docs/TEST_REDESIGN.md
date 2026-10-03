# `/test` redesign: a short, natural session using Art and Artist

**Goal:** `/test` should feel like a short, natural session using Art and Artist, not a research dashboard with an app inside it.

**The rule behind every decision:** the test guides the *testing process*, never *product navigation*. Every scenario gives **context and a goal**, never UI instructions.

- **Before audit:** `docs/TEST_AUDIT_BEFORE.md`.
- **Code:**
  - `src/research-data/TestMode.tsx` (participant flow);
  - `src/styles/test-mode.css`;
  - `server/research/studies.ts` (the study);
  - `src/research-dashboard/health.ts` (Study health).

## 1. Structure

| | Old (V29/V30 study) | New (`aa-individual-short-v1`) |
|---|---|---|
| Pages before the app | 4 (intro, consent, about you, Task 1 frame) | **1** (welcome with a light consent line) |
| Tasks / scenarios | 7 | **5** |
| Separate "Start task" step | 6 | **0** (desktop); a one-tap brief on phones |
| Questions asked | 26 (+6 conditional) | **12** (+2 optional "about you") |
| Required answers | 1 written answer | **3 single-tap ratings** |
| Full interruptions (app hidden or resting) | 18 | **7** (welcome, 5 short questions, final survey) |
| Clicks outside the app, minimum path | 20 + a required written answer | **13** desktop / **18** phone |
| Clicks outside the app, answering what's asked | about 36 | **13** desktop / **18** phone (+ optional notes) |
| Words shown to the participant | **1,077** | **500** (−54%) |
| Estimated completion time | about 16 min | **about 10 min** |

Measured by scripted walks of both versions along the same path (`docs/TEST_AUDIT_BEFORE.md`; the new run in `scratchpad tst/flow.cjs`). Words count everything the test shows outside the app.

The time estimate uses one model for both versions:
- reading at 200 words a minute;
- 2 seconds per click outside the app;
- 25 seconds per written answer: old, 1 required plus about 4 optional; new, about 4;
- time in the app per task.

Time in the app per task:
- old: 90, 60, 60, 45, 60, 75 and 45 s;
- new: 90, 75, 30, 75 and 60 s.

The old version comes to about 16 minutes and the new to about 10.

## 2. The session

1. **Welcome.** One page, no phone:

   > **Help us improve Art and Artist**
   >
   > Art and Artist is a professional network for people working in film and creative industries.
   >
   > It helps people showcase their work, discover other professionals and projects, and find opportunities to work together.
   >
   > You'll be given a few situations. There are no right or wrong answers. We're testing the product, not you.
   >
   > Use the app the way that feels natural. If something is confusing or you can't find what you need, that is useful feedback too.
   >
   > About 8 to 10 minutes · **[ Start ]**
   >
   > *By starting, you agree that we record how you use the app (the screens you open and what you tap) and anything you write to us. You can stop at any time.* · What we record ▸

   Consent is a single readable line under the button, with the detail one tap away in a disclosure. Pressing Start is the agreement, and the server still refuses a session without `consent: true`. There is no checkbox wall, and no consent text mixed into product instructions.

2. **Five scenarios, with the app beside them.** The phone appears once and stays mounted for the whole session.

3. **Last few questions:** four open questions, all optional, then optional craft and experience.

4. **Thank you.**

## 3. Scenarios (exact participant copy)

| # | Title | Scenario | Finishes | Asked after |
|---|---|---|---|---|
| 1 | Getting started | You've just heard about Art and Artist and want to see whether it could be useful to you. Get started and enter the app. | **By the app**, when the main app shows (`first_home_reached`) | How easy or difficult was it to get started? 1 to 5 · Anything confusing? (optional) |
| 2 | Find someone for your project | You're putting together a project in Hyderabad and need a cinematographer. Find someone you might consider working with. | **By the participant**: "I found someone" (outside the phone) | How easy or difficult was that? 1 to 5 · Anything confusing? (optional) |
| 3 | Not ready to get in touch | You're interested in this person, but you're not ready to contact them yet. What would you naturally do? | **By the participant**: "Done". Not scored | Why did you choose that? (optional text) |
| 4 | Find your next project | Imagine you're looking for your next project. Find an opportunity that feels relevant to you and show that you're interested. | **By the app**, when interest is sent (`interest_sent`) and the app's sheet has closed | How easy or difficult was that? 1 to 5 · Anything confusing? (optional) |
| 5 | Your profile | Look at your profile. If this were your real professional profile, what would you add or improve? | **By the participant**: "Done" | What would you add or change? (optional text) |

- **Scale:** 1 Very difficult to 5 Very easy, the same everywhere. It is stored as the attempt's `difficulty_rating`, inverted (`6 − ease`), so "1 = very easy" keeps one meaning across old and new data.
- **Scenario 1** opens the real Splash and first-run flow from a fresh first-time state. The test says nothing about which button to press, whether to skip, which craft to choose or how to reach Home.
- **Scenario 3** continues on the profile found in scenario 2; the app is never reset between them.
  - If scenario 2 was skipped before anyone was opened, the copy becomes: *"Imagine you've come across someone whose work interests you, but you're not ready to contact them yet. What would you naturally do?"*
  - The variant is recorded on `task_started` (`on_profile`, `seen_someone`, `nobody_yet`).
  - Whatever the participant does (Follow, Save, Message, Back, nothing) is recorded from the normal product events attached to the attempt.
- **Scenario 2** records who was on screen when the participant said they had found someone (`task_completed.metadata.personOnScreen`).
- **Wording check:** no scenario names a screen, tab, filter, button or action ("Discover", "Search", "Save", "Follow", "Message", "Home"). The automated walkthrough checks this on every run.
- **Product note, documented only:**
  - The seed data has one cinematographer in Hyderabad besides the default persona (Anvi Reddy), so scenario 2's results are thin.
  - "Opportunities for you" on Home uses the scenario's own word.

## 4. Final survey

1. What do you think Art and Artist is mainly useful for?
2. Was there anything you expected to find but couldn't?
3. What felt confusing or unnecessary?
4. If this were a real app, what would make you come back?

About you (optional): craft and experience. These are asked at the end instead of before the product, and stored on the participant row through a new, narrow `participant` action.

No future features are primed: no events, meetups, network maps, AI or new concepts.

## 5. What was removed

**Pages and steps:**
- The separate consent page and its checkbox.
- The "A little about you" page before the product.
- The Task 1 framing page.
- The six "Start task" steps.

**Questions and controls:**
- "Was this what you expected to happen?" and its follow-up.
- The required "what does Art and Artist help you do?" after Task 1, and the second first-run rating.
- The overall-ease survey rating.
- The six feedback categories.
- "Task details".

**Old tasks:**
- Understand Home.
- Find posts.
- Save a project or role.
- The version of "show interest" that named the role.
- The credits question on the profile task.

**Language:**
- "Task", "Task completed / finished", "In progress", "End test", "User Test", "prototype".
- The first name field (`?p=` codes identify moderated participants).

## 6. Continuity: one session, not app, question page, app

- The simulated phone is created once and **never remounted** between scenarios. This is checked on every run by marking the phone element and confirming it is the same one in scenarios 2 and 3.
- When a scenario ends, only the guide changes. The app stays visible and resting (`inert`, 72% opacity) while the one question is answered. Continue moves straight into the next scenario, with the app where the participant left it: no reload, no start page.
- **Wide screens:** `[ PHONE ]  [ small guide ]`. The guide sits quietly on the page background and holds progress ("2 of 5"), title, scenario, one primary action (only for scenarios the participant finishes), I'm stuck, and two quiet text actions (Give feedback, Stop the test).
- **Phones:** the app takes the screen above a 64 px bar attached to the browser viewport, which shows "2 of 5 · title", the participant's finish action where there is one, and an I'm stuck icon.
  - The bar is never inside the app and never over its controls; this is checked at 375, 390, 393 and 430 px.
  - At each scenario a sheet (also outside the phone) shows the scenario with one **Start**, then collapses to the bar.
  - Tapping the bar reopens it, for Give feedback and Stop. Escape or "Back to the app" closes it.
- **Objective scenarios never interrupt mid-action.** The guide changes only after the app's own sheet has closed and the screen has settled for 1.1 s, measured at about 2.4 s after Send interest.
- **Progress** is a quiet "2 of 5". After scenario 3, the question adds "You're over halfway there." Nothing else: no bars and no gamification.

## 7. I'm stuck

Always visible, never prominent: a secondary button in the guide, or an icon in the phone bar.

When tapped, it asks **What stopped you?** with these choices:
- I couldn't find what I was looking for
- I wasn't sure what I was supposed to do
- Something didn't work
- I lost track of where I was
- Other

Then an optional "Anything to add?", and **[ Keep trying ]** or **[ Skip this scenario ]**.

Recorded:
- **The `stuck_reported` event:** the scenario, the time spent before tapping, and the current screen.
- **A feedback row** (`source: stuck`):
  - the reason, the optional comment and the elapsed time;
  - the scenario attempt, route, screen and tab;
  - the position in the event trail, so the recent interaction context can be replayed.

The correct path is never revealed. Skipping is neutral and moves on to the next scenario.

## 8. Feedback

**Give feedback** is available in every scenario: a single text box ("What's on your mind?") with Send. Scenario, route, screen, tab, timestamp and trail position are attached automatically ("We'll know where you were in the app, so there's no need to explain").

## 9. Session recovery

| Interruption | What happens |
|---|---|
| Reload | Same scenario or question. The app comes back on the **same screen** (tab and route stack) and **as the same person**: the account created in onboarding is recreated from a test-only snapshot. |
| Same link in a new tab, or the browser restoring a discarded page | Carries on in the same session. The session and position are in `localStorage`, on `/test` only. |
| Reload during onboarding (scenario 1) | The session and scenario are kept; the product's own first-run flow starts again from its splash. Its internal step is product state and is deliberately not persisted. |
| Rotation, resize, backgrounding | No reload, so nothing is lost. Checked by rotating to landscape and back mid-question. |
| More than 24 hours later | Not resumed: a fresh session starts. The old one stays open and reads as "left without finishing". |

Each return is recorded as `session_resumed` (stage, index), so technical interruptions are measurable.

Isolation:
- Test persistence uses its own keys (`aa-test-state`, `ana-rs-*`) and is read only on `/test`.
- The normal app's state handling is unchanged.
- Elsewhere the research client still uses `sessionStorage`.

## 10. Objective versus subjective completion

- **Automatic** only where the outcome is objective: entered the app (1) and interest sent (4). There is no manual "Done" on these, so "marked complete without the action" cannot happen. If the event does not come, the participant has I'm stuck and Skip.
- **Participant-finished** where judgement is the point: found someone (2), the remember-later choice (3) and profile reflection (5). These are recorded with `success_detected = false` and `task_questions_shown.metadata.finishedBy = participant`, so the dashboard separates "finished by the app" from "finished by the participant".
- **Outcome language stays out of the participant UI.** In the data:
  - `completed`, or `completed_with_difficulty` when ease is 1 to 2 or I'm stuck was used;
  - `skipped`;
  - `abandoned` (stopped during the scenario).

## 11. Old sessions

- **A separate study.** `aa-individual-short-v1` is its own study row with its own five tasks, created idempotently by the API (`ensureShortStudy`) and in `supabase/seed.sql`. It is the newest active Individual Creative study, so new participants get it.
- **The old study and its data are not touched.** `ana-individual-creative-v29`, its tasks, sessions, attempts, events and feedback are never updated or renumbered.
- **People in the middle of the old study carry on with their own tasks and numbering** ("4 of 7 · Find posts in Discover").
  - Their session token and position are read from the older build's `sessionStorage`, and they get the lighter shell.
  - Their remaining tasks use the new short questions; there is no "expected?" question any more.
  - Old task progress is never mapped onto the new scenarios.
  - Checked by the `oldsession` test.
- **Pausing the new study** in the database makes the old study the newest active one again (a fallback, documented).
- **Version names** never reach participants. The dashboard tells the studies apart by title: "Individual Creative: short session (5 scenarios)".

## 12. Research events

| Question it answers | Event |
|---|---|
| Scenario started (with the scenario 3 variant) | `task_started` |
| Finished, by the app or the participant (drop-off at the questions versus in the app) | `task_questions_shown` (new) |
| Finished / skipped (outcome, elapsed time, person on screen) | `task_completed`, `task_skipped` |
| Stuck (with elapsed time) | `stuck_reported` |
| Feedback | `feedback_opened`, `feedback_submitted` |
| Final survey / test completed / stopped | `survey_submitted`, `session_completed` (`status: completed / abandoned`) |
| Interruptions | `session_resumed` (new) |
| Left without finishing | Derived in Study health (30 minutes without activity) |

The brief's names map onto existing events, so old and new studies share one schema:

| Brief | Event |
|---|---|
| `scenario_started` | `task_started` |
| `scenario_completed` | `task_completed` |
| `scenario_skipped` | `task_skipped` |
| `participant_stuck` | `stuck_reported` |
| `ease_rating_submitted` | the rating on the `task_completed` attempt |
| `final_survey_submitted` | `survey_submitted` |
| `test_completed` | `session_completed` |

All product navigation and action events are unchanged.

## 13. `/research` (minimum changes)

- **Study health** (new section):
  - Funnel: sessions, completed, ended early, left without finishing, in progress.
  - Completion rate, median session time and median finished per session.
  - Sessions that came back after an interruption.
  - Getting-started drop-off.
  - Per scenario: reached, finished, skipped, stopped in the app, stopped at the questions, I'm stuck, Back presses, median time, finished by the app versus the participant (and "without the app event"), median ease.
  - Where unfinished sessions stopped, why people were stuck, and phone versus desktop.
  - **Export this study (JSON).**
  - Works for old and new studies alike.
- **Labels:** the new survey questions, I'm stuck reasons, `session_resumed`, `task_questions_shown`, and the scenario 3 variant in the trail.
- **Default study:** the newest active study, so it opens on the short session.
- **Server:**
  - `dashboard/study-events`: one study's events, paged past the API's 1,000-row limit, password-protected like the rest.
  - `participant`: the optional end-of-test details, writing only this session's participant row.
- **Unchanged:**
  - The `/research` layout and the shared-password architecture.
  - No Supabase Auth.
  - `/test` stays public; its write endpoints are the same public, token-scoped ones.

## 14. QA

All checks below ran locally against the research backend (a local Supabase-equivalent stack). Results are in section 15.

- **Full participant walkthrough** (`flow`): welcome to thank you, through all five scenarios, stuck, feedback and the survey.
  - Desktop 1440×950: 37 checks.
  - Phones 375×667, 390×844, 393×852 and 430×932: 39 checks each.
  - Includes: no test UI inside the phone, no UI directions in the copy, the phone never remounted, the app on the same profile from scenario 2 to 3, automatic finishes and their timing, no exam words, and no page errors.
- **Recovery** (`resume`): reload in scenario 1, reload in scenario 2 (same screen, same person), the same link in a new tab.
- **Old sessions** (`oldsession`): a seven-task session from the older build carries on as "4 of 7".
- **Accessibility and layout** (`qa`), at the five sizes:
  - axe (WCAG 2.0, 2.1 and 2.2 A/AA) on the test UI at welcome, scenario, stuck, question, survey and thank you;
  - touch targets of at least 44 px;
  - no horizontal scroll;
  - the guide beside the phone (desktop) or the bar below it (phones), never overlapping;
  - focus moving to each new question;
  - focus returning to the bar;
  - Escape closing the sheet;
  - the app resting while answering;
  - rotation keeping the session;
  - Continue reachable at 200% zoom;
  - labelled fields;
  - reduced motion.
- **Server records checked in the database:**
  - outcomes;
  - automatic versus participant finishes;
  - ease stored as difficulty;
  - the why and add-or-change answers;
  - stuck reason with elapsed time;
  - feedback with screen;
  - survey rows;
  - the craft added at the end.

**Text scaling:** the test UI uses the app's pixel type scale (15 to 30 px; form fields 16 px so iOS doesn't zoom). Page zoom to 200% keeps everything reachable by scrolling. Like the app, it does not follow iOS Larger Text.

## 15. Results (local, before deployment)

| Suite | Result |
|---|---|
| New participant flow, desktop 1440×950 | 37/37 |
| New participant flow, phones 375×667, 390×844, 393×852, 430×932 | 39/39 each |
| Recovery (reload, new tab, same person, same screen) | 7/7 |
| Older seven-task session carrying on | 4/4 |
| Accessibility and layout, five sizes | 127/127 (axe: 0 violations in the test UI) |
| Research API e2e, old study / new study | 41/41 / 41/41 |
| Product regression: walkthroughs, smoke, launch, views, mobile, focus flow | all pass (111 walkthrough checks, launch 43/43, views 27, mobile 20, focus flow 18) |
| Edge-case suite | baseline unchanged (23 pass, 10 fail, 4 without a model) |
| Typecheck (app and server), production build | clean |

The real-participant numbers for the BEFORE audit come from **Study health** in `/research` (`docs/TEST_AUDIT_BEFORE.md`, section 0).
