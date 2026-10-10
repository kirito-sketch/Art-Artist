# Motion spec for the native app

One entry per interaction, in the order people meet them most often. Written for the React Native (or Flutter) team building the live app. The prototype is the reference: open it, do the interaction, then read its entry here. Recordings of each one are in `docs/premium/recordings/` (captured from the prototype; the native version should match or beat them). Where this spec asks for more than the prototype does, the entry says "native only".

Background: `docs/MOTION_MICROINTERACTION_SYSTEM.md` (principles, levels), `docs/premium/VISUAL_MATERIALS.md` (shadows, glass, radii, type). External reference for the bar we're aiming at: [60fps.design](https://60fps.design) (shared elements, sheets, tactile controls, gesture-driven navigation). Use it to judge quality, not to copy.

## Four rules every interaction meets

1. **Instant.** Visible feedback starts on touch-down, in the same frame. Never wait for data, a network call or a layout pass before reacting.
2. **Continuous.** Things move from where they are, to where they're going, from where they came. Nothing teleports, nothing restarts.
3. **Interruptible.** Any animation can be grabbed or reversed mid-flight and carries its current velocity into the new motion. This is why we use springs, not fixed curves, for anything physical.
4. **60 fps on a mid-range Android** (and 120 on ProMotion iPhones). Animate transform and opacity only, on the UI thread (Reanimated worklets / Flutter's raster thread). Test on a real mid-range Android, not a simulator.

## Springs

Values are stiffness / damping / mass. React Native Reanimated `withSpring({ stiffness, damping, mass })` and Flutter `SpringDescription(mass:, stiffness:, damping:)` take them as they are. SwiftUI and Compose equivalents are given for anyone prototyping natively.

| Token | Stiffness / damping / mass | SwiftUI `spring(response:dampingFraction:)` | Compose `spring(dampingRatio, stiffness)` | Use |
|---|---|---|---|---|
| `press` | 600 / 32 / 0.6 | 0.20, 0.84 | 0.84, 1000 | Press and release of controls and cards |
| `snappy` | 520 / 38 / 1 | 0.28, 0.83 | 0.83, 520 | Indicators, Follow width |
| `sheet` | 380 / 38 / 0.9 | 0.31, 1.03 | 1.03, 422 | Sheets, Create |
| `push` | 360 / 40 / 1 | 0.33, 1.05 | 1.05, 360 | Screen push, shared elements, swipe-back settle |
| `settle` | 260 / 26 / 0.9 | 0.37, 0.85 | 0.85, 289 | Objects settling, the credit seal |
| `gentle` | 220 / 28 / 1 | 0.42, 0.94 | 0.94, 220 | Slow reveals |
| `mark` | 620 / 22 / 0.7 | 0.21, 0.53 | 0.53, 886 | Save fill, Like heart: one small overshoot |

Fades use durations: 150 ms (micro), 260 ms (UI), 420 ms (editorial). Ease out `cubic-bezier(0.22, 1, 0.36, 1)`.

## Haptics

| Name | When | iOS | Android |
|---|---|---|---|
| `toggle` | Save, Follow, Like took effect | `UIImpactFeedbackGenerator(.light)` | `KEYBOARD_TAP` |
| `select` | Tab or chip changed | `UISelectionFeedbackGenerator` | `CLOCK_TICK` |
| `snap` | Sheet dismissed or screen swiped back past the threshold | `UIImpactFeedbackGenerator(.medium)` | `GESTURE_END` |
| `success` | Credit accepted, interest sent | `UINotificationFeedbackGenerator(.success)` | `CONFIRM` |
| `error` | An action failed | `UINotificationFeedbackGenerator(.error)` | `REJECT` |
| `lift` | Long-press picks an item up to reorder | `UIImpactFeedbackGenerator(.rigid)` | `LONG_PRESS` |

Haptics confirm something the person did; never fire one for something the app did on its own (a new message arriving, a refresh). Respect the system haptics setting and offer an off switch in Settings. In the PWA they fire on Android only (iOS Safari has no vibration API); `src/ui/haptics.ts` holds the map.

## Interactions

Frequency is how often an active person does it in a typical session (estimated from the research tasks and the app's structure).

### 1. Scroll a feed  · constant

- **Feel:** follows the finger exactly; momentum and edge bounce are the platform's own.
- **Do:** use the platform list (FlashList / `ListView.builder`), recycled cells, images decoded off the main thread at display size.
- **Don't:** run JavaScript per scroll frame; parallax anything except one hero image (a single transform).
- **Headers:** primary headers scroll away; only Discover's search bar and a post stream's back bar stay pinned.
- **Reduced motion:** unchanged.

### 2. Images arriving · constant

- **Feel:** a calm fade from the placeholder colour, never a pop or a layout jump.
- **Spec:** the frame is sized before the image loads (aspect ratio from the media record), filled with the surface's placeholder colour (or, when the server sends one, a dominant-colour or blurhash placeholder). On decode: opacity 0 → 1 over 240 ms, ease out. Images already in memory show with no fade.
- **Prototype:** `Photo` in `src/ui/primitives.tsx` + `materials.css`.
- **Reduced motion:** no fade.

### 3. Press any control or card · constant

- **Feel:** compresses under the finger, springs back on release.
- **Spec:** scale on touch-down with `press`: buttons 0.96, icon buttons 0.90, cards 0.97 to 0.985, Save 0.80, tab icons 0.94. Release returns with the same spring. A press that turns into a scroll cancels and springs back.
- **Haptic:** none for a plain press (only for the toggles listed above).
- **Reduced motion:** no scale; a pressed-state tint instead.

### 4. Switch tab · very frequent

- **Feel:** the tab mark moves the moment the finger lands; the screen is already there.
- **Spec:** the active icon fills and turns green, lifts 1.5 px and scales 1.05 (190 ms ease out) on touch, before the screen renders. Screens stay mounted with their scroll position; the incoming one crossfades in over 200 ms (opacity 0 → 1, scale 0.985 → 1). Tapping the active tab scrolls it to the top.
- **Haptic:** `select`.
- **Prototype note:** the indicator updates synchronously and the screen change is deferred (`flushSync` + `startTransition` in `TabBar.tsx`), the pattern to copy.

### 5. Open something (card → screen) · very frequent

- **Feel:** the screen slides in from the right and lands without bounce.
- **Spec:** x 100% → 0 with `push`; the screen underneath shifts left 30% and dims slightly (native stack default). Pushes from Home role cards use a shared element instead (see 6).
- **Interruptible:** a back swipe during the push reverses it from where it is.

### 6. Open a post or role from its picture (shared element) · very frequent

- **Feel:** the picture you tapped becomes the picture on the next screen; everything else fades in around it.
- **Spec:** the tapped image animates position and size to its place in the destination with `push` (React Native: Reanimated shared transitions; Flutter: `Hero`). Corner radius morphs from the tile's to the destination's. The rest of the destination fades in (260 ms). Back reverses into the same tile, even if the grid has scrolled; if the tile is off screen, fall back to a plain crossfade.
- **Only the tapped tile owns the shared tag**, claimed on touch-down. The prototype learned this the hard way: tagging every tile made each tap measure the whole grid (`PostGrid.tsx`).
- **Reduced motion:** crossfade.

### 7. Go back · very frequent

- **Button:** reverse of the push (`push`).
- **Edge swipe:** from the left 24 px; the screen follows the finger 1:1; let go past a third of the width or with a rightward flick over 500 px/s and it completes, otherwise it springs back (`push`, carrying release velocity). The revealed screen casts a soft shadow edge. **Haptic:** `snap` on completion. Android: support the predictive back gesture with the same visual.
- **Prototype:** `RouteLayer` in `src/App.tsx`.

### 8. Save · frequent

- **Feel:** the bookmark confirms itself; no toast.
- **Spec:** press 0.80; on release the icon fills green and springs 0.5 → 1 with `mark` (one small overshoot, then still). State changes optimistically on tap; if the server refuses, it reverts with the `error` haptic and a short message.
- **Haptic:** `toggle`.

### 9. Like · frequent

- **Spec:** as Save: heart fills, `mark` spring from 0.6, count ticks with a 150 ms vertical roll (native only; the prototype swaps the number). Optimistic.
- **Haptic:** `toggle`.

### 10. Follow · frequent

- **Feel:** a compact morph: the label slides, a check appears, the fill turns tonal, the width follows.
- **Spec:** label crossfade with 6 px vertical slide (150 ms); width animates with `snappy`. Optimistic.
- **Haptic:** `toggle`.

### 11. Open a sheet · frequent

- **Spec:** rises from the bottom with `sheet`; scrim fades to warm black 38% over 220 ms; surface uses elevation 4 with the top highlight (`VISUAL_MATERIALS.md`). The Create sheet grows out of the + button (shared element).
- **Native:** use the platform sheet where possible (iOS `UISheetPresentationController` with detents; Android `ModalBottomSheet`) and style it.

### 12. Close a sheet (drag, tap outside, Close) · frequent

- **Feel:** the sheet is a physical object you can pull down from anywhere.
- **Spec:** drag from the handle, or from anywhere on the content when the content is scrolled to the top (pulling further down then moves the sheet instead of over-scrolling). It tracks the finger 1:1 downward and resists upward (4%). Release past 110 px or over 650 px/s downward dismisses with `sheet`, carrying velocity; otherwise it springs back. Tap outside or Close dismisses the same way.
- **Haptic:** `snap` when a drag dismisses it.
- **Prototype:** `Sheet.tsx`.

### 13. Change a Discover chip or filter · frequent

- **Spec:** the selected chip's fill moves between chips (shared indicator, `snappy`); chips press to 0.95; results crossfade and rise 6 px (150 ms). Keep scroll position per chip.
- **Haptic:** `select` (native only; the prototype doesn't vibrate on chips).

### 14. Send a message · frequent

- **Spec:** the bubble appears at once (optimistic), fading up 8 px (150 ms); the composer clears in the same frame. "Sending" shows only if it takes over a second; a failed message shows a retry control with the `error` haptic.

### 15. Toasts · occasional

- **Spec:** rise 12 px and fade in (`snappy`) above the tab bar; elevation 3. Information-only toasts leave after 3.5 s; toasts with Undo stay 10 s and pause while touched. Swipe down to dismiss (native only).

## Signature moments (rare, earned)

### Show interest
The bar becomes "Interest sent ✓" in place (no toast): spinner while sending, then the label morphs (150 ms) and the check settles with `settle`. **Haptic:** `success`.

### Credit accepted
The most important moment in the app: a permanent public record. Spinner on Accept; then the credit poster steadies from a dashed provisional edge to solid, a ring draws around the verified mark (`ease.inOut`, 420 ms), the mark settles into it (`settle`), the ring falls away. Whole moment under 0.9 s, never blocks input. No confetti. **Haptic:** `success` at the moment the mark settles.

### Identity switch, onboarding to first Home
As described in the motion system doc §4 (items 10, 12). Identity switching is replaced by separate house accounts in the live app (DECISIONS.md, 9 Oct 2026), so it is not needed natively.

## Accessibility

- Under the system's Reduce Motion: no travel, scale or parallax; state changes still happen, as short crossfades. Gestures keep working (they are direct manipulation, not decoration).
- Every state change motion shows is also said in words ("Saved", "Following", "Interest sent").
- Haptics are never the only signal.

## Checking it

For each interaction: record it on a real mid-range Android and an iPhone at 60/120 fps screen recording, step through frame by frame, and check the four rules. A frame-time overlay (Android "Profile HWUI rendering", Xcode Instruments "Animation Hitches") should show no frame over 16.7 ms during the animation.
