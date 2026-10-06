# Living Background

**Decision:** Cinematic atmosphere (formerly direction B) is the background behind Home, in both versions (current Home and the District direction). It is always on in the normal app, never on `/test`, `/research` or the internal pages (`useAtmosphere()` follows `isThemedSurface()`). The setting "Background (experiment)" and directions A, C and D are removed. The rest of this document is the original exploration, kept for the record.

- Component: `src/ui/ambient/LivingBackground.tsx`
- Device checks (low power, reduced motion): `src/ui/ambient/ambient.ts`
- Styles: `src/styles/ambient.css`

## Theme switch

Changing the theme opens the new theme as a circle from the control that was used (View Transitions API, `src/ui/theme.ts`), in both versions. Without View Transitions support, or with Reduce Motion, it falls back to the short crossfade (or none). The current version keeps Settings › Appearance (System, Light, Dark); the District version has a single **Dark mode** switch in Settings.

## 1. Audit: where atmosphere helps and where it distracts

| Surface | Verdict | Why |
|---|---|---|
| **Home** | Helps (test surface) | Long, mixed page with large quiet gaps between sections. The gaps read as empty paper today; light there gives the page a sense of place without competing with the cards |
| Splash → first Home | Helps | The atmosphere fades in (1.6 s) after the splash leaves, so launch feels like the scene arriving rather than a page loading. Dark ground matches the splash exactly (#121110); in light, the splash is #fff and Home is #f6f4f0 (unchanged by this work) |
| Profile (person and house) | Helps, later | The hero already carries the image. Atmosphere would only suit the area below it, tinted by the profile's work (see §4) |
| Project / Role detail | Helps, later | Same: the key art is the hero; a tint drawn from it could carry down the page |
| Discover grid and post stream | Distracts | Wall-to-wall photography. Any atmosphere sits behind images and only adds noise at the edges |
| Inbox, conversation | Distracts | Reading and writing surfaces need a still, even ground |
| Create, sheets, forms, Settings | Distracts | Task surfaces. Movement behind a form reads as instability |
| Credit accepted, onboarding finish | Possible accent | Rare signature moments could use a brief lift in light; not part of this pass |
| `/test`, `/research`, internal tools | Never | Research must not change, and the tools are working surfaces |

Rules the component already follows because of this audit:
- It sits **behind** the screen, never inside the scroller, so scrolling costs nothing extra.
- **Content first:** when large imagery fills the viewport, the atmosphere steps back (`--ambient-presence` 1 → 0.8 → 0.55, faded over 900 ms). On Home this happens at the top (the featured role and project art) and returns to full as you scroll into the text sections.
- Cards, images and text keep their own grounds; only the page ground becomes transparent.

## 2. The three variants

### A · Ambient light

**What it is.** Light falling on paper. A large warm-white daylight from the upper left, a cool skylight shade on the right, and a faint trace of the brand green low on the page. The lights drift very slowly, so the room feels lit rather than decorated.

**Implementation.** Three `<span>` lights in one depth wrapper. Each is a `radial-gradient(closest-side, colour, transparent)` drawn at 46% width and scaled 2.3–2.8×. Idle motion is CSS keyframes on `transform` only, with durations of 53 s, 79 s and 107 s (no common factors) and `alternate` direction, so the combined image never visibly repeats. Scroll moves the wrapper at 12% of content speed.

**Light / Dark.**
- Light: near-white warm light (`rgba(255,253,248,1)`), cool shade (`rgba(192,205,219,.62)`), green at 9%. It reads as gentle illumination, not colour.
- Dark: charcoal with a soft amber glow (17%), brand green (28%) and a cool blue (14%). The most colour of the three in dark, still well below the content.

**Reduce Motion.** Same composition, held at its resting pose: no drift, no scroll depth.

### B · Cinematic atmosphere

**What it is.** A lit set. One warm key light from above left, one cool bounce low right, a fine film grain and a soft vignette. It is the most "photographic" of the three and gives Home a cinematic depth.

**Implementation.** Two lights (52% width, scaled 2.4–2.6×, 61 s and 83 s) in a wrapper moving at 10% of scroll. The grain is a 96 px tile of luminance noise generated once per page on a canvas (a few KB data URL, cached), tiled over the screen at 4–4.5% opacity and drifting 18 px over 173 s, so it never flickers or "boils". The vignette is a static radial gradient.

**Light / Dark.**
- Light: warm key (`rgba(255,249,236,1)`), sage bounce, grain at 4%, a warm-brown vignette at 11%. Paper gains texture and a slightly warm, lit centre.
- Dark: amber key at 18%, green bounce at 22%, grain at 4.5%, vignette to black at 60%. The most dramatic in dark: the edges fall away and the centre of the page feels lit.

**Reduce Motion.** Lights, grain and vignette stay, all still. No scroll depth.

### C · Depth field

**What it is.** Space rather than light. Three wide, soft bands of tone at different distances (far, mid, near) that move at different speeds when you scroll, so the page has layers behind it. Idle motion is the slowest and smallest of the three.

**Implementation.** Three depth wrappers moving at 4%, 9% and 16% of scroll, each holding one wide elliptical gradient plane (140–160% width, rotated a few degrees). Idle motion is 97 s, 127 s and 151 s on transform. The effect is mostly felt while scrolling (parallax between planes); at rest it is the quietest variant.

**Light / Dark.**
- Light: a white far band, a warm sand mid band (`rgba(214,199,176,.7)`), a sage near band. Visible as gentle tonal bands rather than lights.
- Dark: warm far band (12%), green mid (26%), cool near (12%). Subtle; it reads as depth in the darkness more than as colour.

**Reduce Motion.** Planes still, no parallax between layers. At rest it looks almost the same as when moving.

### D · Silk light

**What it is.** Added after a reference recording: a wash of colour anchored to the top of the screen, crossed by slow folds of light like silk, falling away into the ground by mid-screen. A to C are atmospheres you feel; D is colour you see at once. It uses a blue-hour indigo, the same family as the reference. The brand green was tried first and dropped: the green controls (Find work, the + button, Follow, unread dots) sank into a green wash, and a large green field reads as finance or health rather than film. Blue keeps the controls distinct and sets the warm, golden-hour photography against a cool ground (the familiar cinema grade). Tungsten, oxblood and graphite were also compared: tungsten merged with the warm photos, oxblood sits near error colours and turns pink in light, graphite lost the visible colour.

**Implementation.**
- One depth wrapper (72% of the screen tall, moving at 35% of scroll, so the wash lingers behind the header and then leaves).
- Inside it, a top-down colour wash with a static mask that fades it to nothing by the bottom of the wrapper.
- Four folds: bands 220% wide, rotated between -31° and 14°, each a soft linear gradient of trough, ridge, sheen and ridge. Where they cross they read as folded fabric.
- Folds move on transform only (translate, rotate a few degrees, scale up to 1.12) over 19 s, 26 s, 33 s and 41 s. That is faster than A to C so the movement is noticeable, as in the reference, while still never looping visibly.
- Unlike A to C, D does not step back over imagery: the wash sits behind the header, above the photographs, so it stays at full strength.

**Light / Dark.**
- Light: a cool blue mist (17%) with white ridges and sheen, like pale silk at dawn.
- Dark: deep indigo (74%) fading into charcoal, with periwinkle ridges (32%), a soft pale-blue sheen (26%) and dark troughs. Closest in feel to the reference.

**Reduce Motion.** The wash and folds stay, still. No parallax.

**Verified.**
- axe clean in Light and Dark.
- Reduce Motion and low power hold it still.
- Paused when Home is not the active tab.
- Never on `/test` or `/research`.
- 0 page errors.

## 3. Performance

| Measure | Result |
|---|---|
| Scroll, unthrottled, DPR 2, all 8 combinations (Off, A, B, C × Light, Dark), 3 runs of 3 s each | 59.3–60 fps; p95 frame 16.7–16.8 ms; at most 2 frames over 25 ms in one run (B light, first run only), the same as Off within noise |
| Layout and style recalculation during scroll | 0 layouts, 0–2 style recalcs in every case (the scroll handler writes only `transform`) |
| Scroll, 4× CPU throttle, DPR 3 | 14–20 fps in **every** case, Off included. The container renders in software with no GPU, so this run cannot separate the variants; it does show the variants add nothing measurable on the main thread |
| DOM cost | A 4 nodes, B 5, C 6, D 6 |
| Idle | All idle motion is CSS on transform, so the compositor runs it without JavaScript or repaint |
| Page errors | 0 in all combinations |

Why it is cheap:
- Only `transform` and `opacity` change. Lights are drawn small and scaled up, so their GPU textures stay small (soft gradients lose nothing when scaled).
- One passive scroll listener and one `requestAnimationFrame` write per frame per depth wrapper (1 for A and B, 3 for C).
- The layer has `contain: strict` and `pointer-events: none`.
- The presence check uses an IntersectionObserver plus a MutationObserver, so nothing is measured per scroll frame.

Relative costs worth knowing (none measurable in this container, so check them on a device):
- **B** paints the most pixels: a full-screen tiled grain layer plus the vignette over the lights. It is the variant to watch on older phones.
- **C** has three scroll-driven layers instead of one.
- **A** is the simplest.

**On a real device:** Safari on an iPhone 11-class phone is the honest test (Web Inspector › Timelines › Rendering Frames, scrolling Home with each variant).

## 4. Device states

| State | Behaviour | Verified |
|---|---|---|
| **Reduce Motion** (OS setting) | Same composition, still: every ambient animation is `none`; scroll depth off | A, B, C: 0 running animations, depth transform `none`, no errors |
| **Low power** | Same still composition (`is-still`) | Forced with Save-Data: A, B, C all `is-still`, 0 running, depth off |
| **Tab not active** (Home hidden behind another tab) | Animation paused (`.tab-layer[inert]`) | A, B, C: 0 running after switching to Discover |
| **Large imagery on screen** | Atmosphere opacity 0.55 / 0.8 / 1 | On Home: 0.55 at the top (featured art), 0.8 at 800 px, 1 from 1200 px on |
| `/test`, `/research`, `?test=` | Never rendered | 0 `.ambient` nodes |

**Low power, honestly.** iOS does not tell a web page about Low Power Mode. The component uses what can be measured:
- **Save-Data.**
- **The Battery API**, where it exists (Chrome on Android, not Safari): 20% or less and not charging.
- **The frame rate the page actually gets:** after the page settles it samples one second of animation frames, and below 40 fps holds the background still. Low Power Mode and hot or weak devices both throttle frames to about 30, so this catches them indirectly.

It measures once per session, so a device that enters Low Power Mode mid-session keeps moving until the next launch.

## 5. Readability

axe (WCAG 2.0/2.1 A and AA) on Home at three scroll positions for all 8 combinations: **0 violations** in every case. All lights sit behind cards, images and text, and the strongest light value is in the ground colour range already used by the theme.

## 6. Architecture for later

- **Contextual tint.** `LivingBackground` takes a `tint` prop (it sets `--ambient-tint`; not yet used by any variant). On Profile or Project it could be fed by `useImageTint` (already in `src/ui`) from the hero image, so the atmosphere below a project's key art carries its colour. The variants would mix `--ambient-tint` into one light.
- **Reuse.** The component needs only a parent with `position: relative` and the screen's scroll element (`scrollRef`). To place it on another screen: render it as a sibling before the screen, add `has-ambient` to make the ground transparent, and add one line to `ambient.css` for that screen's ground.
- **Splash connection.** The ambient layer's own ground is `var(--base)`. Its lights fade in with `ambient-in` (1.6 s, `backwards` fill), so after the launch splash the scene arrives first and then settles. The splash itself is unchanged and is not replayed on resume (`launchSession.ts`).
- **Not done (by design):** propagating any variant beyond Home, particles, cursor-follow, 3D tilt, or any looping decoration on other screens.

## 7. Where to test each variant

| Variant | Best place to judge it | What to look for |
|---|---|---|
| A · Ambient light | Home, scroll slowly from "People in your world" to "Posts in cinematography"; stay still for 30 s on "Waiting on you" | Do the gaps between sections feel lit? Is the drift noticeable only when you look for it? |
| B · Cinematic atmosphere | Home in **Dark**, at the "Waiting on you" section; then the same in Light | Grain: felt or seen? Does the vignette help focus or feel heavy around the tab bar? |
| D · Silk light | Home in **Dark**, at the top; watch for 20 s, then scroll down | Does the colour at the top feel like the reference? Does it leave gracefully as you scroll? Header text stays readable over the sheen? |
| C · Depth field | Home, flick-scroll the whole page, then stop | Do the layers separate during scroll and settle afterwards? Is it too quiet at rest? |
| All | Launch the app fresh (close the PWA, reopen) | Does the atmosphere arriving after the splash feel like one motion? |
| All | Turn on Reduce Motion (iOS Settings › Accessibility › Motion) | The still version should still look intentional |
| All | An older phone, with Low Power Mode on | It should hold still and scroll should stay smooth |

Screenshots of each variant in Light and Dark, at the top of Home and scrolled, were delivered with this change.

---

# Premium interaction layer: opportunities

An audit of what exists and where the next layer would add the most. Nothing below is implemented yet; the direction is to be chosen first. The constraints stand: no rolling numbers, confetti, particles, 3D tilt, excessive bounce, cursor-follow, or decorative animation everywhere. The existing system is in `docs/MOTION_MICROINTERACTION_SYSTEM.md` (springs in `src/ui/motion.ts`).

## A. Press states

| Today | Opportunity |
|---|---|
| `Pressable` and `PressCard` compress with a spring (controls 0.86–0.96, cards 0.97–0.985); chips 0.95; `.btn--primary:active` darkens; images in pressable cards dim | 1. **Unify the release.** Some surfaces use CSS `:active` (instant) and others framer `whileTap` (spring). Move the CSS-only ones (`.object-tile`, `.section-link`) onto the same press spring so every touch has the same feel. |
| Rows press 0.99 | 2. **Press tint for rows and list items.** A 4–6% ink wash on press (not just scale) reads better on flat rows where 0.99 is invisible. |
| Tab bar items press 0.94 | 3. **Press delay on scrollable cards.** Apply the compression after ~60 ms of no movement so a scroll that starts on a card does not flash a press (the common "jelly" feel on feeds). |

## B. Haptics

There are no haptics today (no `navigator.vibrate` anywhere).

**Platform limit.**
- **iOS Safari and iOS PWAs:** no web vibration API. iOS 18 adds one honest route: a light system tick when an `<input type="checkbox" switch>` is toggled.
- **Android Chrome:** supports `navigator.vibrate`.
- So a plan has to be progressive: semantic calls that do the best each platform allows, and nothing where it cannot.

| Semantic | Pattern (Android) | Use for |
|---|---|---|
| **Soft** | 8 ms | Tab change, chip and segmented control selection, Save, Follow, toggles |
| **Medium** | 14 ms | Create opening, sheet snapping to a detent, pull-to-dismiss commit, long-press menus |
| **Success** | 10, 40, 16 ms | Interest sent, credit accepted, post published, account switch complete |
| **Error** | 24, 50, 24 ms | Failed send, blocked action, form submit with errors |

Proposed:
- One `haptic(kind)` helper in `src/ui/haptics.ts`.
- It does nothing under a "Haptics" setting turned off (Settings › Appearance or Accessibility), under Save-Data, or on platforms without support.
- On iOS it can use the switch-input tick for on/off toggles only.

Never on scroll, never on every tap, never repeated.

## C. Shared elements

**Existing:**
- Create + → Create surface.
- Discover grid tile → post stream.
- Home role card art → Role detail hero.
- Project poster → Work hero.
- Tabs underline.
- Identity avatar morph.

| Candidate | Value | Note |
|---|---|---|
| **Saved grid → post / role / project** | High | Same objects as Discover and Home; the ids already exist (`shared.post`, `shared.role`, `shared.work`). Saved would only need to claim them with `from` |
| **Profile portfolio tile → work** | High | Portfolio stills are credited work; the work hero is the same image |
| **Inbox avatar → conversation header** | Medium | Small object, clear continuity; cheap |
| **Notification row → its target** | Low | Mixed targets; a push is clearer |
| Portrait card → Profile | Not recommended | Still not an honest shared object (the card shows credited work, not the profile hero) |

## D. Skeletons

Today `PageSkeleton` (in `src/ui/PageStates.tsx`) is used by Org and Work only, through `useLoad`. Elsewhere data is local and instant.

To be ready for real data, the order would be:
1. **Home** sections: card-shaped skeletons matching each section's real geometry.
2. **Discover** results and the grid: tile-shaped.
3. **Profile** below the hero: rows and the credits list.
4. **Inbox** list: avatar and two lines.

Rules:
- The skeleton must match the final layout exactly, so content does not shift.
- One slow shimmer (≥1.6 s), and none under Reduce Motion.
- Only appear after 300 ms (no flash on fast loads).
- Crossfade to content in 200 ms.
- Images get a tonal placeholder from their dominant colour (`useImageTint`) rather than grey.

## E. Micro-interactions worth adding

| Moment | Proposal | Level |
|---|---|---|
| **Image arrival** | Photos fade in from their tonal placeholder (180 ms) instead of popping | 1 |
| **Pull to refresh on Home** | A restrained resistance and a single settle, with Medium haptic on commit | 2 |
| **Sheet detents** | Snap with the sheet spring plus Soft haptic at each detent | 1 |
| **Unread dots** | Fade out when read (not instant) | 1 |
| **Inbox send** | The bubble rises from the composer (8 px, 160 ms); Error haptic and inline retry on failure | 1 |
| **Availability change** | The status dot crossfades colour on the profile and tab avatar together | 1 |
| **Copy link / share** | The icon morphs to a check for 1.2 s in place; no toast | 1 |
| **Long press on a post or card** | Lift 1.02 with a shadow, Medium haptic, quick-action menu | 2 |

Each would follow the existing rules: transform and opacity only, one owner per shared id, a stated text equivalent for every state, and a Reduce Motion fallback that keeps the state change.
