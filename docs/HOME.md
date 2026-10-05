# Home (fixed frame, composed middle)

Product spec: *Art and Artist Home Direction*, version 2 (https://claude.ai/artifact/GmcWnvH51YewrLGJCk6QPS).
Plan: `docs/plans/2026-10-03-home-and-events.md`.

## Switch

The new Home is built but is **not the default**. Today's Home (`src/screens/home/HomeScreen.tsx`) is untouched.

| How | Effect |
| --- | --- |
| `?home=next` | New Home on this device (stored in `localStorage['aa-features']`) |
| `?home=current` | Back to today's Home |
| `?next` | New Home (Events are on by default anyway) |
| `/test` | Assigned per session, 50/50, for the comparison study only (see `RESEARCH_TEST_MODE.md`) |

Code: `src/ui/features.ts` (`useFeatures`, `setFeatures`, `assignHomeArm`).

## Shape

A finite page. It has a beginning, a middle and an end.

1. **Header:** the logo and the bell. Search lives in Discover only (one tap away), so Home's top shows what's new for you rather than a tool.
2. **Lead:** one story. It is a project or a piece of work, **never a role**. Only high-significance items can lead.
3. **Personal news (optional):** one thing that happened to you, written as news ("Saffron Reel Studios added you to Kaaval as Director of Photography."). Never a count, never a queue. Decisions are grouped under "Needs you" in Notifications instead.
4. **Composed middle:** whatever the composer returns, from 3 to 8 units.
5. **The end:** "That's a wrap". A clapper claps once, the device works out today's golden hour for your city, and there are links into Discover. Refresh Home recomposes the page and shows a small "Take 2" slate.

## The composer (`src/domain/home/`)

Pure functions, unit-tested (`npm run test:unit`).

- `candidates.ts` turns the graph into candidates: project updates, people, posts, at most two roles, houses, a credit relation and events (when Events are on). Each candidate gets a significance and a reason.
- `significance.ts` decides what is eligible: high and medium only, from the last 7 days, above the quality bar. Low never reaches Home.
- `rank.ts` sorts by relationship, then significance, then professional fit, then place and language, then freshness.
- `compose.ts` applies the rules:
  - no two units of the same type next to each other;
  - at most one opportunity, never in the first two middle units;
  - caps per type (posts 2, everything else 1);
  - large and compact units alternate where possible;
  - no padding: a short Home is better than a weak one.
- `seen.ts` and `session.ts`: the page is composed once per session and stays stable. On the next session, things already seen are left out unless they changed materially. Urgent personal news can still enter a page that was already composed.

**Cold start** (a person with no graph yet) is sourced in this order:

1. craft and place: projects being made in your city, and one role in your craft;
2. other active projects;
3. people;
4. work;
5. local houses.

It always produces at least three units.

**First Home** (just signed up):

- at most five middle units (a newcomer has no network yet: fewer, better units);
- someone who chose "Find work" sees the role that fits them first in the middle, right after the lead;
- a welcome by name and the one next step (add stills, set availability or add a bio) sit under the lead, in place of a toast over the page. "Later" is kept for that account (`src/ui/learned.ts`).

**Each fact once** (docs/TEXT_LOAD.md): the lead doesn't repeat its stage tag, people cards show a reason only when it's about people you know (otherwise the city), the role row keeps City · Pay, and the end has no "You're up to date" line.

## Words Home never uses

No "This week", no "updated Monday", no edition language, no counts ("3 things need you"). A unit test checks this (`candidates.test.ts`).

## Research events

`home_unit_opened` (unit, position, whether it had a reason), `home_end_reached` and `home_refreshed`. (`home_search_opened` is kept in the taxonomy for sessions recorded before the search pill was removed.)

## Accessibility

- Every unit is a real button or link with a full accessible name.
- The clapper and the Take slate are decorative (`aria-hidden`) and stay still under Reduce Motion.
- axe: 0 violations on the top and the end of Home, in light and dark (`a11y/axe-next.cjs`).
