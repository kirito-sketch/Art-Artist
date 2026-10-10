# Ana Motion & Microinteraction System

Ana's motion has one personality: **tactile, calm, spatial**. Things behave like objects on a workbench. They press, lift, settle and stay where you put them. Motion exists to give feedback, keep objects continuous, show hierarchy, make a change understood, or carry Ana's identity at a few chosen moments. If it does none of these, it is not added.

Live review: open the prototype with `?motion` (internal, not in the stakeholder console). Tokens: `src/ui/motion.ts` and the `--dur-*` custom properties in `src/styles/expression.css`. Inventory data: `src/qa/motionInventory.ts`.

## 1. Principles

1. **Tactile.** Controls and cards compress under the finger and spring back; objects lift and cast a thinner shadow.
2. **Calm.** No bounce past rest, no idle loops, no spinning. A spring settles; it never wobbles.
3. **Spatial.** Where something comes from is where it returns to: the + opens Create, the tile opens the post, the card opens the role.
4. **Deliberate.** Nothing delays a task. Signature moments are under 0.9 s and never block input.
5. **Honest.** Motion never implies activity that did not happen: no fake loading, no invented content forming.

Principles taken from the 60fps.design references (morphing, shared elements, tactile tabs, spring response, sheet-to-page continuity, reveal hierarchy) are translated into Ana's own grammar: a green disc that becomes the Create surface, a contact sheet tile that becomes a post, a record that is stamped. No other product's animation is copied.

## 2. Intensity levels

| Level | Where | What |
|---|---|---|
| **1 Functional** | Almost everywhere | Press, focus, tab selection, sheets, button states, Follow, Save, filters |
| **2 Expressive** | Home, Discover, Profiles, Projects, Roles | Shared elements (tile → post, card → detail), section stagger, object lift, Create morph |
| **3 Signature** | Rare, earned moments | Onboarding → first Home, identity switch, Credit accepted |

## 3. Timing and springs

| Token | Value | Use |
|---|---|---|
| `dur.micro` / `--dur-micro` | 150 ms | Label swaps, fades, result changes |
| `dur.ui` / `--dur-ui` | 260 ms | Backdrops, crossfades, object lift, identity crossfade |
| `dur.editorial` / `--dur-editorial` | 420 ms | Record steadying, editorial reveals |
| `dur.signature` / `--dur-signature` | 650 ms | Upper bound for a signature step (whole moments stay under 0.9 s) |
| `ease.out` | cubic-bezier(0.22, 1, 0.36, 1) | Arrivals |
| `ease.inOut` | cubic-bezier(0.65, 0, 0.35, 1) | Drawing (the credit ring) |

| Spring | Stiffness / damping / mass | Use |
|---|---|---|
| `press` | 600 / 32 / 0.6 | Press and release of controls and cards |
| `snappy` | 520 / 38 | Indicators: underline, Follow width |
| `sheet` | 380 / 38 / 0.9 | Sheets and the Create surface |
| `push` | 360 / 40 / 1 | Screen pushes and shared elements |
| `settle` | 260 / 26 / 0.9 | Objects and marks settling (craft object, seal, identity slate) |
| `gentle` | 220 / 28 | Slow reveals |
| `mark` | 620 / 22 / 0.7 | A mark confirming itself (Save fill): one small overshoot, then still |

Press scales: controls 0.86–0.96, cards 0.97–0.985, save 0.8. Only transform and opacity animate (plus one colour on the Create surface); layout animations use framer-motion's transform-based projection.

## 4. Priority interactions (implemented)

| # | Interaction | Level | Why it moves | Behaviour | Reduced motion |
|---|---|---|---|---|---|
| 1 | **Bottom nav** | 1 | Place and feedback | No capsule: the active icon eases to its filled variant in green, lifts 1.5 px and scales to 1.05; label turns green and semibold; Profile's avatar gains a 2 px green ring. 190 ms ease-out, no overshoot, on the tap itself; press 0.94. Create never takes a tab state | No lift or scale; colour and fill change in 100 ms |
| 2 | **Create +** | 2 | Continuity with its origin | Green disc grows into the Create surface (shared layout, sheet spring, green → white); actions stagger 30 ms; closing returns into the + (× on deep green) | Surface fades in place |
| 3 | **Discover grid → post** | 2 | Object continuity | Tile image expands into the post media (shared element); stream fades in around it; back resolves into the tile; grid scroll and filter kept | Crossfade; scroll kept |
| 4 | **Card press** | 1 | Tactile feedback | 0.97–0.985 with press spring on interactive cards only | No scale |
| 5 | **Role → Detail** | 2 | The artwork anchors the role | Card artwork becomes the hero; the sheet rises 48 px after 60 ms. Only from Home cards (`from: 'card'`); other entries push as before | Fade |
| 6 | **Project → Detail** | 2 | Project stays one object | Poster still becomes the project hero (Home "Projects to watch") | Fade |
| 7 | **Follow** | 1 | Compact state morph | Label slides, check appears, fill turns tonal, width follows | Instant swap |
| 8 | **Save** | 1 | Self-confirming control | Compress 0.8, bookmark fills green and springs 0.5 → 1 (`mark`, one small overshoot; it used to wobble); `toggle` haptic; same on Posts, Roles and Projects; no toast (except a short "Saved to your account" while acting for a house) | Fill only |
| 9 | **Show interest** | 2 | Completion shown by the control | "Sending…" with spinner; the bar becomes "Interest sent ✓" in place; the generic toast was removed. Withdraw → "No longer interested" (Undo stays in the toast) | Short fades |
| 10 | **Identity switch** | 3 | You must know whose voice you use | Home fades up anew (0.985 → 1); profile-tab avatar morphs; a graphite slate rises above the tab bar naming who you act as, then leaves (1.6 s) | Fade, no travel |
| 11 | **Craft object** | 2 | Tactility; works with raster assets | Whole asset: lift 5–8 px, tilt −3 to −5°, scale 1.02–1.04, shadow thins, on hover/press/focus (260 ms). No idle loop, no spin, no scroll parallax on scrolling pages | Pinned at rest |
| 12 | **Onboarding → first Home** | 3 | "Ana has understood who you are" | Craft object arrives large from the centre and settles into the intro; kicker, title, line, call sheet rise in sequence; sections resolve at 80 ms steps (~0.8 s); once per person per session; real content only | Plain fade |
| 13 | **Credit accepted** | 3 | An official, permanent record | Spinner while accepting; the new credit poster steadies from a provisional dashed edge to solid; a ring is drawn, the verified mark settles into it, the ring falls away (~0.9 s). No confetti | Mark appears, no draw |

## 5. Rules applied to everything else

- **Header scroll:** primary headers are part of the page and scroll away; the bottom nav persists. Headers are sticky only where persistent controls are needed (Discover search and modes, the post stream's back bar).
- **Search and filters:** mode underline slides; chips press to 0.95; results fade and rise 6 px.
- **Sheets:** rise with the sheet spring and drag to dismiss, from the handle or from anywhere on the content once it is scrolled to the top; release past 110 px or a flick closes (`snap` haptic), otherwise it springs back. Create is connected to its control; simple confirmations stay plain.
- **Back:** pushed screens that slide in from the right also go back with a swipe from the left edge (24 px). The screen follows the finger, can be abandoned midway, and completes past a third of the width or on a flick (`snap` haptic); the revealed screen gets a soft edge shadow (`RouteLayer` in `src/App.tsx`).
- **Images:** fade in from the placeholder ground over 240 ms when they arrive; images already cached show at once (`Photo`, `materials.css`).
- **Portrait card → Profile:** pushes from the right. No shared element, because the card's still is credited work, not the profile hero.
- **Added to project (defined, not yet built):** the new row should fade and rise 8 px into "Projects you're on"; lighter than a credit, no mark.
- **Loading:** skeletons with one slow shimmer; expressive loading only for rare moments; no loops on empty states.

## 6. Shared elements

One owner per id at a time (`shared` in `motion.ts`). A grid tile claims its post's id only when pressed or focused, and keeps it so Back returns into it; no other tile carries one. The destination claims the id only when it was opened from that source (`from: 'card'`, or the tapped post), so a hidden tab's copy of the same artwork can never fly in. Scroll containers that hold shared elements set `layoutScroll`. The route layer fades instead of sliding when the artwork is the thing that moves.

## 7. Accessibility and reduced motion

`MotionConfig reducedMotion="user"` wraps the app and the motion review. Under the OS setting: transforms and layout travel are removed (framer), CSS transitions and animations are cut to 0.01 ms (`base.css`), object tilts are pinned (`!important` rest values), the Create row stagger and record steadying are off. Every state change still happens and is still stated in words: "Interest sent", "Following", "Acting for the house". Nothing important is conveyed by motion alone. The identity slate is a `role="status"` live region.

## 8. Performance

Transform and opacity only; no animated layout properties except through projection. No continuous effects on scrolling pages (the existing hero parallax is a single transform). Craft object motion is CSS on a single transparent raster or SVG, so a supplied WebP animates with no extra cost. Nothing loops while idle.

## 9. Haptics

One map, `src/ui/haptics.ts`. On the web only Android vibrates; iOS Safari has no vibration API, so the PWA is silent there and the native app maps each name to the platform engine (`docs/premium/NATIVE_MOTION_SPEC.md`).

| Name | Fires on |
|---|---|
| `toggle` | Save, Follow, Like |
| `select` | Changing tab |
| `snap` | A sheet dismissed by dragging; a screen swiped back |
| `success` | Interest sent; any success toast (credit accepted) |
| `error` | Any error toast (a failed action) |
| `lift` | Long-press picking up a photo to reorder |

Haptics confirm what the person did, never what the app did. They are not motion, so reduced motion leaves them on.

## 10. Performance findings (October 2026)

Measured on a production build with the CPU slowed 4× (`docs/premium/README.md`). Three things made taps drop frames, all fixed:

- **Cards re-read themselves on every render.** `PressCard` walked its text and computed styles after every render of anything, forcing a style pass across the app on each tap. It now does so only when its text changes.
- **Too many shared-element owners.** Every Discover tile and every Follow button was a framer-motion layout node, so each tap measured dozens of hidden elements. Tiles now claim their shared id on press; Follow animates its width only around its own toggle.
- **The post stream laid out every post at once** to scroll to the tapped one. It now renders the tapped post and its neighbours first and the rest after the opening settles, without moving the page.

Also: date labels reuse cached `Intl` formatters (`src/domain/dateFormat.ts`). What remains is architectural: one store context means every navigation re-renders the whole app. The native app should keep navigation state apart from data state.

## 11. Not done in this pass

- Layered, Rive or true 3D craft assets (reserved for specific future signature moments where they demonstrably add value).
- A shared element for Portrait → Profile (no honest shared object today; see §5).
- Motion inside Figma (the migration stays paused).
