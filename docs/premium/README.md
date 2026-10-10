# Premium feel

The flows were right but the app didn't feel premium. This folder is the work on why, and what was done about it in the prototype (10 October 2026). The live app is native, built in another repo; this PWA stays the reference and has to show the feel too.

| Document | What it is |
|---|---|
| [Frequency audit](FREQUENCY_AUDIT.md) | The 15 interactions people repeat most, graded before and after on instant, continuous, interruptible, smooth |
| [Visual materials](VISUAL_MATERIALS.md) | Shadows, glass, radii, elevation and type: what's in use, what it does to the feel, the one family to use |
| [Native motion spec](NATIVE_MOTION_SPEC.md) | Per-interaction spec for the native developers: springs (with SwiftUI and Compose values), haptics, gestures, reduced motion |
| `recordings/` | Screen recordings from the prototype: `post-to-viewer`, `swipe-back` (abandoned, then completed), `sheet-drag-close` (springs back, then closes), `save-and-follow`, `credit-accept` |
| `../MOTION_MICROINTERACTION_SYSTEM.md` | The motion system, now with haptics (§9) and the performance findings (§10) |

## What changed in the prototype

- **Taps respond faster.** Three bugs made every tap drop frames: cards re-read their text and styles on every render, every grid tile and Follow button was a tracked layout node, and opening a post laid out the whole stream. All fixed.
- **Swipe from the left edge to go back**, following the finger, abandonable midway.
- **Sheets close when pulled down from anywhere** once their content is at the top.
- **Haptics** on Save, Follow, Like, tabs, sheet and swipe dismissals, interest sent, credit accepted and errors (Android; iOS Safari can't vibrate, the native spec maps each one).
- **Save** settles with one small overshoot instead of wobbling.
- **Materials:** sheets, toasts and controls on photos use one family of warm, stacked shadows with a lit top edge; images fade in instead of popping.

## Frames, before and after

Production build, headless Chromium at 393 × 852, CPU slowed 4× to stand in for a mid-range Android, real pointer taps, every animation frame timed for 1.2 to 1.6 s. Median of runs. Headless Chromium has no GPU, so the numbers compare before and after; they are not a device benchmark.

| Interaction | Smooth before → after | Worst frame before → after |
|---|---|---|
| Scroll Home | 100% → 100% | 17 → 17 ms |
| Open a sheet (Create) | 82% → 83% | 217 → 183 ms |
| Switch tab: Discover | 86% → 90% | 100 → 67 ms |
| Open a post from the Discover grid | 62% → 71% | 390 → 200 ms |
| Back from that post | 85% → 82% | 133 → 133 ms |
| Switch tab: Inbox | 85% → 97% | 190 → 50 ms |
| Switch tab: Profile | 90% → 92% | 133 → 117 ms |
| Switch tab: Home | 80% → 86% | 150 → 117 ms |
| Open a role from Home | 76% → 79% | 225 → 183 ms |
| Back from the role | 80% → 86% | 167 → 133 ms |
| Open a post from Home | 87% → 87% | 175 → 183 ms |
| Back from that post | 90% → 92% | 117 → 100 ms |

The before runs used the old harness, which clicked without pointer events, so the post opened then without its shared-element animation; after includes it. What remains (150 to 200 ms on the first frame of a new screen) is React re-rendering the whole prototype on each navigation, because navigation and data share one store. The native app should keep them apart.

## How to repeat

The harness scripts are not part of the app. Build (`npm run build`), serve (`npx vite preview`), then time frames with Playwright, a CDP `Emulation.setCPUThrottlingRate` of 4, and a `requestAnimationFrame` recorder; dropped frames are the sum of `round(interval / 16.7) − 1`.
