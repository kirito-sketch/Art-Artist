# Handoff prompt: production house screens and flows in the District version

Copy everything below the line into the new assistant.

---

You are continuing work on **Art and Artist ("Ana")**, a professional network for Indian film and art talent. It is a React 18 + Vite + TypeScript PWA prototype in the GitHub repo `kirito-sketch/Art-Artist`, branch `claude/ana-product-strategy-in22y2`. Vercel deploys that branch automatically. Work only on that branch.

## Your task

The app has two versions of Home and Discover, chosen by a feature switch:

- **Current** (`?home=current`, the default): the old version. **Do not change it.**
- **District** (`?home=district`): the new version that stakeholders are moving to.

Everything for an **individual** in the District version has been redesigned: Home, Discover, Spotlight, profile and onboarding. But when someone **acts for a production house** (the "acting" identity: `store.acting !== 'self'`), the app still shows the old house screens in both versions. **Your job is to bring the production house screens and flows into the District version**, so a house user gets the same design language and quality as an individual in District, with screens built around what a house needs (see "Houses are not individuals" below). Change them **only when `features.home === 'district'`**. The current version's house screens must stay exactly as they are.

Before writing code, read the repo docs listed below. Then write a short plan in `docs/DISTRICT_HOUSE.md` (problems, proposed screen by screen, what stays) and implement it.

## How to run and check

- `npm install`, then `npx vite --port 5173`.
- Personas by URL: `/?view=app&home=district&as=konark` (Aditi acting for Konark Pictures, a verified house in Hyderabad) and `as=tidewater` (Kochi). Individuals: `as=kiran` (cinematographer, Hyderabad) and `as=tara` (actor, Mumbai). Compare both versions side by side at `/studio/compare`.
- Unit tests: `npm run -s test:unit`. These are node:test files bundled with esbuild, named `src/**/*.test.ts`. Keep rules in pure domain functions with tests, like `src/domain/spotlight.ts` and `src/domain/eventRank.ts`.
- Typecheck: `npx tsc --noEmit -p .`. Build: `npx vite build`.
- Edge-case suite: `npm run -s test:edge`. The baseline is **23 pass, 10 fail** (pre-existing). After running it, revert `docs/EDGE_CASE_MATRIX.md` and `src/qa/last-run.json` (`git checkout` them).
- Check every screen in light and dark, at 390 px wide (phone), with no horizontal page scroll.

## Where things are

- `src/App.tsx`: tab rendering. Today:
  - Home: `store.acting !== 'self' ? <ProductionHome /> : features.home === 'district' ? <DistrictHome go={{ discover: openDistrict }} /> : ...`
  - Discover: the District variant (`<DiscoverScreen variant="district" scope={districtChip} ...>`) is used only when `acting === 'self'`. Houses get the old Discover.
  - Profile tab when acting: `<OrgScreen id={store.acting} isTab />`.
- `src/ui/features.ts`: `useFeatures().home` is `'current' | 'next' | 'district'`.
- House screens, all old today:
  - `src/screens/production/Production.tsx`: `ProductionHome` → `SlateHome`, with sections LeadProject, Around your work, Open roles, Our slate, People you could work with / For roles you haven't opened, Happening on Art and Artist, and an EmptyHouse cold start.
  - `src/screens/production/Create.tsx`: `NewProjectForm`, `PickProject`, `HouseProjectScreen` (route `hproject`), ShareProject, ProjectDetails, AddRole, AddPerson, CreditForm, IssueCredit, ReviseCredit, PersonActions, `AssociationScreen` (route `association`), RoleDisclosure.
  - `src/screens/production/HouseSetup.tsx`: house setup and verification.
  - `src/screens/org/OrgScreen.tsx` (house page and the house's Profile tab) and `src/screens/org/WorkScreen.tsx` (public project page).
  - `src/screens/sheets/Sheets.tsx`: sheets including `reviewInterest`, `editRole`, `closeRole`, `newProject`, `pickProject`, `identity` (switch who you act as), `notifications`.
  - `src/screens/event/EventComposer.tsx`: houses publish events (Events V1: free only, optional registration link, cover image).
  - `src/screens/inbox/InboxScreen.tsx`: messaging, including interest threads.
- State and rules: `src/state/store.tsx` (routes, actions, `acting`, `interestsReceived`, `roleStatus`), `src/state/world.ts` (projects, roles, associations, credits, amendments), `src/domain/actions.ts`, `src/domain/discovery.ts`.
- District references to copy patterns from:
  - `src/screens/home/DistrictHome.tsx`, `src/screens/home/districtFeed.ts`, `src/domain/spotlight.ts` (+ test), `src/domain/contentTypes.ts`, `src/data/taxonomy.ts`.
  - `src/screens/discover/DiscoverScreen.tsx` (variant `district`).
  - `src/styles/district.css`.
  - Shared `SectionHeader` in `src/ui/primitives.tsx` (title left; a visible "See all" right, only when there is more).
- Docs to read first: `docs/DISTRICT.md`, `docs/DISTRICT_FIXES.md`, `docs/REVIEW_HOME_DISCOVER.md`, `docs/REVIEW_EVENTS_PROFILE.md`, `docs/PRODUCTION_HOUSE_EXPLORATION.md`, `docs/CREATION_FLOWS.md`, `docs/CONSOLIDATION.md`, `docs/PERSONA_BRIDGES.md`, `docs/EVENTS.md`, `docs/REVIEWS.md`, `docs/CTA_SYSTEM.md`, `docs/SAVE_MODEL.md`, `docs/THEME.md`, `docs/ACCESSIBILITY_AUDIT.md`.

## Houses are not individuals: design for their jobs

A production house uses Ana for different reasons than a person does, so its District Home, Discover and other screens should be **different in content and structure**, while sharing the District **visual language** (tokens, card anatomy, section headers, motion rules, light and dark). Do not copy the individual's Home shelf for shelf. Start from what a house needs:

| A house needs to | What that means on screen |
| --- | --- |
| Run its hiring | Each open role with its interest count, new interest since last visit, people shortlisted, roles closing soon, roles with no interest yet |
| Keep its records right | Credits waiting for acceptance, credits sent back for correction, amendments, people added privately who have no credit yet |
| Run its projects | Live projects by stage, which are announced and which are not, what each still needs (roles, crew, artwork, release date) |
| Find people | People who fit an open role (craft, related crafts from the taxonomy, city, availability, verified credits), not a general social feed |
| Be seen | Its public page, announced projects, events it hosts, reviews of its released films |
| Manage itself | Verification state, who can act for the house (house permissions are a frozen rule), switching identity |

Things that are wrong for a house and should not be on its Home: "Opportunities for you", "New work" from people it follows as a social feed, a Spotlight of other houses' roles, "People near you" as a generic grid, or the individual's completion prompt.

A likely District House Home, to confirm in your plan:

1. Header: house avatar and name (tap to switch identity), notifications, New project. Same static top glow.
2. **Needs you**: one compact list of what needs a decision now, most urgent first, across all projects. Hidden when empty. Use a pure, tested ranking function (`src/domain/houseQueue.ts` or similar).
3. **Your projects**: the lead live project as a big hero card (artwork, stage label, one line of what is happening), then the other projects as a rail.
4. **Open roles**: compact rows with interest count and closing date, See all.
5. **People for your roles**: matched to the house's open roles, with the Available marker and the role each person fits.
6. **Your events** and **Your released films** (score and review count), each only when there is something to show.
7. End.

Cold start (no projects yet): what a house can do first (set up the page, start a project, people worth knowing in its city), with no empty walls. Pending verification: a quiet card that says what is limited until it is verified.

Discover while acting for a house: the same chip row, defaulting to **People**, with role-aware filters (for one of our open roles, available now, verified credits). Opportunities shows other houses' roles only as context, never as something to apply to.

## What the District individual experience established (the visual language to reuse)

- **Card anatomy:** a big 4:5 image with **one** label on it, then the title, one meta line, then one fact under a hairline (the thing that helps you decide). Text is single-line with ellipsis. Save or the main action sits top right.
- **Compact rows:** 64 px image, title, meta, then the deciding fact (urgency first), with one action on the right.
- **Page rules:** shelves each do a different job, nothing appears twice on a page, shelves hide when there is too little to show, an end instead of an endless feed.
- **Discover:** search with Saved beside it, one chip row, scoped search with a "Search all" row, query carried across chips, filters kept per chip, chip switching adds no Back step, Home's "See all" opens Discover on a chip.
- **Visual system:** app tokens only (they follow light and dark), District section header size (20 px), the Available marker on people photos, the static top glow, LivingBackground "cinematic" ambient.
- **Taxonomy** (`src/data/taxonomy.ts`): domain → family → craft with neighbouring families. Use it for any craft grouping or matching; don't hard-code craft lists.
- References: `src/screens/home/DistrictHome.tsx`, `src/screens/home/districtFeed.ts`, `src/domain/spotlight.ts` (+ test), `src/domain/contentTypes.ts`, `src/screens/discover/DiscoverScreen.tsx` (variant `district`), `src/styles/district.css`.

## What to build (District only)

Write the plan in `docs/DISTRICT_HOUSE.md` first: each house job, the screen that serves it, what changes from today, and what stays. Then build:

1. **House Home** for District, designed from the jobs above.
2. **Discover while acting for a house**, as above.
3. **House Profile tab and public house page** (`OrgScreen`): hero artwork, announced slate, open roles, events, people credited, reviews of released films. Members see management actions; visitors see follow, roles and work.
4. **Project workspace** (`HouseProjectScreen`) and **public project page** (`WorkScreen`): the project's needs on the project itself (roles, interest, crew, credits, announcement, release).
5. **Every house flow, restyled and checked end to end:** new project; share or announce; project details; add, edit, close or mark a role filled; review interest (shortlist, message, decline, with no fake hired or rejected status); add person; issue credit; revise credit after a correction; association screen; publish event (free only); house setup and verification; switching identity.

Where a flow's logic is already correct, restyle it; do not rewrite it.

## Rules you must keep

- **The current version does not change.** Gate every District house change on `features.home === 'district'`. Shared domain changes must give identical results for the current version.
- **The /test research study does not change.** Code paths under `TEST_MODE` (from `src/research-data/surface`) keep their existing behaviour.
- **Frozen product rules.** Do not change these; if an implementation would conflict, keep the rule and write the conflict down in the doc:
  - credits are issued only by productions
  - house permissions
  - collaboration Interest
  - messaging
  - the role lifecycle
  - credit acceptance and dispute
- **Stakeholder principles:**
  - no paid access to opportunities
  - children are never independently discoverable (use `searchablePeople`, never raw `seed.people`, for anything people browse)
  - no fake hired or rejected status
  - talent data is never sold
  - reports escalate
  - the core professional workflow comes first
  - **no explanatory copy in the app** (no "this section shows…" text)
- **Security:**
  - Never commit secrets.
  - The Supabase service-role key must never reach the browser.
  - `APP_ACCESS_PASSWORD` is server-side only.
  - `/test` stays public; the app, `/research`, `/studio` and `/studio/compare` stay behind the shared password.
  - Do not bring back Supabase Auth.
- **Accessibility:**
  - 44 px minimum tap targets (`src/styles/a11y.css` already extends chips and links)
  - every control has a name
  - one operable layer at a time (the inert tab layers in `App.tsx`)
  - Reduce Motion and Save-Data respected (see `motionOk()` in `DistrictHome.tsx`)
- **Writing:**
  - no em dashes anywhere (code comments, UI text, docs, commit messages)
  - plain, short UI words
  - match the comment density and naming of the surrounding code
  - no AI model names in commits or files

## Done means

- `docs/DISTRICT_HOUSE.md` written: plan, what was built, conflicts.
- `docs/DISTRICT.md` updated with a "Production house" section.
- In District, every house screen and flow above is on the new design, in light and dark, at 390 px, with no console errors. `/studio/compare` shows the old house screens on the Current side and the new ones on the New side.
- Tests green:
  - `npm run -s test:unit` with 0 failures
  - `npx tsc --noEmit -p .` clean
  - `npx vite build` passes
  - `test:edge` at baseline (23 / 10)
- New ranking or selection rules are pure functions with unit tests.
- Committed with clear messages and pushed to `claude/ana-product-strategy-in22y2` (`git push -u origin claude/ana-product-strategy-in22y2`). Do not open a pull request unless asked.
