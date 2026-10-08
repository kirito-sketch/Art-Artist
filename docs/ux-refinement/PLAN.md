# Art & Artist: UX refinement plan (source of truth)

Resume here. Read this file, then only the files listed for the active stage. The repository is the source of truth;
the reference pack (District, IMDb, Reddit, current-app captures) shows observed problems, not code behaviour.

- Branch: `claude/ana-product-strategy-in22y2`. GitHub has no `main`; this branch is the repository default and what Vercel deploys.
- Baseline screenshots (dark, 393 × 852, before Stage 1): `docs/ux-refinement/baseline/01–10`.
- Reference pack: `Art_Artist_Claude_UX_Reference_Pack.zip` (user upload; not committed). Its key frames are described in section 3.

## 1. Goals and constraints

- **Goal.** A coordinated refinement of hierarchy, media presentation and consistency across Ana, so it reads as one product: a professional and social network for film. District for section hierarchy and cinematic detail pages, IMDb for poster credits, Reddit for action rows under media. These are references, not designs to copy.
- **Consistency comes from shared rules, not identical cards.** Each content type keeps its own layout: credit (poster), person (identity, work, credibility), event (artwork, date, venue, attendance), project (trailer, cast, crew, production), opportunity (role, requirements, response).
- **Keep:**
  - the green brand action colour (`--action`, #275C50)
  - light and dark parity
  - the existing tokens and components
- **Glass is selective.**
  - Use it only for floating controls over content.
  - Never on primary CTAs where it weakens them.
  - No nested glass, no heavy shadows, no decorative effects.
- **Media.**
  - No universal aspect ratio; layouts are specific to each media type.
  - No stretching.
  - Fallbacks for missing media.
  - No generated or replaced images.
- **Don't:**
  - sticky District-style section navigation
  - booking or ticket UI
  - new backend without approval
  - rebuild the app
  - refactor unrelated working code
  - reintroduce archived Home designs
- **Working rules.**
  - One stage per session; stop at each stage boundary for review.
  - Targeted tests while building; full regression only for shared-component changes and in Stage 5.
  - Unrelated problems go to the backlog (section 10).

## 2. Product rules that must not change

- **Identity switching:** Individual / Production House (`acting`), and house permissions (admin and editor membership).
- **Credits:**
  - issued only by productions (houses or authorised production users)
  - individuals accept or dispute; they never self-create or claim
  - only accepted, public credits show as verified
  - independent work stays separate (`domain/actions.ts`, `state/world.ts`)
- **Follow, messaging and Interest:**
  - Follow and messaging behaviour stay as they are
  - the Collaboration Interest model stays as it is
  - no paid access
- **Projects:**
  - project visibility (`shared`)
  - hidden working titles (`workingTitle`)
  - private project information
  - drafts
- **Children** are never discoverable.
- **Deep links:** existing navigation and deep links (`?post=`, `?profile=`, Studio links) keep working.
- **Approved and live** (preserve):
  - glass bottom nav with a measured lens (docs/NAV_AND_POST_NOTCH.md)
  - the new Home: District tiles, the This week auto carousel, the new order (docs/HOME_SPOTLIGHT.md)
  - the automatic device frame on desktop and full-screen on phones (src/dev/viewMode.tsx)
  - the post notch (Option A); see decision D1, Stage 1 proposes replacing it

## 3. Reference insights

| Reference | Take | Don't take |
|---|---|---|
| District, section hierarchy (video) | Each section has its own identity:<br>• a title row<br>• its own card shape and density<br>• clear spacing between bands<br>• compact tiles so featured content leads<br>• a rhythm of large and small | Sticky section navigation, booking UI |
| District, movie detail (video) | Trailer first:<br>• the trailer fills the top and plays muted inline<br>• mute and fullscreen controls<br>• language chips for trailer versions<br>• then title and identity, synopsis, cast and crew rails, information groups | Ticket booking, offers |
| IMDb poster cards | 2:3 theatrical posters in a horizontal rail, about 2.4 visible. Below each: title, year, one line of metadata | Ratings, the yellow accent, watchlist and bookmark overlays |
| Reddit post actions | Actions in a row under the media: small rounded groups with an icon and a count, a clear active state, comfortable targets, a split left/right grouping | Up/down voting, Join, ads |
| Current: Discover nav | The selected lens on Discover overlaps the Home label and doesn't sit centred under icon and label | |
| Current: event detail | "Ana · Events" placeholder art instead of the event's art. The title sits alone. A bordered three-row box with venue wrapping and a separate city column | |
| Current: own and visitor profile | Edit profile, and Follow with Message, are inside an extra glass frame. Follow isn't solid green | |
| Current: Selected work | About seven tall full-width tiles in a vertical column, about 1,500 px. Credits use landscape cards | |

## 4. Architecture inventory (Stage 0 audit)

**Styles.** 26 CSS layers (~11,500 lines), in import order: `src/main.tsx`.

- **Tokens:**
  - `styles/tokens.css`, plus `theme-dark.css` and the token corrections in `a11y.css`
  - glass tokens and the CTA family in `styles/glass.css`: `.cta` with `--solid`, `--glass`, `--quiet`, `--s`, and `.cta-icon`
- **Overrides** are spread over `components → screens → expression → refine → district* → profile-immersive → post-media → media-system → glass → post-notch → home-next`. Later files override earlier ones; this layering is the main source of inconsistency, so fix things at the token or shared-component level.
- **Primitives:** `ui/primitives.tsx`:
  - Button, IconButton, Pressable, PressCard
  - Photo (media policy), Avatar, PersonPhoto
  - SectionHeader (shared title plus See all), Verified

**Navigation.** `nav/TabBar.tsx` and `TabIcon.tsx`.

- The lens is one element per bar, placed from `offsetLeft`.
- The selected state is in `refine.css`; the glass overrides are in `glass.css` (`[data-nav='glass']`).
- The lens is `tab width + 4px`. That over-wide lens is the likely overlap in the Discover capture; to be verified on a real device in Stage 1.

**Home.**

- Individual: `screens/home/DistrictHome.tsx`, `WeekSpotlight.tsx` (carousel), `districtFeed.ts` (Spotlight and This week cards), `domain/spotlight.ts` (rules and tests), `NetworkActivity.tsx`.
- House: `screens/production/DistrictHouse.tsx` (workspace).
- Legacy Home (HomeScreen, HomeNext) is still in the tree; see the backlog.

**Discover.** `screens/discover/DiscoverScreen.tsx`, `PostGrid.tsx`, `PostStream.tsx`.

- Bento: `ui/bento.ts` (`bentoLayout(n)`) and `domain/bentoLayout.ts` (`bentoGroups`, tested).

**Posts.**

- `screens/home/PostCard.tsx` (one card everywhere).
- `PostActions.tsx`, one component with the variants `pill` (frosted, on media), `notch` (current default) and `viewer`.
- `FeedVideo.tsx` (feed watch mode), `PostVideoViewer.tsx` (fullscreen with scrubber).
- `domain/postActionPlacement.ts` (focal-aware pill placement).
- CSS: `post-media.css`, `post-notch.css`.

**Studio.** `studio/Studio.tsx` (links and archive screenshots) and `Compare.tsx` (iframes). There is no in-app variant switcher; variants are URL flags (`ui/preview.ts`, `ui/designDirection.ts`).

**Profiles.**

- **Individual:** `screens/profile/ProfileScreen.tsx` (595 lines):
  - hero: `HeroDirections.tsx`, `profile-immersive.css`
  - Selected work: `domain/workRows.ts` (pairs of portraits, full-width landscapes)
  - `ProfileCredits.tsx`: `ProfileCreditCard`, `creditCardRatio`, landscape or 4:5
  - `Showreel.tsx`, `WorkPortfolio.tsx`, `EditProfile.tsx`
- **House:** `screens/org/OrgScreen.tsx` with `district-house.css`.

**Projects.**

- Detail: `screens/org/WorkScreen.tsx` (public project, still-led hero).
- House project management: `HouseProjectScreen` in `screens/production/Create.tsx`.
- Data: `data/works.ts`, a `Work` with title, year, format, stage, orgIds, logline, media, stills, credits, releaseDate. The project record adds `workingTitle` and `shared`.
- There is **no trailer field**.

**Events.**

- `screens/event/EventScreen.tsx`, `eventUnits.tsx`, `EventAttendance.tsx` (request and approval states), `EventComposer.tsx`.
- Art: `state/eventArt.ts`, used by Home only.

**Other details.** `screens/opportunity/OpportunityScreen.tsx`, `screens/reviews/*`, `CollabComposer`, the media viewer (`App.tsx` MediaViewer).

## 5. Media feasibility (for Stage 4)

**Storage.**

- There is no media storage backend. Bundled media are static files in `public/`:
  - `images/covers/*`: 12 landscape stills, about 500 × 245, 2:1
  - `images/people/*`: 4:5 portraits
  - `video/*`: six clips, MP4 and WebM, 400 × 500 (4:5), 6 seconds each
- User uploads are session-only `blob:` URLs (`ui/imagePreview.ts`, `ui/showreelPreview.ts`), with:
  - size limits of 25 MB per image and 200 MB per video
  - metadata validation (`videoMetadataError`)
  - poster-frame extraction through a canvas
- Supabase is used only for the research study.

**Players.**

- Native `<video>`: FeedVideo, PostVideoViewer (custom scrubber, ±10, Fullscreen API, keyboard), the media viewer, Showreel (native).
- `Showreel.tsx` also plays YouTube and Vimeo embeds (iframe `allowFullScreen`).
- Fullscreen already exists (PostVideoViewer and iframes).

**Data model.**

- A `Reel` (source native or embed, url, cover, duration, status draft) can represent a trailer.
- Proposal: `Work.trailers?: { id, language, kind: 'trailer' | 'teaser', reel: Reel }[]`. This handles multiple languages with no new player.

**Limits and blockers.**

- **B1:** no landscape trailer footage exists. The only clips are six 4:5 test clips, so a District-style 16:9 trailer can only be demonstrated by framing an existing clip or with a YouTube embed URL.
- **B2:** uploads can't persist without storage, so they stay session-only like posts unless a storage backend is approved.
- **B3:** no 2:3 poster files exist. `posters/*` entries fall back to 2:1 covers.
- Autoplay must be muted. iOS needs `playsInline`. Embeds need `mute=1&autoplay=1`.

## 6. Shared components and owners

| Component | Owner stage | Reused by |
|---|---|---|
| Tokens: type scale, spacing, radii, button heights | 1 | all |
| `Button` / `.cta` (solid green primary, outlined secondary, neutral) | 1 | profile CTAs (2), event and opportunity CTAs (3), project (4) |
| `SectionHeader` and a section band rule (spacing and separators per section type) | 1 | 2, 3, 4, 5 |
| TabBar lens | 1 | all |
| `PostActions` row variant, under media (keeps pill and notch for Studio) | 1 | PostCard (Home, Discover, Profile, Project) |
| `FeedVideo` controls when actions sit under media | 1 | PostCard |
| `Photo` surfaces: add `poster` (2:3) | 2 | credits (2), project media (4) |
| `CreditPosterCard` and `CreditRail` (replacing `ProfileCreditCard`) | 2 | profile (2), project cast and crew (4), house profile |
| Selected work bento: deterministic preview for 0–5+ items, built on `domain/bentoLayout.ts` | 2 | profile; house "Made by us" if useful |
| Detail info group (label and value rows without boxes; one CTA zone) | 3 | event, opportunity, review, house, project |
| `eventArt` in Event detail | 3 | Home (already) |
| `TrailerPlayer`: inline muted autoplay, mute, fullscreen, language chips, built on FeedVideo/PostVideoViewer and Reel | 4 | project detail |

## 7. Stages, scope, dependencies and acceptance

**Stage 0. Audit and plan.** Done. This file and the baseline screenshots.

**Stage 1. Foundations, navigation, post actions.** Depends on D1, D2 and D3.

Scope:

- Normalise tokens: type scale, spacing, radii, 48/52/56 button heights, icon sizes.
- One primary and one secondary button treatment.
- Section band rule.
- Fix the lens geometry at the shared component level (not a patch for Discover alone): lens width equal to the item, centred under icon and label, at every width. Test Home, Discover, Create, Inbox and Profile.
- Studio: an "Original Action Pill" entry, selectable, that keeps the current treatment through the existing variant (no duplicated logic).
- Reddit-structure action row under the media for every PostCard type: portrait, landscape, carousel, video, text, mixed, long caption.
- Video playback controls stay intact.

Acceptance:

- The lens is centred within 1 px for every tab, at 320, 393 and 430 px.
- The action row is under the media on every post type.
- Targets are 44 px or more.
- Counts and active states are clear.
- The Studio Original pill renders and works.
- Light and dark both checked.
- The default Home is unchanged otherwise.

**Stage 2. Profile.** Depends on Stage 1 buttons and section bands, and decisions D4 and D5.

Scope:

- **Own profile:** one neutral Edit profile button (52–56 px) with no frame; Explore work stays secondary.
- **Visitor profile:**
  - Follow is solid green and primary, with a clear Following state.
  - Message is outlined and secondary.
  - No frame around them.
- **Hero hierarchy:** portrait, name, verified, title, city, languages, years, credit count, availability.
- **Selected work** becomes a deterministic compact bento:
  - 3–5 items, at most two rows, plus See all to the existing gallery.
  - Video tiles get a play mark and no autoplay.
  - Handles 0, 1, 2, 3, 4 and 5+ items with no holes.
- **Verified credits** become a 2:3 poster rail showing about 2.4 cards: title, year, credited role, production, subtle verified mark, missing-poster fallback.
- **Section order:** Hero, Showreel, Selected work, Verified credits, Independent projects, About and Professional details, Featured work and Links, Work preferences, Reviews, Speaking, Collaborations.
- Also covers the house profile variants.

Acceptance:

- Profile length for Kiran reduced by at least 40% versus baseline.
- No bento holes for 0–6 items (unit-tested).
- Posters are exactly 2:3.
- Credit rules unchanged.
- Own, visitor, sparse, image-heavy, no-credits, many-credits and house profiles all checked.

**Stage 3. Detail pages.** Depends on Stage 1 info group and buttons.

Scope:

- **Event:**
  - show its real art through `eventArt` (root cause: EventScreen uses `cover` or the project only, not the host fallback)
  - title block, then a when / where / price and places group without the bordered box or split city column
  - organiser, description, Request to attend (green) with its states
- **Opportunity, collaboration, post, review and house info:** fix wrapping, alignment, hierarchy, repeated cards, whitespace, image ratios, CTA visibility, section boundaries.
- No trailer work (that's Stage 4).

Acceptance:

- Event detail shows the listing's art.
- No orphan wraps at 320 px.
- One primary CTA per page.
- Sections are visually distinct.
- Long titles and missing fields handled.

**Stage 4. Project detail and trailers.** Depends on Stage 0 media findings and decisions D6 and D7.

Scope:

- **Trailer-first WorkScreen:** inline muted autoplay (respecting Reduced Motion and save-data), mute, fullscreen, pause when scrolled away, one video at a time, fallback when autoplay is blocked.
- Language chips only when there is more than one version; switching keeps your place.
- Below the trailer: identity, synopsis, production info, a cast and crew rail, verified credits (2:3 rail from Stage 2), posters and media, opportunities, reviews. Only sections that have data.
- **Trailer upload** in project creation and media management (house flow, `Create.tsx`):
  - validation, progress, errors, replace and remove, language metadata, draft and publish
  - session-only per B2
- Privacy rules preserved.

Acceptance:

- Autoplay is muted only, and never two videos at once.
- Fullscreen and language switching work.
- Projects without a trailer get a still or poster fallback.
- Drafts and private projects are not exposed.

**Stage 5. Home, integration, QA.** Depends on Stages 1–4.

Scope:

- Home refinements inside the approved direction: This week, tiles, section bands.
- App-wide consistency sweep.
- Responsive checks at 320, 375, 393 and 430 px, tablet and desktop frame.
- The 16 core journeys (from the brief).
- Bento reliability in Discover and Selected work.
- The Studio Original pill still present.
- Full regression; rewrite the outdated `views` and `mobile` suites.

Acceptance:

- All journeys pass.
- Regression shows no new failures versus the known baseline (section 9).

## 8. Decisions needing approval (before the stage that needs them)

- **D1, Stage 1. Post actions.** The live default is the Option A corner notch, approved recently. The brief asks for a Reddit-style row under the media, and to keep the "Original Action Pill" in Studio.
  - Proposal: the row under the media becomes the default. Studio keeps both earlier versions selectable: *Original Action Pill* (the frosted pill on media, `?actions=pill`) and *Corner notch* (`?actions=notch`).
  - Confirm that "Original" means the frosted pill, not the notch.
- **D2, Stage 1. Feed video.** With the actions moved under the media, the reason for Option A's "no scrubber in the feed" goes away.
  - Proposal: restore a full-width interactive scrubber, duration, mute and fullscreen on feed videos, and keep the fullscreen viewer.
- **D3, Stage 1. Comment and Repost.** Ana has no comments or repost (comments were deliberately left out).
  - Proposal: the row keeps Like (with count), Share and Save. No Comment or Repost.
- **D4, Stage 2. Posters (B3).** There are no 2:3 poster files.
  - Proposal: when a real poster is missing, show a type-set poster card (title, year, house, on a tinted ground; no generated imagery). Do not crop 2:1 stills to 2:3 (that keeps about 25% of the image). Real posters drop in through the existing `posters/*` mapping once delivered.
- **D5, Stage 2. Profile section order.** As listed in Stage 2 above. Confirm, or adjust.
- **D6, Stage 4. Trailer assets (B1, B2).**
  - Proposal: add `trailers` to the data model. Seed demo trailers from the existing clips, clearly marked as demo, or from YouTube or Vimeo URLs you supply. Trailer uploads stay session-only.
  - A persistent storage backend is out of scope unless approved.
- **D7, Stage 4. Trailer required to publish.** Proposal:
  - required only when a film project is first made public at the Post-production or Released stage
  - drafts, earlier stages and existing projects are never blocked; they show a still or poster fallback
- **D8. Research study.** /test participants see the live app, so each stage changes what they see.
  - Option: pin /test to a frozen build.
  - Proposal: leave it, but say so before each stage ships.

## 9. Known test baseline (before Stage 1)

**Pass:** unit tests, typecheck, build, plus these browser suites:

| Suite | Result |
|---|---|
| launch | 43/0 |
| wt12 | 13/0 |
| wt5 | 14/0 |
| wt346 | 34/0 |
| wtx | 5/0 |
| wtr | 1/0 |
| wth | 24/0 |
| fields | 21/0 |
| test-a11y | 127/0 |
| test-old-session | 4/0 |
| focusflow | 18/0 |
| carousel (This week) | 32/0 |
| nav and notch | 143/0 |
| device frame | 57/0 |

**Known failures (pre-existing):**

- smoke: 4 combos
- `/test` flow, desktop and mobile: crash, "missing Anvi Reddy"
- test-resume: 6/1
- axe2 / axe navigation: "no tap target: Availability", "no label Back", "no tap target: Edit profile"

**Outdated after an approved change:** `a11y/views.cjs` and `a11y/mobile.cjs` still test the old manual view switch. They need rewriting for the automatic device frame.

These QA scripts live in the session scratchpad, not the repository. Their checks are summarised here; recreate them only if needed.

## 10. Backlog (outside the active stage)

- Legacy Home code still in the tree: `HomeScreen`, `HomeNext`, the legacy Discover branches, `features.home` variants. An archive was requested earlier, still to execute.
- In `glass.css`, the reduced-transparency rules use `.phone[data-dir]`, which also matches `data-dir="current"`, so they apply to the default app too. Should be `:not([data-dir='current'])`.
- The CSS layering (26 files) should be consolidated over time. Not part of this refinement beyond the token fixes.
- In `ProfileScreen.tsx`, some house admin a11y labels are missing (see the axe items in section 9).

## 11. Progress

| Stage | Status | Checkpoint |
|---|---|---|
| 0 Audit and plan | Done, awaiting approval | this commit |
| 1 Foundations, nav, post actions | Not started | |
| 2 Profile | Not started | |
| 3 Detail pages | Not started | |
| 4 Project and trailers | Not started | |
| 5 Home, integration, QA | Not started | |
