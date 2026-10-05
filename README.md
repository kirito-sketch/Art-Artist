# Ana · mobile prototype v2

A working prototype of Ana (Art & Artist), the professional platform for film and entertainment
professionals.

- Product reasoning: [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md)
- What was wrong with v1 and the rules v2 follows: [`docs/AUDIT_V1.md`](docs/AUDIT_V1.md)
- Images still to generate: [`docs/IMAGE_PROMPTS.md`](docs/IMAGE_PROMPTS.md)

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
```

On a desktop browser the app renders inside an iPhone frame. At phone width it runs full screen.
Personas, flows, test states, QA tools and the archive of earlier directions live in Studio:
`/studio` ([`docs/STUDIO.md`](docs/STUDIO.md)).

## Visual system

- **Neutral light.** White screens, iOS grouped grey for grouped rows, near-black text.
- **SF only** (Inter off Apple devices). Five sizes: 34 screen title, 22 section, 17 item and body,
  15 secondary, 13 meta. Two weights.
- **One accent** (blue) for links, the active state, unread and verified. Primary buttons are black.
- **Hairlines, not cards.** Only image objects and the profile card have a surface.
- **One badge per item.** Official vs peer shows as a verified production name vs a person's name
  and avatar.
- **Light floating pill** navigation: icons only, active is black with a dot, Create is the one
  filled control.

## Screens

| Screen | Structure |
| --- | --- |
| Home | Wordmark and bell · **For you** with availability · image cards (role, production ✓, place and dates) · From your network as one-sentence rows · two posts · end |
| Opportunity | Image · type · title · production ✓ · icon facts · About · Audition · You'll be asked · footer with pay, closing date and one action (Respond, Message, Show interest, Review) |
| Create | Sheet with three rows. Post composer: text, media, add to portfolio. Collaboration composer: cover, role as title, grouped rows, start/end timeline, allow messages |
| Discover | Search · Roles, People, Projects, Posts · filter chips and a filters sheet · craft icons for people · poster grid |
| Inbox | Filter chips · rows with project image, avatar, last message, context line, one suggested action · conversation with the context pinned on top |
| Profile | Credibility card (photo, verified, credits, years, works) · availability, base, languages, gear · about · showreel · credits · work · projects · posts · private activity behind the list icon |

## Images

Real photography lives in `public/images/`. Every media item names its intended file and a fallback,
so newly delivered images replace stand-ins with no code change. Contact sheets go in `design/sheets/`
and are cut with `python3 scripts/slice_sheets.py`. People without a headshot yet show a monogram.

## Scenarios (desktop panel)

Kiran (cinematographer) or Tara (actor) · New user · Slow network · For you fails · Offline · Posting fails.
