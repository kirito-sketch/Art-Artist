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

## 8. Decisions (approved after Stage 0)

- **D1. Post actions: approved.**
  - The row under the media is the only production treatment.
  - The Original Action Pill (frosted, on the media) and the Corner Notch (Option A) are archived. They render only through Studio (`/studio/compare?set=actions`, or `?actions=pill|notch`), never in the regular app.
  - One `PostActions` component, one Like state; rollback is the URL flag.
- **D2. Feed video: Instagram-style, mobile-only.**
  - Muted autoplay when allowed.
  - Single tap pauses or resumes.
  - Hairline progress bar; touch-hold to scrub.
  - A small sound toggle.
  - A play mark only while paused.
  - No control bar, cast or menu.
  - The fullscreen viewer is kept. On touch it opens from a small expand circle in the bottom-left corner, the same 28 px glass circle (44 px target) as the sound toggle opposite it; it is a real button, so the card's single and double taps never fire on it. It also works from the keyboard and assistive tech.
- **D3. Actions: Like (with count), Share, Save. Double-tap to Like on every post type.** Details in section 8a.
- **D4. Posters: temporary type-set 2:3 fallback.**
  - Don't crop stills into posters.
  - Inventory the films that need real 2:3 artwork; it will be supplied separately and dropped into the same component.
  - Never present generated concept art as official posters.
  - Amended 2026-10-08: the product owner will supply generated posters for the prototype's fictional films (`POSTER_PROMPTS.md`). Real productions still use only their own posters.
- **D5. Profile order: approved.** Hero, Showreel, compact Selected work bento (3–5 items), Verified credits, Independent projects, Professional information, the rest. No duplicated information.
- **D6. Trailers.**
  - Add a structured trailer/teaser model with a language per version.
  - Session-only upload is not acceptable as the final implementation. In Stage 4, propose the smallest persistent media architecture (Supabase Storage, Cloudflare R2 or hosted video), covering storage, playback, authentication, permissions, cost and encoding.
  - No paid backend without approval.
  - Temporary clips and links may be used for prototyping, but never presented as persistent uploads.
  - The six 6-second clips are not trailers. Document the missing trailer assets.
- **D7. Trailer requirement.**
  - Drafts, pre-production and production can publish without a trailer.
  - New public projects at post-production or released require a trailer or teaser.
  - Existing published projects stay accessible with a poster or still fallback.
- **D8. Research baseline: frozen.**
  - Branch `research/baseline` (commit `d37bbb7`) is the frozen /test code. As of Stage 2 it has no deployment of its own (its Vercel branch URL returns DEPLOYMENT_NOT_FOUND), so participants should not be pointed at it until one exists; the smallest fix is to assign a stable alias in Vercel to the existing `d37bbb7` deployment. Active development continues on `claude/ana-product-strategy-in22y2`.
  - The "missing Anvi Reddy" crash was real. Since /test moved to the District Discover, it opened on Posts instead of the study's People; fixed in `d37bbb7`. The flow and resume suites' selectors were also updated for the District markup.

## 8a. Mobile-only interaction rules (all stages)

Art & Artist is touch-only, including inside the desktop phone frame.

- No hover-dependent actions.
- No desktop control bars.
- No extra player chrome.
- Every target is 44 px or larger.

**Gestures.** One hook, `ui/useTapGestures.ts`, on post media and on text-post bodies:

| Gesture | Result |
|---|---|
| Single tap on a video | Pause or resume. Confirmed after the 280 ms double-tap window, so a double tap never toggles playback. |
| Single tap on a still | Nothing. |
| Double tap on any post | Like it: same `usePostLike` state as the button, optimistic, personal even when acting as a house. Never unlikes. Shows a white heart at the tap point (green on text posts) for 0.7 s; with Reduced Motion it only fades. |
| Unlike | Only through the Like button, which is also the accessible alternative to the gesture. |

**Not gestures:** buttons, links, the scrubber (`role=slider`), carousel dots and anything marked `data-no-gesture`. Swipes don't produce clicks, so carousel swipes and scrubbing never Like. A keyboard activation (a click with `detail 0`) is an immediate single action.

**Video.**

- One video plays at a time.
- The feed shares one sound setting (`state/feedVideo.ts`).
- Videos pause off screen.
- No autoplay with Reduced Motion or Save Data.

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
- axe2 / axe navigation: "no tap target: Availability", "no label Back", "no tap target: Edit profile"

**Fixed before Stage 1:** the `/test` flow (mobile 39/0, desktop 37/0) and test-resume (7/0); see D8.

**Outdated after an approved change:** `a11y/views.cjs` and `a11y/mobile.cjs` tested the old manual view switch. Rewritten in Stage 5 for the automatic device frame (views 22/0, mobile all pass).

These QA scripts live in the session scratchpad, not the repository. Their checks are summarised here; recreate them only if needed.

## 10. Backlog (outside the active stage)

- Legacy Home code still in the tree: `HomeScreen`, `HomeNext`, the legacy Discover branches, `features.home` variants. An archive was requested earlier, still to execute.
- In `glass.css`, the reduced-transparency rules use `.phone[data-dir]`, which also matches `data-dir="current"`, so they apply to the default app too. Should be `:not([data-dir='current'])`.
- The CSS layering (26 files) should be consolidated over time. Not part of this refinement beyond the token fixes.
- axe2 still reports "no tap target: Availability" (the test's selector, not a missing control; the other two known items no longer appear).
- `stills/tara-faultlines.jpg` is referenced in `data/works.ts` and `data/seed.ts` but was never added; the cover fallback shows instead.
- `src/main.tsx` imports `home-next.css` and `post-row.css` twice. The first import wins, so both load before the district and profile layers. Remove the early pair and check the cascade.

## 11. Progress

| Stage | Status | Checkpoint |
|---|---|---|
| 0 Audit and plan | Approved | `10eaacf` |
| 1 Foundations, nav, post actions | Approved | `6329e99` |
| 2 Profile | Approved (with round 2 feedback) | `65ff282` |
| 3 Detail pages | Approved (with review feedback) | `f3768b1` |
| 4 Project and trailers | Approved (with review feedback) | `0bede79` |
| 5 Home, integration, QA | Done, awaiting review | see below |

### Stage 1 record

**Built:**

- **Post actions:**
  - The row under the media is the default (`PostActions` variant `row`, `styles/post-row.css`).
  - The archived pill and notch are behind `?actions=` (`ui/preview.ts`).
  - Studio has a three-way live comparison (`studio/Compare.tsx`, `?set=actions`).
- **Feed video:** Instagram-style (`screens/home/ReelVideo.tsx`). The archived notch keeps `FeedVideo.tsx`; the pill keeps the native player.
- **Double-tap Like:** on images, carousels, videos and text posts (`PostCard.tsx`, `ui/useTapGestures.ts`).
- **Nav lens:** now takes the selected tab's full layout box, both axes (`nav/TabBar.tsx`). It used to be the tab plus 2 px on each side with fixed 4 px vertical insets.
- **/test:** Discover default restored (`App.tsx`).
- **Review samples:** now include a text post.
- **Edge-to-edge media (review feedback):** in the row layout, post images and videos run to the screen edges with square corners (`--post-bleed` in `styles/post-row.css`: 16 px in the stream, the page gutter elsewhere). The header, caption and action row keep their inset. Checked at 320, 393 and 430 px, light and dark, in the stream and on profiles.

**Design system:**

- No token replacement was needed for this stage. The new components use the existing tokens: `--action`, `--action-ink`, `--action-tint`, `--text`, `--focus-color`.
- CTA height and treatment normalisation belongs to Stage 2, where the profile CTAs are rebuilt.

**Verification:** 52/0 Stage 1 checks under touch emulation, covering:

- the nav lens on every tab at 320, 393 and 430 px, in light and dark
- the row under the media on all 11 sample posts
- double tap on images, carousels, text and video
- no unlike on a liked post
- the Like button unliking
- controls never acting as gestures
- carousel swipes
- single tap delayed past the double-tap window
- scrubbing
- sound
- one video at a time
- minimal chrome
- the viewer still reachable
- Reduced Motion
- the Studio three-way comparison

**Accepted limits:**

- The house-identity Like is kept by construction: the same hook, keyed by the person.
- Fullscreen in the feed is the small expand circle only (D2); no large button.

### Stage 1 sign-off additions

- **Touch fullscreen:** a small expand circle (bottom-left, mirroring sound) opens the viewer. It's a real button, so tap gestures never fire on it. Checks: 56/0.

### Stage 2 record

**Built** (default immersive profile; the legacy profile is unchanged):

- **Hero:**
  - Actions have no outer frame.
  - Visitor: Follow is solid brand green (`--action`, the lifted green in dark mode). Message is outlined glass. Following turns neutral glass. All are 52 px.
  - Own profile: one neutral glass Edit profile, 52 px.
  - Hierarchy: name, then role (16 px, semibold), then place and credibility (13 px), then availability, then actions.
- **Selected work:** a compact bento (`domain/selectedWork.ts`, unit-tested from 0 to 12 items, every shape, no holes).
  - At most five tiles in two rows, in the person's order.
  - A portrait first piece leads with a tall tile.
  - With more than five, the last tile shows "+N". See all opens the full collection.
  - Row heights come from container units, so spanning tiles never collapse.
- **Verified credits:** 2:3 poster rail with about 2.4 cards visible (`ui/PosterCard.tsx`).
  - Each card shows the title, the credited role (accent), the production with its verified mark, and a small seal on the poster.
  - The full history is a two-column poster grid.
  - Credit rules, permissions and the acceptance seal animation are unchanged; the cards only re-skin `publicCreditsFor`.
- **Posters (D4):**
  - Official posters only, via `data/posters.ts`. None are supplied yet, so every card uses the type-set poster.
  - Stills are never cropped into posters.
  - The missing artwork is listed in `docs/ux-refinement/POSTER_INVENTORY.md` (6 films needed now).
- **Section order (D5):** three acts separated by a full-bleed band; within an act, sections are separated by space only.
  1. Showreel, Selected work, Verified credits, Independent projects.
  2. About (clamped to four lines with More), Skills, Professional details (two-column facts), Featured work and links (one section), Work preferences.
  3. Posts (a compact grid that opens the stream), Reviews, Hosting and Speaking, Collaborations.
  - Then "Manage your profile", visible only to you.
- **No duplication:**
  - Professional details no longer repeats craft, languages or years.
  - Work preferences no longer repeats "Open to work", which sits under the name.
- **House profile, cinematic hero (review feedback):** the house page used the older cover-and-logo layout, because the immersive hero had only been built into the individual profile.
  - It now has its own full-screen hero (`screens/org/HouseHero.tsx`, styles in `profile-stage2.css`).
  - The house's own stills play as a slow reel: a push-in while each shot holds, then a 1.6 s dissolve. With Reduced Motion the first still holds, and the reel stops when the hero is off screen or the page is hidden.
  - The identity is set like a title card: a Now making / Latest release slate, the house mark, a "Production house · City" eyebrow, the name with verified mark, the house's line, then its record (projects, credited people, open roles).
  - Actions use the profile CTA system:
    - Visitor: Follow (solid green) and Open roles (outlined).
    - Own house: Edit page (neutral) and Open a role (green).
  - A compact header with Follow appears on scroll. The sheet starts with the house's work.
- **House profile:**
  - "Made by us" is the same 2:3 poster rail.
  - Own house: Open a role is primary.
  - Visitor: Follow is solid green.
- **Deep link:** `?org=<id>` opens a house page (QA and Studio).
- **Review feedback, round 2:**
  - **Posters supplied.** Six prototype posters are now live (`POSTER_INVENTORY.md`).
  - **Edit profile is solid green**, matching Follow: one primary action on every profile.
  - **Cover-slide.** On both the person and house pages, the hero is pinned (`position: sticky`) and the sheet slides up over it, casting a soft shadow.
    - As the sheet rises, `--hero-t` (0 → 1) eases the image in by 6% and dims it by up to 60%, and the title card lifts 40 px and fades out.
    - Only transform and opacity change. With Reduced Motion the sheet still covers the hero, but nothing moves.
    - The compact header now appears once the sheet is about 100 px from the top.
- **Empty state:** a profile with nothing to show yet gets one quiet line, plus Add work on your own profile, instead of an empty sheet. Empty Professional details and leading bands are suppressed.

**Measured (Kiran, own, 393 px):**

| | Baseline | Now | Change |
|---|---|---|---|
| Total height | 4,693 px | 3,933 px | −16% |
| Height below the hero | 3,905 px | 3,145 px | −19% |
| Selected work | 986 px | 317 px | −68% |
| Verified credits start | ~2,050 px | 1,376 px | −33% |

**Accepted limit:**

- The ≥40% total reduction target in section 7 isn't met. The hero is a fixed full screen (788 px), and the remaining length is real content: reviews, events, collaborations and details.
- Reaching 40% would mean hiding content behind disclosures. That's proposed for review, not done.

**Verification:** 58/0 Stage 2 checks under touch emulation, at 320, 393 and 430 px in light and dark. They cover:

- CTAs: frame, colour, height, and the Following state
- the bento: tile count, two rows, no overlap, filled, +N
- posters: exactly 2:3 and 2.4 visible
- section order and no repeated facts
- no horizontal scroll
- content states: sparse (Nikhil), two credits (Vikram), posts grid to stream, credit history, poster to project, and the house page

Unit tests, typecheck and build pass. Screenshots are in `docs/ux-refinement/stage2/`.

### Stage 3 record

**Built:**

- **Shared `InfoGroup`** (`ui/InfoGroup.tsx`, styles in `profile-stage2.css`). It is the plan's "detail info group": facts as rows with no box.
  - Each row is an icon, a primary line and a secondary line beneath it, never a split column.
  - Hairlines separate rows. An optional action (View on map, View project) sits on its own row.
- **Event detail:**
  - **Art (root cause fixed).** `EventScreen` used the event's cover or its film only, so it skipped the host-work fallback in `eventArt`. It now uses `eventArt`, so every listing shows its art; the crew evening uses Konark's current production.
  - **Hero:** 4:3, up to 46% of the screen height, with a shade for the controls.
  - **Title block:** type, title (balanced), then a "By <organiser>" byline that opens the organiser.
  - **Info group:** When (with end for multi-day events), Where (venue, city beneath, View on map), Film (when linked), Free (places, and the organiser confirms each request). The bordered box and split city column are gone.
  - **One primary action:** Request to attend is the only green button. Follow in Hosted by is now outlined.
  - **No repeated venue:** the separate Venue section now appears only for online events (joining details).
- **Role and collaboration detail:**
  - Location, Dates and Language use the info group instead of the two-column call sheet.
  - Titles are capped by the sheet's width (container units), so "Cinematographer" no longer breaks mid-word at 320 px.
  - The poster's name and verified mark sit on one line, with the project beneath. No dangling "·".
  - The bottom bar keeps pay and closing date on one line each at 320 px, with a tighter button under 360 px.
- **Review cards and post detail:** checked at 320 px. Nothing needed fixing; the project page belongs to Stage 4.
- **Deep links:** `?event=`, `?role=` and `?work=` for QA and Studio.

**Verification:** 240/0 Stage 3 checks at 320, 393 and 430 px in light and dark, on 4 events (house host, person host, multi-day, film-linked) and 4 roles (crew, collab, ad, series). They cover:

- no word broken mid-word in titles
- exactly one primary action on the page
- no horizontal scroll
- facts in the info group with no split columns
- the listing's art in the event hero
- the organiser under the title
- pay not cut in the bar

Regression passes: unit, tsc, build, wt12 13/0, wt5 14/0, wt346 34/0, wth 24/0, fields 21/0, launch 43/0, test-a11y 127/0, test-flow mobile 39/0, resume 7/0, focusflow 18/0, and Stage 2 64/0. Screenshots are in `docs/ux-refinement/stage3/`.

### Stage 3 review feedback

- **No Helpful on film reviews.** The Helpful button and "N found this helpful" are removed. The film review sort is now Newest (default) and Highest rated (`sortReviews(..., 'rating')`, unit-tested). The stored `helpful` field is no longer shown anywhere.
- **Profile film reviews, redesigned** (`FilmReviewTile`):
  - Each tile shows the film's 2:3 poster (the supplied poster or the type-set one), its title, the rating and when, then the review in up to four lines. Spoilers stay behind a line.
  - One review fills the width. Several become a swipeable rail that peeks at the next, so ten reviews take the space of one, and See all lists them with the same tile.
  - The section is "Film reviews · N".
- **Profile bands removed.** The full-bleed band between acts is gone; acts are separated by spacing only.
- **Bug fixed:** the Stage 1 feed-video `.rv` style collided with the reviews screens' `.rv` class and painted their background dark. It is now scoped to `.rv[data-reel]`.

### Stage 4 record

**Built:**

- **Trailer model (D6).** `Trailer` in `state/world.ts`: kind (trailer or teaser), language, url, poster frame, duration, dimensions, status (draft or published), and `temporary` or `sample` flags.
  - House projects carry `trailers[]`.
  - The public work gets only published versions, so drafts never leave the workspace.
- **Trailer rule (D7, `domain/trailers.ts`, unit-tested).** `trailerGate()` blocks making a new project public at post-production or released without a published trailer or teaser.
  - It also blocks moving a public project into those stages, unpublishing or removing the last version.
  - Drafts, early stages and seeded projects (no `trailerRule`) are exempt; existing projects keep their still or poster fallback.
  - Wired into Share on Art and Artist, the Details stage change, and the trailer manager.
- **Project page, redesigned on review feedback** (`screens/org/WorkCinema.tsx`, `styles/project-cinema.css`). It follows District's movie-page structure in Ana's design, replacing the first 16:9 version.
  - **Always dark** (a cinema), whatever the app theme.
  - **Pinned hero.** The trailer fills about 64% of the screen and stays put while the details sheet (with a handle) slides up over it. The trailer eases in, dims and pauses once covered.
  - **Hero overlays:**
    - back, a language pill (it opens a version picker when there are several versions; switching keeps your place), and share
    - sound, bottom left
    - "Watch full trailer" (or teaser), bottom right: full screen, from the start, with sound and native controls
    - a tag for "This session only" or "Sample clip, not this film"
  - **No trailer yet:** the film's own footage clip (in the prototype: Kaaval, Fault Lines, Monsoon Letters, Neeli Raat, Neela Akasham, Backwaters) moves in the hero, called a clip ("Watch clip", no language pill). It is never presented as a trailer, so D6 and D7 still hold. Without a clip, the 2:3 poster holds the hero, else the still. A published trailer always takes over.
  - **Fix:** with no language pill, the top bar keeps back on the left and share on the right (an empty middle slot).
  - **Sheet:** title; a meta line (format | language +N more | stage or year); release; "By <production> ✓".
    - A momentum row with one pill: before release, a countdown with Save; once reviews are open, the rating and Rate (or "You rated 4").
    - Then the logline (with View more), action cards (your credit with "Something wrong?", Hiring now with the open-role count), Buzz around this film (screenings and review quotes, with All reviews), Cast and crew (avatar with name and role beside it), Posters and stills (a large poster with two stills, then rows of three), Open roles, Posts, and Report.
  - **One fixed action:** Open in your workspace (lead house), See open roles · N, Rate and review (released, not rated yet), or Save project.
  - **Compact header** once the sheet covers the hero: back, centred title and share over a blurred poster backdrop.
  - The old-design page is unchanged.
- **Trailer manager** in the house workspace (`screens/production/TrailerManager.tsx`, file reading in `ui/trailerPreview.ts`).
  - Add a trailer or teaser with kind and language (one per language and kind).
  - File checks: type, size up to 500 MB, length up to 5 minutes, 1080p or smaller.
  - Honest local progress (checking, reading, poster frame) with cancel.
  - Clear errors, then Publish or Move to draft, Replace, and Remove (with confirm).
  - Every file is labelled "on this device for this session only", and the section says storage isn't set up.
- **Studio review mode:** `?trailer-sample` attaches two labelled stand-in clips to review the player and language chips. It's never the film's trailer.

**Docs:**

- `TRAILER_STORAGE.md`: the persistent storage proposal (Supabase Storage recommended for the prototype; Cloudflare Stream later; a hosted link as the fallback). Covers cost, permissions, encoding and the approvals needed.
- `TRAILER_ASSETS.md`: the missing trailer assets. No real trailers exist; the six clips are 6-second 4:5 tests.

**Verification:**

- **Project page:** 20/0 checks (including the clip hero and button placement) covering:
  - the hero at ~64% of the screen, the overlays, dark in the light theme
  - muted autoplay, the language picker, tap to pause and resume
  - Watch full trailer (full screen with sound)
  - the hero pinned and paused under the sheet, the compact header, section order, the fixed action
  - Reduced Motion, the poster fallback, the rating row, "See open roles" on a hiring project
  - no horizontal scroll at 320, 393 and 430 px
- **House flow:** 7/0 checks covering:
  - the workspace section, a wrong file refused, added as a session-only draft
  - publish, then the public page leading with the 16:9 trailer labelled session-only and playing muted
  - a draft never reaching the public page
- **D7:** unit tests.
- **Regression:** all suites pass, plus the Stage 2 (64/0) and Stage 3 (240/0) checks and resume (7/0).

**Accepted limits:**

- **Uploads are session-only (D6),** pending approval of `TRAILER_STORAGE.md`.
- **No codec check on files.** Headless Chromium can't decode H.264, so the automated upload check uses the WebM version. On devices, MP4 plays natively. A file the browser can't read shows a clear error.

Screenshots are in `docs/ux-refinement/stage4/`.

### Stage 5 record

**Home audit and fixes:**

- The category tiles were the loudest thing above the fold. They're now smaller (`home-next.css`): large tiles 92 to 82 px tall with 46 to 40 px art; wide tiles 60 to 52 px with 36 to 32 px art. This week (the approved carousel) now starts higher and carries the emphasis.
- Section separation stays space and headers only; no sticky navigation, no bands. No other Home changes, and no archived Home design was brought back.

**Consistency and responsive:**

- No horizontal scroll on Discover, Inbox, own profile, visitor profile, house, project, event and role, light and dark, at 320, 375, 393 and 430 px.
- Device frame: tablet (820×1180) and desktop (1440×900) show exactly one frame; phones in portrait and landscape show none.

**The 16 journeys:** all pass (21/0 checks): Home and Discover; switching nav items; professional profiles; Follow and Message; compact Selected Work; the full gallery; film credits; projects; trailers; trailer languages; fullscreen playback; events; requesting attendance; post actions; switching identities (Konark house, then Aditi); light and dark. The Studio Original action pill is still there.

**Bento reliability:** 21/0. Discover and Selected Work across 1 to 5+ items, every width: no gaps, no overlaps, at most two rows, "+N" on the last tile.

**Final QA:**

| Check | Result |
|---|---|
| Unit, typecheck, build | Pass |
| launch, wt12, wt5, wt346, wth, fields | 43, 13, 14, 34, 24, 21 / 0 |
| wtx, wtr | 5/0, 1/0 |
| test-a11y, test-flow mobile, test-old-session, focusflow | 127/0, 39/0, 4/0, 18/0 |
| views (rewritten), mobile | 22/0, pass |
| Stage 2, 3, 4 checks; house upload | 64/0, 240/0, 20/0, 7/0 |
| smoke | 4 known combos (baseline) |
| axe2 | 1 known item (baseline had 3) |

The Stage 3 check now waits for the event hero image; it read the image before the cover fallback had loaded.

**Remaining issues:** none new. The known smoke combos and the axe2 selector item are unchanged from section 9.

**Deferred scope:** persistent trailer storage (`TRAILER_STORAGE.md`, needs approval); real trailers and the missing still; the backlog in section 10 (legacy Home code, glass selector, CSS consolidation, duplicate imports).

**Known limitations:** trailer uploads are session-only (D6); the automated upload check uses WebM because headless Chromium can't decode H.264.

Screenshots are in `docs/ux-refinement/stage5/`.
