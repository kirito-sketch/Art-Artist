# Handoff prompt: production house screens and flows in the District version

Copy everything below the line into the new assistant.

---

You are continuing work on **Art and Artist ("Ana")**, a professional network for Indian film and art talent. It is a React 18 + Vite + TypeScript PWA prototype in the GitHub repo `kirito-sketch/Art-Artist`, branch `claude/ana-product-strategy-in22y2`. Vercel deploys that branch automatically. Work only on that branch.

## Your task

The app has two versions of Home and Discover, chosen by a feature switch:

- **Current** (`?home=current`, the default): the old version. **Do not change it.**
- **District** (`?home=district`): the new version that stakeholders are moving to.

Everything for an **individual** in the District version has been redesigned: Home, Discover, Spotlight, profile and onboarding. But when someone **acts for a production house** (the "acting" identity: `store.acting !== 'self'`), the app still shows the old house screens in both versions. **Your job is to bring the production house screens and flows into the District version**, so a house user gets the same design language, structure and quality as an individual in District. Change them **only when `features.home === 'district'`**. The current version's house screens must stay exactly as they are.

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

## What the District individual experience established (match it for houses)

- **Home structure:** location header over a static top glow (`.dh-top-amb`), then tiles, then a Spotlight carousel, then a completion prompt when one is due, then one **intent shelf**, then shelves that each do a different job, then an end ("You're up to date." plus chips). Nothing appears twice on the page: anything in the Spotlight is removed from the shelves below.
- **Spotlight:** at most 5 cards, mixed kinds, at most 2 of a kind, one per organiser, one label per card. Fixed for the session; recalculated daily or after save, follow or block. The rules are a pure, tested domain function.
- **Card anatomy:** a big 4:5 image with **one** label on it (what it is and why it's here, e.g. "Crew forming · needs a DoP"), then the title, one meta line, then one fact under a hairline (the thing that helps you decide). Text is single-line with ellipsis. Save sits top right.
- **Compact rows** (intent shelf): 64 px image, title, meta, then the deciding fact (closing date first), with Save on the right.
- **Discover:** search with Saved beside it, then one chip row (Posts · People · Opportunities · Projects · Events · Reviews), Posts by default. Tiles and every "See all" on Home open Discover on a chip; there are no separate category pages. Search on Posts covers everything; on other chips it is scoped, with a first row "Search all of Art and Artist for '…'". The query carries over between chips; filters are kept per chip; switching chips adds no Back step.
- **Visual system:** app tokens only (they follow light and dark), the District section header size (20 px), the Available marker on people photos, LivingBackground "cinematic" ambient, theme options Light / Dark / System.
- **Taxonomy** (`src/data/taxonomy.ts`): domain → family → craft, with neighbouring families. Use it for any craft grouping or labels; don't hard-code craft lists.

## What to design and build for houses (District only)

Do the plan doc first, then build. At minimum:

1. **House Home in District.** Replace SlateHome for District with a District-structured Home. Keep the house identity switcher and New project.
   - The jobs, in priority order:
     - what needs the house now: interest received on open roles, credits waiting or sent back for correction, amendments, roles closing soon, unverified house state
     - the house's live projects, with the lead project's artwork as the hero
     - open roles and their interest counts
     - people to consider for the house's open roles (department first, then neighbouring departments, from the taxonomy; Available marker)
     - the house's events
     - its released films and their reviews
   - Use the same shelf shapes and card anatomy as the individual's District Home: a Spotlight or lead slate, an intent-like "Needs you" shelf of compact rows, and grids or rails.
   - Cold start (no projects yet): content first, then starting a project as the next step.
   - Pending verification: a quiet card, not a wall.
2. **Discover while acting for a house.** Use the District Discover with chips for houses too. Default to the chip that serves hiring (People), and scope People results to the house's open roles where sensible. The same search rules as individuals.
3. **House Profile tab and public house page** (`OrgScreen`). Bring them to the District look: hero artwork, slate, open roles, events, people credited, reviews of released films. Visitors and house members see different actions.
4. **Project workspace** (`HouseProjectScreen`) and **public project page** (`WorkScreen`). Same card and section language; operational signals sit on the project they belong to.
5. **Flows, restyled in the District look and checked end to end:**
   - New project, share/announce, project details
   - Add role, edit role, close role or mark filled
   - Review interest: shortlist, message, decline. No fake hired or rejected status.
   - Add person, issue credit, revise credit after a correction
   - Association screen
   - Publish event (free only)
   - House setup and verification
   - Switching identity between self and a house

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
