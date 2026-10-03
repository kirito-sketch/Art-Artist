# `/test` audit: BEFORE the redesign

Audit of the participant test as it was in production before the five-scenario redesign (study
`ana-individual-creative-v29`, build V30). Evidence comes from three sources. Each finding below names which:

- **[measured]** a scripted walk through the real `/test` against the local research backend, capturing every research screen (word counts, controls, screenshots);
- **[reproduced]** behaviour reproduced in a browser;
- **[code]** read directly from `src/research-data/TestMode.tsx`, `src/research-data/client.ts`, `server/research/*`.

## 0. Real participant data: what could and could not be read

The production research database could not be queried from the build environment:
- the dashboard API needs the shared access password, which is deliberately not available to the build;
- the service-role key is server-only.

The local research database holds only automated test runs (198 synthetic sessions), so it is not evidence and is not reported as such.

To make the real numbers readable, `/research` now has a **Study health** section (still behind the shared password). For any study, old or new, it computes:
- the session funnel: started, completed, ended early, left without finishing, still in progress;
- completion rate, median session duration and median scenarios completed;
- drop-off after each task and during each task's questions;
- I'm stuck, skips and Back presses per task;
- median task duration;
- self-reported versus automatic completion;
- phone versus desktop;
- abandonment during the first-run task.

It also offers an **Export** of the study's raw data as JSON. The numbers in sections 1 to 3 below are for this view to fill in. Nothing in them is estimated.

**Known data gap [code].** A participant who simply closes the tab never ends their session, so it stays `active` forever. Only "End test" produced `abandoned`. The old data therefore under-reports abandonment and mixes "in progress" with "left". Study health derives **left without finishing** from 30 minutes of inactivity.

## 1. Session funnel (read from Study health)

Total sessions, completed, ended early, left without finishing, in progress, completion rate, median duration, median completed tasks.

## 2. Drop-off by task (read from Study health)

Drop-off after each task, drop-off during the task questions, I'm stuck, skips, Back presses, long tasks, phone versus desktop.

## 3. Problems the structure guarantees

Whatever the numbers turn out to be, these come straight from the design.

### Old structure [measured]

| Step | Screens | Participant words | Notes |
|---|---|---|---|
| Product intro | 1 | 80 | Own page, no phone |
| Consent | 1 | 77 | Own page; checkbox plus button |
| About you | 1 | 58 | Own page, before the product is ever seen |
| Task 1 intro | 1 | 50 | Own page, "Open Art and Artist" |
| Tasks 1 to 7: intro, active, questions | 20 | 756 | Each later task has a separate "Start task" step with the phone inert |
| Final survey | 1 | 56 | Own page |
| **Total** | **25 research screens** | **1,077 words** | |

**Seven tasks:**
1. Getting started.
2. Understand Home: *"Take a minute on the Home screen…"*
3. Find someone in your craft.
4. Find posts in Discover.
5. Save a project or role.
6. Find a role and show interest: *"Find a Director of Photography opportunity…"*
7. Understand your profile: *"Which projects are you credited on, and is anything waiting for you?"*

**Questions asked: 26.**
- After Task 1: 4 questions, one of them required free text that blocks Continue.
- After each of Tasks 2 to 7: 3 questions (difficulty, "Was this what you expected?", "Anything confusing?"), plus a follow-up whenever the answer is No.
- Final survey: 4 questions.

**Full interruptions** (product hidden or not operable): **18**.
- 4 pages before the product: intro, consent, about you, Task 1 frame.
- 6 "Start task" steps.
- 7 question screens.
- The survey.

**Required clicks outside the product, at minimum:** 20, plus one required written answer. Answering what is asked raises this to about 45.

### Findings

| # | Finding | Evidence |
|---|---|---|
| F1 | **Task text gives UI directions.** "Find posts **in Discover**" (a title), "Take a minute **on the Home screen**", "**Open your profile**", "Find a role and **show interest**", "**open their profile**". These tell participants where things are, which invalidates findability results. | [measured] |
| F2 | **Automatic success fires too early and interrupts exploration.** Task 3 succeeds on the first `person_profile_opened` (any profile, even one opened by accident from Home). Task 4 succeeds on the first post opened. Task 7 succeeds the moment the profile tab opens (`own_profile_viewed`), so the question screen replaces the product 1.1 s after the participant arrives, before they can answer "which projects are you credited on". | [code] |
| F3 | **The rhythm is choppy:** app, question page, start page, app. Every task adds a "Start task" step with the phone dimmed and inert, and a three-question form after it. | [measured] |
| F4 | **Exam language.** "Task completed", "Task finished", "Task 3 of 7 · In progress", "Start task", "End test". | [measured] |
| F5 | **Three pages before the product, and the participant has still not seen it.** About you comes before the app. | [measured] |
| F6 | **A reload during onboarding restarts it.** Reloading on the second introduction screen returned to the first. | [reproduced] |
| F7 | **A reload mid-task resets the app to Home.** The participant was on Discover and came back on Home; the product route is lost. | [reproduced] |
| F8 | **The same link in a new tab starts a brand-new session.** The test state lives in `sessionStorage`, which is per tab. The first session stays open for ever. | [reproduced] |
| F9 | **Closing the tab is never recorded as abandonment** (see section 0). | [code] |
| F10 | **Inconsistent rating scales.** Task questions run 1 very easy to 5 very difficult. The first-run and survey ratings run 1 very difficult to 5 very easy. | [code] |
| F11 | **Required free text after Task 1** ("what do you think Art and Artist helps you do?"), before the participant has used the product. | [code] |
| F12 | **The task list was renumbered inside the same study.** Adding "Getting started" moved existing tasks from 1–6 to 2–7, so historical sessions now show shifted task numbers. | [code] (`server/research/studies.ts`) |
| F13 | **The mobile question sheet covers about 60% of the phone,** with 9 controls on every task. | [measured] |
| F14 | **Research jargon visible to participants:** "prototype", "User Test", "Task details", "In progress". | [measured] |
| F15 | **Stuck asks "What are you trying to do?"** in free text, with no quick choices. | [code] |
| F16 | **Feedback requires choosing from six categories** before writing. | [code] |

### Product problems found during the audit (documented, not fixed here)

- **P1.** The seed data has only one cinematographer in Hyderabad besides the default persona (Anvi Reddy). "Find a cinematographer in Hyderabad" has a thin result set. Camera crew (Sana, Raghu, Nikhil, Omar) may also be chosen.
- **P2.** The Home section title "Opportunities for you" uses the same word as the scenario ("find an opportunity"). That may make the scenario easier than real life, though it is the product's own language.

Screens captured for this audit: `docs/research/test-audit/before/` (desktop and mobile).
