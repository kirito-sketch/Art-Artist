# Ana media audit and presentation system

Post-specific correction: see [Post sizing and demo content](POST_MEDIA_DEMO.md). Posts now have no View original CTA; the seeds demonstrate mixed heights, and genuine native vertical video can retain up to 9:16. The original inspection results below describe the initial migration, before this correction.

Discover layout correction: see [Deterministic Bento groups](DISCOVER_BENTO.md). The previous independent source-ratio tiles and modulo column spans are retired; complete group rectangles now reserve all tile dimensions before load.

Audit baseline: `0cac4cf` (before this migration). This change concerns media only; Credit authority, Interest, Follow, Messaging, privacy, ownership and free-only Events stay unchanged.

## A. Original media and existing architecture

Original image URLs live in `src/data/seed.ts`, `src/data/works.ts`, project artwork/stills in `src/state/world.ts`, Event covers in `src/state/events.ts`, portfolio entries in the seed portfolio map, and showreel covers in `src/state/profile.ts`. Prototype changes are in memory. Delivered assets live under `public/images`; missing deliveries have approved fallback URLs. There is no general connected image storage/upload service.

`Media` already had width/height, contentType and normalized 0–100 `focal.{x,y}`. `Photo` already handled source/fallback failure and lazy loading. `mediaLayout` already classified legacy poster/portrait paths and supplied ratio, fit and focal position. However its policy was optional, while screen CSS frequently imposed cover.

Individual hero selection used separate `ProfileCover.focal`, subjectHeight and identityRegion. Its protected-region algorithm is deterministic manual framing, not face detection. Original media was not destructively cropped. Native showreel preview generated a poster with canvas while preserving a local video object URL. Poster generation is a derivative, not a replacement for video.

## B–C. Surface inventory and independent decisions

| Surface | Files | Baseline issue |
| --- | --- | --- |
| Rendering, images, identity | `src/ui/primitives.tsx`, `src/ui/bento.ts`, `src/ui/compose.tsx`, `src/App.tsx` | Photo did not request a destination policy; avatar/logo CSS used cover; original viewer relied on CSS contain |
| Posts and creation | `src/screens/home/PostCard.tsx`, `PostActions.tsx`; `src/screens/create/PostComposer.tsx`, `CollabComposer.tsx`; `src/screens/discover/PostStream.tsx` | First slide frame clamped .75–1.5; per-slide cover by default; no framing UX; shared Post entry points already existed |
| Discover and Search | `src/screens/discover/PostGrid.tsx`, `DiscoverScreen.tsx`, `RoleRow.tsx` | Group-of-three shape logic and CSS placement could constrain landscape media; measured dimensions could influence placement; no current blurred-filler implementation found |
| Individual Profile | `src/screens/profile/ProfileScreen.tsx`, `ProfileHeroMedia.tsx`, `ProfileCoverPicker.tsx`, `WorkPortfolio.tsx`, `profileUnits.tsx`, `EditProfile.tsx`, `ProfileCredits.tsx`, `LegacyProfileCredits.tsx` | Hero had dedicated framing; portfolio/credit cards had independent fit variables; Credits contained a local fallback classification patch; avatar had no crop editor |
| Original inspection | `src/App.tsx` MediaViewer | Full images depended on viewer contain CSS; native video inspection was not implemented there |
| Showreel/video | `src/screens/profile/Showreel.tsx`, `src/ui/showreelPreview.ts`, `api/showreel.ts` | Dedicated cover and manual external metadata fallback existed; native drafts are private device previews; cover selection lacked framing; no server transcoding |
| Projects and Houses | `src/screens/org/WorkScreen.tsx`, `OrgScreen.tsx`; `src/screens/production/Create.tsx`, `DistrictHouse.tsx`, `Production.tsx` | Project card/poster and detail hero had different fixed frames with CSS cover; project editor selected art but no focal adjustment; house imagery used same Photo without policy |
| Events | `src/screens/event/EventComposer.tsx`, `EventScreen.tsx`, `eventUnits.tsx`; `src/screens/home/DistrictHome.tsx` | Home, browse and hero had separate fixed ratios but common cover; composer had no framing; detail fallback showed calendar graphic |
| Spotlight/Home/reviews | `src/screens/home/DistrictHome.tsx`, `HomeNext.tsx`, `OpportunityCard.tsx`, `NetworkActivity.tsx`; `src/screens/reviews/ReviewsScreen.tsx` | Mixed media used portrait editorial shell with blanket cover, irrespective of text artwork |
| Context thumbnails | `src/screens/inbox/InboxScreen.tsx`, `src/ui/chrome.tsx`, `src/screens/profile/SavedScreen.tsx` | Small contextual previews use Photo or dedicated avatars; no source crop storage |
| Onboarding | `src/entry/Entry.tsx` | Seed camera roll picker; portrait selected as source URL; no avatar-specific framing |

Hard-coded fit/ratio rules occur in `components.css`, `screens.css`, `expression.css`, `refine.css`, `profile.css`, `profile-immersive.css`, `post-media.css`, `showreel.css`, `events.css`, `district.css`, `district-house.css`, `reviews.css`, `home-next.css`. Approved geometry/radius stays in CSS; typed policies decide content fit and reusable preset ratio variables. Legacy-only geometry stays isolated.

## D–E. Focal points and upload UX

The shared source focal point existed but most creation flows had no editing UI. Profile hero was the exception. Avatars had no separate focal record. Most pickers displayed seed assets, not actual OS uploads. Native showreel supported a private device file preview plus generated poster, with explicit upload-not-connected copy. YouTube/Vimeo had a real server metadata endpoint and manual cover fallback.

## F. Practical limits

Can implement now: immutable source references, destination-scoped Fit/Fill/focal metadata, source-aware deterministic tile assignment, manual sliders/dragging, actual device file previews with measured dimensions, browser-generated native video poster, shared safe-zone framing, full original inspection, lazy images and delivered responsive variants.

Needs infrastructure later: durable upload/object storage; server thumbnail/resizing/compression pipeline; responsive derivative generation; streaming/transcoding; automatic face/text/subject detection. Local device media is explicitly session-only. No generated derivative URLs or backend processing claims are invented. Seed video entries may be poster-only stand-ins until a playable video is delivered. Browser-readable formats depend on the device; unsupported files produce a truthful error.

## G. Shared architecture

- Keep `Photo`, extend it with `surface`, `frameRatio`, priority and source/fallback-aware presentation resolution.
- `Media.src` remains the original source of truth. `Media.poster` is a generated or delivered video preview, never the video replacement.
- `Media.presentations[surface]` holds independent fit/focal metadata. It is cloned by `withFraming`; source objects are not edited in place.
- `Post.presentation` chooses the shared carousel frame. Image ratios within .75–1.91 retain natural proportions; outside that range the frame is bounded and defaults to Fit. Playable video can retain up to 9:16. Slides of different ratios Fit by default. Framing is a creator-side decision; the Post viewer has no alternate-original CTA.
- `mediaPresentation.ts` is the typed destination policy; `mediaLayout.ts` retains legacy source classification and normalized focal handling. Measured delivered seed dimensions live in `mediaGeometry.ts`.
- Posters/artwork default to Fit across public previews. Actual missing-poster fallback is classified by the delivered fallback, centrally.
- `ProfileHeroMedia` retains its specialist responsive protected-region algorithm, requests the shared policy, and uses hero-only focal metadata. There is no claim that every subject can fit; editor warns about impossible regions. Artwork preserves composition and does not claim subject protection.
- Avatar metadata is `Person.avatarFraming`; hero selection never reads it. Logos use dedicated contain treatment.
- `MediaFramingEditor` powers manual Post slide, Portfolio, Project, Event, Showreel and avatar framing; Post frame choices use everyday labels. Profile hero keeps its own overlay-aware editor and protected region.
- Bento chooses among four complete, source-aware three-item patterns, with explicit one/two/four-item leftovers. Original Post presentation is not consulted. Unknown geometry preserves composition across ordinary previews (the dedicated hero uses its measured framing algorithm); source order and opening indexes remain intact. Group containers reserve geometry and all columns close together. No blurred filler.

**Original ≠ preview.** Changing Bento framing cannot alter Post, Profile, Portfolio or original media. Hero framing cannot alter Discover. Adding a framed Post image to Portfolio copies the source without the Post presentation metadata.

## H. Migration sequence

Shared policy and original renderer first; shared Individual hero; Discover/Bento; Post and composer; Portfolio; Credits; Project editor/cards/hero; Event editor/cards/hero; Spotlight; Search/context thumbnails; House equivalents; Showreel and native video previews. Existing components are migrated, not replaced with parallel screen systems.

## I. Regression risks

- Missing poster and real still fallbacks must resolve different content-type policy.
- A poster fitted into an editorial frame may leave intentional neutral space; this preserves its typography. Explicit Fill requires creator opt-in.
- Mixed carousels must keep one stable frame, including native video.
- Unknown seed dimensions must not cause load-time grid reshuffling; known delivered dimensions and new uploads reserve geometry ahead of load.
- Hero subject protection has physical limits, particularly on short screens; no automatic detection claim or opaque green overlay.
- Full original videos must pause/unmount on close and have playback controls separate from Post actions.
- Owner and other profiles must share renderer/section architecture; avatar edits must not mutate hero focus.
- Local files remain in session memory and disappear on reload. Large files have device-preview size guards; production uploads need storage/processing work.
- Responsive image variants are used only when actually delivered. Originals cannot be secretly reduced to thumbnails.

## Verification

Required source ratios: panorama, 16:9, 3:2, 4:3, square, 4:5, 3:4, tall portrait and 9:16. Content: close-up, full-body, dark/bright, cinematography, typography poster, artwork, logo, Event and Project imagery. Browser checks cover shared destination policies, real routes/creation editors, carousel stability, source isolation, own/other profiles, both themes, 393×852 and 320×568, and desktop prototype. Results and deployment status are reported after checks; physical phone testing cannot be claimed from browser emulation.

### Completed checks

Production build/typecheck and 183 unit tests passed. The rendered matrix checked 7,020 Photo cases (nine ratio groups × ten content categories × thirteen destinations × three viewport sizes × two themes). Real browser flows passed for source-aware Discover and shared Post viewer, OS file selection (images and native portrait video), per-slide framing, stable carousel height, original inspection, source-only Portfolio copies, avatar crop isolation, Portfolio scoped save, Event Fit/Fill controls, Production-side Project framing and Credit preview isolation. Shared hero fixtures (close-up, full-body, dark, bright, left and right subjects) passed own/other ownership in both themes at 393×852 and 320×568. The previous Profile parity, sharing, credit count and restricted-field regression suite also passed. No browser runtime errors were observed. These are browser-emulated checks, not physical device testing.
