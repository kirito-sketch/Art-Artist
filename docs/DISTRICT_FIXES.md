# District version: what to fix before it becomes the app

Status: **approved and built** in the District version only (the current version is unchanged). See "What was built" at the end. It builds on docs/REVIEW_HOME_DISCOVER.md and assumes the District version is the direction. The District look stays: tiles, spotlight carousel, glow, varied shelves, Direction A events, Out this Friday. What changes is how it works.

## The problems, and the fix for each

| # | Problem today | Fix |
| --- | --- | --- |
| 1 | Discover has no way to switch type. Going from People to Opportunities means Back → Home → tile | **Chip row in Discover:** Posts · People · Opportunities · Projects · Events · Reviews |
| 2 | Each type has two destinations: a tile page and Discover | **Tiles open Discover** with that chip selected. Every "See all" on Home does the same. The separate tile pages go away |
| 3 | Home has no Opportunities section; the core job is buried in spotlight cards | **"Opportunities for you"** right after the spotlight, for people finding work. When you act for a house it becomes **"Your open roles"**: who has shown interest, and what needs you |
| 4 | Home ignores why you're here (current Home does use it) | **The section after the spotlight follows your intent:** Find work → Opportunities for you. Hire → People for your project. Collaborate → Collaborations and roles. Just exploring → New work |
| 5 | The spotlight is projects only and repeats what's below | **Spotlight redefined:** the few most relevant or time-sensitive things this week, mixed types, at most 2 of a type, one card the same for everyone in your city, and anything in it removed from the sections below |
| 6 | "Picked for you › Free this month" repeats "Camera crew near you" | **Remove "Picked for you".** "Available" becomes a marker on cards in People near you. Crews forming moves into Opportunities, and the language shelf is dropped |
| 7 | "New work in cinematography" is craft-only (filter bubble) | **"New work":** people you follow or worked with first, then your department, then wider |
| 8 | "Camera crew near you" is department-only | **"People near you":** your department first, then related departments, with the Available marker |
| 9 | Search is unclear: results push separate pages | **Search inside Discover, scoped to the chip,** with "Search all of Art and Artist". From Posts it searches everything. Your search text carries over when you switch chips |
| 10 | The craft logic is hard-coded in two places | **Taxonomy as data:** field → department → craft. Home labels ("Camera crew near you") and related crafts come from it |

## District Home, top to bottom (proposed)

| # | Section | Shape | How personal |
| --- | --- | --- | --- |
| 1 | Location header and glow | n/a | n/a |
| 2 | Tiles: Events · Projects · People · Opportunities · Reviews | grid (unchanged look) | Same for everyone; each opens Discover |
| 3 | In the spotlight | carousel (unchanged look), mixed cards, one label each | Light, plus one shared card |
| 4 | Completion prompt | one card, when due | Personal |
| 5 | **Intent section**: Opportunities for you / People for your project / Your open roles | 3 compact rows + See all | Strongly personal |
| 6 | New work | mosaic (unchanged look) | People you know first |
| 7 | Events | Direction A (unchanged) | Local |
| 8 | Out this Friday | quote cards (unchanged) | Same for everyone |
| 9 | People near you | grid, Available marker | Local, light craft |
| 10 | Continue where you left off | pills | Your history |
| 11 | End | chips | n/a |

Change in length: **Picked for you is removed and one intent section is added**, so the page has the same number of shelves, but each now does a different job. Nothing appears twice.

## Discover (proposed)

```
[ Search people, projects, events …   ] [Saved]
[Posts] [People] [Opportunities] [Projects] [Events] [Reviews]   ← scrolls if needed
  Posts: the grid of work (default), craft filter
  People / Opportunities / Projects / Events: today's lists and filters
  Reviews: Out this Friday, Top rated, Recent reviews
```

- Switching chips doesn't add to the Back history. Discover remembers the chip, scroll position and search while the app is open.
- Searching on a chip searches that type, with a first row "Search all of Art and Artist for '…'".
- Filters are remembered per chip.

## Spotlight rules (simple, testable)

- **Can appear, when it's time-sensitive:**
  - a role that fits your crafts and closes in ≤7 days or was posted in ≤3 days
  - a project that just changed stage, or is crewing in your city
  - new work from people you follow or worked with (≤3 days)
  - an event in the next 7 days
  - a film out this week
- **Ranked by:** relationship, craft fit (including related crafts), city, language, how soon or how new, and capped interest from others.
- **Variety:**
  - at most 5 cards
  - at least 2 different types in the first 3
  - at most 2 of any type
  - one per organiser
  - one card is the same for everyone in your city: the best item there regardless of craft
  - the team can pin one item nationally, never per craft
- **One label per card**, for example "Crew forming · needs a DoP", "New work · Vikram Sen", "Event · Sat, Hyderabad" or "Out this week · ★ 4.1".
- **Fixed for the session.** It recalculates daily or after a save, follow or block.
- **Anything in it is removed from the sections below.**

## Not changing

The District look, the motion (the spotlight is the page's one moving element), Direction A events, Out this Friday, the glow, the theme options, the profile system, events V1, and every frozen rule.

## What was built

| # | Fix | Where |
| --- | --- | --- |
| 1, 2, 9 | Chip row, Posts default; tiles and See all open Discover on a chip; scoped search with "Search all"; query carries over; no Back step for chips; the `browse` route and its pages are removed | `DiscoverScreen` (variant `district`), `App.tsx`, `domain/contentTypes.ts` |
| 3, 4 | Intent shelf after the Spotlight and the completion prompt | `IntentShelf` in `DistrictHome.tsx` |
| 5 | Spotlight rules, ranking and variety, one card per city for everyone, optional national pin, one label per card, fixed for the session, removed from the shelves below | `domain/spotlight.ts` (+ tests), `screens/home/districtFeed.ts` |
| 6 | Picked for you removed; Available marker on People near you | `DistrictHome.tsx` |
| 7 | New work: people you know, then your department, then everyone | `DistrictHome.tsx` |
| 8 | People near you: department, then neighbouring departments | `DistrictHome.tsx`, `data/taxonomy.ts` |
| 10 | Taxonomy as data; content-type registry | `data/taxonomy.ts`, `domain/contentTypes.ts` |

Notes and conflicts:

- **Acting for a house.** Home while acting for a house is the shared production Home (`ProductionHome`) in both versions, and it already leads with open roles and interest received. So "Your open roles" is that Home, not a new District shelf. No frozen rule is affected.
- **Grow my network** has no intent shelf (the plan named four intents). New work is next on the page for it, as for Just exploring.
- **National pin** is supported (`SPOTLIGHT_PIN` in `districtFeed.ts`) and unset in the prototype.
- **"Just changed stage"** reads the seeded project updates (a stage change in the last 72 hours). A project far from you is there for its stage change and says "Now shooting"; one crewing in your city says "Crew forming · needs a …".
- **Recalculation.** The Spotlight is cached per person per day and recalculated after a save, follow or block, never while it's on screen. The prototype has no "release out this week" pin from the team; releases compete like any other card.
