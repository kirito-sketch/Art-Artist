# Implementation plan: October 2026 redesign

Built top-down: each layer only uses what the layers above it produced, and nothing a lower layer does changes a higher one. Decisions are locked first, then tokens, then components, then screens, then behaviours, then motion, then one verification pass. Source of truth for every decision: `README.md`, `DISTRICT_SECTIONS.md` in this folder.

## Layer 0: Decisions (locked before any code)

| Decision | Choice |
|---|---|
| Ground and cards | `#F3F3F5` for both ground and cards (Arun, round 5: the difference was still too visible); a hairline and a very soft shadow mark the card; gradient sections to `#DEDDE0` |
| Text | `#06141B` ink, `#4A5C6A` secondary |
| Accent | **Slate** `#253745` for fills, text and icons; amber dropped (Arun: "I don't like the yellow"); dark mode uses light slate `#E8ECEC` / `#CDD2D4`. Colour in the app comes from imagery, the pastel tiles and the signature gradient; a single chromatic accent can be reconsidered at Checkpoint B |
| Buttons | Primary solid ink; signature gradient lavender `#E3DEF5` → blush `#F6DCD9` (Continue, Show interest, Accept credit, Publish only); secondary light grey fill; tertiary text |
| Dark mode | Neutral graphite, no blue: ground `#0F0F11`, cards `#17171A`, fills `#212125` to `#2B2B30`, type `#F2F2F3` / `#A4A4AA` (changed 11 Oct 2026; the client's navy dark grounds were dropped) |
| Errors | `#D83A2E` |
| Interface font | Plus Jakarta Sans (free; friendly, geometric, close to District and Airbnb) |
| Editorial font | Instrument Serif (free), editorial moments only: text-post tiles, celebration headline, guide cards, first-run lines |
| Type scale | 24 screen title · 18 section · 15 card title · 14 to 15 body · 12 to 13 meta; weights 400, 500, 600 only; normal letter spacing; 12 px heading to content; 32 px between sections |
| Labels | Sentence case, never all-caps letter-spaced |
| 3D icons | Discover tabs and Explore by craft reuse the craft-object style; missing icons are made as matching raster placeholders, replaceable by commissioned art without code changes |
| Film Talk quote | People you follow first, else anyone |
| Celebration posts | Accepted credits on public projects only; "Share with your network" on by default at accept |
| This week | Auto-advances; no button; pauses on touch, stops after a swipe, off for reduced motion |
| Discover default | New "All" overview |

## Layer 1: Foundation tokens (one global pass)

1. Colour tokens, light and dark, replacing the teal-green and beige.
2. Fonts loaded; type scale and weights as tokens; every one of the 62 font sizes snapped to the scale.
3. All 28 uppercase letter-spaced rules removed.
4. Radii and elevation from `docs/premium/VISUAL_MATERIALS.md`; the 93 one-off shadows mapped to the five levels.
5. Button system (primary, signature, secondary, tertiary) in the one Button component.

**Checkpoint A (Arun):** screenshots of Home, a profile and Discover in the new foundation. The only point where colour or type is cheap to change. After approval, Layer 1 is frozen.

## Layer 2: Shared components (each built once)

Section header (title, subtitle, round arrow) · media card (Airbnb style, badge pill, save) · poster card with per-item state · person card (portrait breaking out of a gradient card, three stats) · collection card (themed, four rows, pages sideways) · gradient object tile and banner · editorial card · post tiles for each type (image, image and text, video, video and text, text, several images) · masonry layout · rail (snap, momentum, auto-advance without a button) · raised 3D-icon tabs with pressed state · unified share sheet · sticky action bar · icon fact row · show-more truncation · celebration card.

## Layer 3: Screens (assembled from Layer 2, no new styling)

- **Home:** new section order; This week rail; Explore by craft; People near you; Coming soon; Film Talk (one card per film, inline stars); From your network (merges New work); crews and houses by theme; events as posters; new end of Home.
- **Discover:** search pill; tabs with All; All overview of titled rails; Posts as masonry by type.
- **Profile:** one layout for own and others; summary card; credits moment and rail; facts as icon rows; About and skills truncated; reviews rail; worked-with row; owner tools moved to the header; pending-credit banner; sticky bar (Follow and Message, or Edit).
- Detail screens pick up the new components and buttons without separate work.

**Checkpoint B (Arun):** the three screens end to end.

## Layer 4: Behaviours

Celebration post (created on accept for public projects, waits for private ones, consent toggle, Congratulate, grouping) · share sheet sends a real message with a preview card · Film Talk star tap opens the review sheet pre-filled.

## Layer 5: Motion

First-run sequence (Wabi and Atlys direction) · tab bar picks up the colour of the centred card · trailer plays in the centred Coming soon card · celebration seal and light sweep.

## Layer 6: Verify once

Typecheck, unit tests, all regression suites (updated where text or structure changed), accessibility and contrast, reduced motion, dark mode, screenshots, PLAN and docs, commit and push.

## Working rules

- One commit per layer step; the full regression runs at the end of each layer, not after every change.
- No layer reopens an earlier one; if a later layer exposes a gap, it is fixed inside the component that owns it.
- Arun reviews at the two checkpoints only, from screenshots.
