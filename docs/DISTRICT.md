# District direction (Home and Discover)

A second version of Home and Discover, built for comparison. Everything else in the app is shared and unchanged.

| How | Effect |
| --- | --- |
| `?home=district` | The District Home and Discover on this device |
| `?home=current` | Today's Home and Discover (the default) |
| `/studio/compare` | Current and New as two live apps: show one, or both side by side, as any persona |

## Home (`src/screens/home/DistrictHome.tsx`)

1. Where you are: city, craft and languages, notifications, over a slow-moving wash of colour (still with Reduce Motion).
2. Tiles: Events, Projects, People, Opportunities, Reviews. Each opens a full page (`browse` route: today's Discover list for that category, with a back button).
3. In the spotlight: projects being made near you first, a centred carousel that moves every few seconds and stops when touched. The centre card plays a muted clip (never with Reduce Motion, Save-Data or low power); faces are accepted credits; "Looking for" lists open roles.
4. New work in your craft: a mosaic of three posts, then "See more in Discover".
5. Events: Direction A (see below).
6. Out this Friday: one quote card per film released this week (score plus its featured review), side by side when there are several. Hidden in a week with no releases.
7. Continue where you left off: what you saved.
8. Picked for you: shelves built from rules (your craft's crew free this month in your city, crews forming, projects in your language). A shelf shows only with two or more items.
9. Near you: people in your craft's crew, in your city.
10. "You're up to date." with the tiles as links.

No task strip, no "Your people", no explanatory copy.

## Discover (`DiscoverScreen` variant `district`)

A search bar with Saved beside it, and the grid of work. Searching covers people, projects and roles; "See all" opens the category page.

## Reviews (`src/screens/reviews/ReviewsScreen.tsx`)

The real review system (docs/REVIEWS.md): Out this Friday, Top rated, and Recent reviews. The same page is the "See all" from the current Home's Out this Friday section.

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

## Events (Direction A)

One large event and two rows, all visible, nothing moves. Chosen for the person by `domain/eventRank.ts` (city, craft, network, followed houses, date, newness; one per organiser, two per type) and fixed for the session. Titled "Events near you" when the large event is in your city, otherwise "Events coming up". See all opens the Events page. Rules: docs/REVIEW_EVENTS_PROFILE.md §1 and §2.


## Settings

Appearance is Light / Dark / System, inline in Settings (one tap each, no separate page). Switching opens the new theme as a circle from the button tapped. Under Reduce Motion it switches without the animation.
