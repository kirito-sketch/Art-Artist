# District direction (Home and Discover)

A second version of Home and Discover, built for comparison. Production-house pages and connected flows also have a District presentation; their records and product rules are shared with Current.

| How | Effect |
| --- | --- |
| `?home=district` | The District Home and Discover on this device |
| `?home=current` | Today's Home and Discover (the default) |
| `/studio/compare` | Current and New as two live apps: show one, or both side by side, as any persona |

## Home (`src/screens/home/DistrictHome.tsx`)

Rebuilt to docs/DISTRICT_FIXES.md. Each shelf does a different job, and nothing appears twice: anything in the Spotlight is left out of the shelves below it.

1. Where you are: city, craft and languages, notifications, over the static top glow.
2. Tiles: Events, Projects, People, Opportunities, Reviews. Each opens Discover on that chip. There are no separate category pages any more.
3. In the spotlight: up to five time-sensitive things this week, of mixed kinds (roles, projects, new work from people you know, events, films out this week). Never people. Rules in `src/domain/spotlight.ts` (tested), data in `src/screens/home/districtFeed.ts`. The shared editorial shell has a type tag, dominant 4:5 image, title and contextual secondary line over a lower gradient, and one compact metadata footer. Roles show project/creator and closing/city/pay; events show host and date/city/Free; projects show house and stage; reviews show compact rating context. The active card is centred from the first layout, at 70% of the viewport capped at 300 px, with a 10 px gutter and symmetric previous/next peeks scaled to 88%. Scale follows scroll position without 3D effects. Three runs allow seamless looping, including native manual scrolling across the boundary. Rest is 6000 ms after settling; advance takes 600 ms with cubic ease-in-out. Touch and wheel input cancel motion immediately and start a full rest after settling. Rotation pauses offscreen, in a background/unfocused app, while Home is inert/covered and during keyboard focus. Reduced motion, Save-Data and low power disable autoplay; manual navigation still works. Pagination is a compact group of tiny dots and an 18 px active pill, with accessible card labels and no transport controls. The heading and See all remain on the 20 px grid; See all opens the mixed selection in a sheet. The active card plays its clip when motion is allowed.
4. The completion prompt, when one is due.
5. The shelf for why you're here: Find work → Opportunities for you; Find people → People for your project; Collaborate → Collaborations and roles. Three compact rows (64 px image, title, meta, then the fact that decides it: closing date, pay, city, or availability) and See all. Grow my network and Just exploring have no shelf: New work comes next anyway.
6. New work: a mosaic of three posts, people you follow or worked with first, then your department, then everyone.
7. Events: a manual image-led horizontal rail (see below), minus any event already in the Spotlight.
8. Out this Friday: one quote card per film released this week, minus any already in the Spotlight.
9. People near you: your department first, then the departments you work beside (from the taxonomy), with professional context and no presence marker.
10. Continue where you left off: what you saved.
11. "You're up to date." with the tiles as links.

Picked for you is gone: crews forming are in the Spotlight and the intent shelf, and the language shelf was dropped.

No task strip, no "Your people", no explanatory copy.

## Discover (`DiscoverScreen` variant `district`)

A search bar with Saved beside it, then one chip row: Posts · People · Opportunities · Projects · Events · Reviews (`src/domain/contentTypes.ts`). Posts is the default.

- Home's tiles and every "See all" open Discover on a chip. Switching chips adds nothing to Back.
- Searching on Posts looks through everything (people, houses, projects, roles, events). On any other chip it looks through that kind, with a first row "Search all of Art and Artist for '…'". The search text carries over when you switch chips.
- Filters are kept per chip while the app is open.
- The Reviews chip is the Reviews page's content (Out this Friday, Top rated, Recent reviews), narrowed to matching films when you search.

## Taxonomy (`src/data/taxonomy.ts`)

Domain → family → craft, as data. Families know which families sit next to them. `relatedCrafts` (matching, both versions, unchanged in result) and District's department shelves read from it.

## Reviews (`src/screens/reviews/ReviewsScreen.tsx`)

The real review system (docs/REVIEWS.md): Out this Friday, Top rated, and Recent reviews. The same page is the "See all" from the current Home's Out this Friday section. In District it is also the Reviews chip in Discover.

## Media

Tile icons: `public/images/tiles/*.webp`. Spotlight clips: `public/video/<project>.{webm,mp4}`, made from the projects' still images (there is no real footage yet).

## Top of Home

At the top of the page there's a static ambient glow (`.dh-top-amb`), like District's. It's strongest behind the location header and has faded out by the middle of the first row of tiles. Below that, the page is Ana's normal background. It never moves.

How it's built: one broad radial from just above the top edge, plus a smaller offset one for depth. Eased stops and a 24 px blur mean there's no band or edge. The layer starts 60 px above the page so the blur doesn't thin the top, where the light is strongest.

It uses Ana's palette, not District's purple. Theme tokens on `.dh`:

| Token | Light | Dark |
| --- | --- | --- |
| `--home-ambient` | warm accent #e9a25a at 28% | deep brand green #2f7a66 at 52% |
| `--home-ambient-2` | muted green #7fae9e at 14% | warm #a8662f at 16% |

Measured against the same frame without it, at the top centre: light is about 15% warm tint, fading to under 1% by 140 px down. Dark lifts the top by up to about 44 levels in green and has faded out by the same point. The spotlight section has no glow of its own.

## Events (manual rail)

Three image-led cards in a native horizontal snap rail, with a next-card peek and no autoplay or scaling. Cards are 78% of the rail width capped at 285 px, with a dominant 4:3 image and compact category, title, date/time, city and Free metadata. Artwork comes from the event, linked project or host's work; a designed Ana fallback handles missing artwork. Attendance privacy, selection and capacity are explained in event detail rather than Home card captions. The Camera crew evening example remains pinned in this shelf and opens the existing private attendance request flow.

Chosen for the person by `domain/eventRank.ts` (city, craft, network, followed houses, date, newness; one per organiser, two per type) and fixed for the session. Titled "Events near you" when the first event is in your city, otherwise "Events coming up". See all opens the Events page.


## Settings

Settings shows Appearance and its current value. It opens a focused page with full-width System, Light and Dark radio options, short descriptions and icons. Selection applies immediately through the existing theme system. System follows OS changes live; the stored choice resolves before the first paint. Both personal and house Settings open the same page. Current keeps its existing Appearance presentation.

## Onboarding intents

In District, “What brings you here?” allows one to three goals. Selected rows show a check and the existing green treatment. Continue requires at least one goal; selected goals remain when going Back. Just exploring is exclusive in both directions and stays available at the limit. “Join a collaboration” distinguishes joining others from finding people for your own project. Current and `/test` retain their single-choice flow.

The full ordered ID array is stored privately in `ProfileExtra.onboardingIntents` and exposed by the store, in the same session state as the prototype profile. The first selected ID supplies the existing single-intent Home shelf; no ranking or Discover redesign is included. Availability is asked if any goal is work or collaboration. Selection rules are pure and unit-tested.

## Production house

District houses have their own Home: a compact Needs you list, equal-sized project artwork cards, open roles, people for their roles, hosted events and released films. Shared co-productions open their public pages; only lead-owned projects open the workspace. Operational See all opens owned records. People See all opens Discover, defaulting to People, with optional own-role matching, taxonomy crafts, availability, city and verified-credit filters. Saved and Follow remain personal.

House profiles remain work first. Public project pages disclose only announced details and accepted credits. The workspace puts roles and private associations before secondary project details, and gives credits their own section. Announcement uses a public preview with expandable visibility details. Creation, roles, Interest review, association/credit flows, free events, setup, identity switching, Inbox and house Settings share the District spacing and surfaces.

Current and /test retain their existing presentation. Interest, messaging, permission, role lifecycle and credit rules are unchanged. The handoff's shortlist language is intentionally not implemented: review retains New, In conversation, Not now and No longer interested. Waiting for credit acceptance and associations without credits stay as project statuses rather than Home tasks. Full plan and validation: `docs/DISTRICT_HOUSE.md`.

## Showreel and work management

District uses the source-independent Showreel, Portfolio and Featured work model in [SHOWREEL.md](SHOWREEL.md). Upload video prepares an explicitly private device preview until production infrastructure is connected. YouTube/Vimeo links use metadata and in-app players. Current and /test retain their prior editor and reel presentation. Spotlight now follows the supplied recording as described above.
