# District direction (Home and Discover)

The product default for Home and Discover, including normal app launches, previews, phones and participant tests. Both Individual and Production House use the District direction; records and product rules remain shared with Legacy Home. Old stored Home or prototype-view choices do not override a normal launch.

| How | Effect |
| --- | --- |
| Normal launch | New Home automatically, in the standalone app presentation |
| `?home=district` | Explicit New Home override (not needed normally) |
| `?home=legacy` or `?home=current` | Explicit Legacy Home comparison for this URL only |
| `/studio/compare` | New Home (default) and Legacy Home: show one or both, as either identity |
| `/test` | New Home and Events, including resumed sessions; `?arm=current` is an explicit research override |

Theme is independent of Home selection. Light, Dark and System also apply to `/test`. Normal navigation and detail returns share the same version setting; no Compare wrapper is required.

## Home (`src/screens/home/DistrictHome.tsx`)

Rebuilt to docs/DISTRICT_FIXES.md. Each shelf does a different job, and nothing appears twice: anything in the Spotlight is left out of the shelves below it.

1. Where you are: city, craft and languages, notifications, 
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

There is no glow, wash or blur layer behind the header or the status bar. The top of Home is the page's own ground (and the cinematic atmosphere, which is the same in both versions), so the location header and the system clock read crisply. An earlier build had a static ambient glow (`.dh-top-amb`, a blurred radial gradient); on iPhone it read as a haze washing out the header and the status bar, so it was removed.

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
