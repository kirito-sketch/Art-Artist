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
5. Events near you: a rail of poster cards (see below).
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

Behind the header and tiles: the cinematic atmosphere every Home has, plus the spotlight's current artwork blurred into a soft field of its colours. It crossfades as the spotlight moves, like District's banner-tinted header. (Chosen over a brand-green band and atmosphere-only; the drifting three-colour glow is removed.) Settings has a single Dark mode switch.

## Events near you

A rail of poster cards, up to five, your city first. Each card: an image with the date on it (the event's film, else the host's current project, else the host's own work), the type (and city when it is not yours), title, venue, day and time, price, and the speakers (or "By" the host). See all opens the Events page.
