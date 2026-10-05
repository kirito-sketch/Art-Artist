# Home (fixed frame, composed middle)

Product spec: *Art and Artist Home Direction*, version 2 (https://claude.ai/artifact/GmcWnvH51YewrLGJCk6QPS), refined by the District reference study (https://claude.ai/artifact/JgeyvhA8d1C9D316sXAP3M) and Pass 1 (October 2026).
Plan: `docs/plans/2026-10-03-home-and-events.md`.

## Switch

The composed Home is **the default** (October 2026). The earlier Home (`src/screens/home/HomeScreen.tsx`) stays only for `/test` comparison, internal QA and controlled validation.

| How | Effect |
| --- | --- |
| (nothing) | The composed Home |
| `?home=current` | The earlier Home on this device (stored in `localStorage['aa-features-v3']`) |
| `?home=next` | Back to the composed Home |
| `/test` | Assigned per session, 50/50, for the comparison study only (see `RESEARCH_TEST_MODE.md`) |

Code: `src/ui/features.ts` (`useFeatures`, `setFeatures`, `assignHomeArm`). The storage key moved to `-v3` so a "current" stored before the composed Home became the default isn't kept.

## Shape

A finite page. It has a beginning, a middle and an end.

1. **Header:** the Art and Artist mark, Search and Notifications. Search opens Discover with the search field already focused, so the keyboard is up (search itself lives in Discover).
2. **Lead:** the first story, the first world you enter. Media edge to edge carries most of the first screen; the words are only the title, one line of context and, when it answers "why is this relevant to me?", one reason. No badge, no button. It is a project or a piece of work, **never a role, a person, a house or an event**. Only high-significance items can lead.
3. **Personal news (optional):** one thing that happened to you, written as news ("Saffron Reel Studios added you to Kaaval as Director of Photography."). Never a count, never a queue. Decisions are grouped under "Needs you" in Notifications instead.
4. **Composed middle:** whatever the composer returns, up to 8 units (5 on a first Home).
5. **The end:** "You're up to date." and nothing under it but four ways into Discover: People, Projects, Roles, Houses.

## Objects on Home

Each object has its own visual language:

| Object | Weight | How it looks |
| --- | --- | --- |
| Project | immersive | The most cinematic: media first (moving media when there is some), then the title and one line. |
| Person | rail | Portrait-led cards in a row, a reason only when it's about verified work together. |
| Work (post) | media | The picture or clip carries it. |
| Production house | compact | Its identity, plus what it's making (picture, title, stage), unless that project is already on the page. |
| Project activity | compact | "In production": up to three updates with a thumbnail. |
| Verified together | compact | Two people from your world verified on the same project. |
| Opportunity | structured | Compact and structured on purpose: a small label, a small picture, City · Pay. The least dominant unit. |

## The composer (`src/domain/home/`)

Pure functions, deterministic, unit-tested (`npm run test:unit`). No machine learning.

- `candidates.ts` turns the graph into candidates: project updates, projects worth entering on their own, people, posts, at most two roles, houses and a credit relation. **No Events adapter feeds Home.**
- `significance.ts` decides what is eligible: high and medium only, from the last 7 days (the rolling pool), above the quality bar, never an excluded type. Low never reaches Home.
- `rank.ts` sorts by relationship, then significance, then professional fit, then place and language, then freshness.
- `compose.ts` places units. Hard rules:
  - never two units of the same type next to each other;
  - never two immersive units next to each other (the lead counts), at most one immersive unit in the middle, never above the fourth;
  - at most one opportunity, never in the first two middle units (it never reaches the first screen);
  - caps per type (posts 2, everything else 1) and per weight (at most two rails);
  - one story per project: a project in the lead or the middle doesn't come back in another unit, its role included;
  - excluded types (Events) never take a place and never change the order of anything else;
  - no padding: a short Home is better than a weak one.

  Preferences when several units fit: a different weight from the unit above and a type not yet on the page, then a different weight, then rank alone.
- `seen.ts` and `session.ts`: the page is composed once per session and stays stable. On the next session, things already seen are left out unless they changed materially. Urgent personal news can still enter a page that was already composed.

**Eligible types:** project, project activity, person (rail), work (post), production house, verified together, opportunity.
**Excluded:** events (not approved as Home content: never the lead, never a section, never ranked; they stay in Discover and on project pages), and anything low-significance (profile edits, follows, small metadata).

**Reasons** appear only when they answer "why is this relevant to me?": "3 people you've worked with are on this project", "Kiran from Fault Lines · S1 is on this project", "Worked with you on Kaaval", "Because you follow Meera", "Being made in Hyderabad". Never a bare city, never "You follow them", never a reason on every card.

**Quiet week:** nothing new in the window means a shorter page, never filler; below three units the cold-start sources top it up.

**Cold start** (a person with no graph yet) is sourced in this order:

1. place and language: projects being made in your city, then projects in a language you work in;
2. one role in your craft (placed third or lower, never the lead's own project);
3. other active projects;
4. people in your craft;
5. work;
6. a second local project, low on the page;
7. local houses.

It always produces at least three units when genuine content exists.

**First Home** (just signed up): at most five middle units, and a welcome by name with the one next step (add stills, set availability or add a bio) under the lead. "Later" is kept for that account (`src/ui/learned.ts`).

## Project page (`src/screens/org/WorkScreen.tsx`)

Opened from a Home card, the card's picture grows into the hero (shared `layoutId`), so the project stays one object. Order:

1. Media
2. Identity (title, format · stage)
3. About (logline)
4. People making it (accepted, production-issued credits only; an "added to project" link is private)
5. Work from the project (posts about it, then its other pictures)
6. Production house
7. Open roles, only if there are any. The page never leads with hiring.

Screenings (Events, behind their own switch) come after this order.

## Media fallbacks (`src/ui/ProjectMedia.tsx`)

The same component on Home and the project page:

1. **Video and images:** a muted clip that plays after half a second on screen, pauses off screen or under a covering screen, and never plays with Reduce Motion, Save-Data or low power (the picture shows instead). WebM first, MP4 for Safari.
2. **Images:** the hero picture, the rest in "Work from the project".
3. **One image:** the hero only.
4. **No media:** the house's title-card treatment (dark, accent rule, type). Never a grey box, a broken image or a made-up frame.

Missing still files fall back to shared covers, so pictures are de-duplicated by what actually loads.

There is no real footage in the prototype. The one clip (`public/video/standin-kaaval.*`) is a stand-in made from Kaaval's own stills to exercise the video path. It plays only when a Studio link asks for it (`?media=standin`), and the Studio notice says so.

## QA states (Studio)

`/studio` › Home states (rich week, quiet week, cold start, existing network, earlier Home) and Project page states (video and images, images only, one image, no media, with and without open roles). Review-only parameters: `state=quietWeek` (Home six days on), `open=work:<id>`, `media=standin`, `announce=kaal` (Konark shares Kaal before it has pictures).

## Words Home never uses

No "This week", no "updated Monday", no edition language, no counts ("3 things need you"). A unit test checks this (`candidates.test.ts`).

## Research events

`home_unit_opened` (unit, position, whether it had a reason), `home_search_opened`, `home_end_reached` and `home_end_exit` (which way into Discover). `home_refreshed` is kept for sessions recorded before Refresh was removed.

## Accessibility

- Every unit is a real button or link with a full accessible name.
- Clips are decorative (`aria-hidden`, muted) and never autoplay under Reduce Motion.
- With no media, the title card is an image with a name ("Kaal, no pictures shared yet") and the page's own title is kept for screen readers only, so it isn't shown twice.
