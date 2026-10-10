# Frequency audit: the 15 interactions people repeat most

Premium feel is decided by the interactions people do hundreds of times a day, not by the rare showpieces. So this audit ranks interactions by how often an active person does them and grades each on four things:

- **Instant:** visible feedback in the same frame as the touch.
- **Continuous:** moves from where it is, to where it goes, from where it came; nothing jumps.
- **Interruptible:** can be grabbed or reversed mid-way and keeps its momentum.
- **Smooth:** no dropped frames on a mid-range phone.

Grades: ● good · ◐ partly · ○ missing. "Before" is the prototype on 10 October 2026 before this pass; "Now" is after it. Frame numbers are in `README.md`.

| # | Interaction | How often | Before: Instant / Continuous / Interruptible / Smooth | Now | What changed |
|---|---|---|---|---|---|
| 1 | Scroll a feed | Constant | ● ● ● ● | ● ● ● ● | Nothing needed (100% smooth) |
| 2 | Images arriving | Constant | ● ○ – ◐ | ● ● – ● | Fade in from the placeholder instead of popping in; cached images show at once |
| 3 | Press a control or card | Constant | ● ● ● ● | ● ● ● ● | Nothing needed |
| 4 | Switch tab | Very frequent | ● ● ● ◐ | ● ● ● ● | Indicator was already instant; the tab change no longer re-measures every grid tile and Follow button. Added `select` haptic |
| 5 | Open a screen from a card | Very frequent | ● ● ◐ ◐ | ● ● ● ◐ | Cards no longer recompute their names on every render (the biggest single cost); a push can now be reversed by swiping back mid-way |
| 6 | Open a post from its picture | Very frequent | ◐ ● ◐ ○ | ● ● ● ◐ | Worst frame halved: only the tapped tile owns the shared element, the stream renders the nearby posts first |
| 7 | Go back | Very frequent | ● ● ○ ◐ | ● ● ● ◐ | **Edge swipe back added**: follows the finger, can be abandoned, completes on a flick, `snap` haptic |
| 8 | Save | Frequent | ● ● ● ● | ● ● ● ● | Fill spring no longer wobbles (one small overshoot); `toggle` haptic |
| 9 | Like | Frequent | ● ● ● ● | ● ● ● ● | `toggle` haptic |
| 10 | Follow | Frequent | ● ● ● ◐ | ● ● ● ● | Width animation only runs around its own toggle, so other taps don't pay for every Follow button; `toggle` haptic |
| 11 | Open a sheet | Frequent | ● ● ● ◐ | ● ● ● ◐ | Sheets now lit as overlay objects (elevation 4, top highlight, warm scrim) |
| 12 | Close a sheet | Frequent | ● ● ◐ ● | ● ● ● ● | **Drag from anywhere** on the content once it's at the top, not just the handle; `snap` haptic |
| 13 | Change a Discover chip | Frequent | ● ● ● ● | ● ● ● ● | Nothing needed |
| 14 | Send a message | Frequent | ● ● – ● | ● ● – ● | Nothing needed (optimistic bubble already) |
| 15 | Toasts | Occasional | ● ● ◐ ● | ● ● ◐ ● | Elevation 3; success and error toasts carry haptics. Swipe-to-dismiss left to native |

Signature moments (rare but remembered), also touched: **Show interest** and **Credit accepted** now end with the `success` haptic.

## What the worst-first order was

The worst grades on the most frequent rows were 6 (open a post: worst frame about 400 ms on the throttled phone), 7 (no swipe back at all), 5 and 4 (long first frames), then 12 (sheets only closed from the handle). Those were fixed in that order.

## What's still ◐, and why

- **Smooth on 5, 6, 7, 11:** the first frame of a new screen still takes 150 to 200 ms on a 4× slowed CPU. Profiling shows the rest is React re-rendering the whole app on every navigation, because tab, stack and data share one store. That is a prototype architecture limit, not a motion one; the native app should keep navigation state apart from data (noted in the native spec).
- **Interruptible on 15:** toasts can't be swiped away in the PWA; specified for native.

## How it was measured

`docs/premium/README.md` has the method and the numbers. In short: a production build in headless Chromium at an iPhone 15 size, CPU slowed 4× to stand in for a mid-range Android, every animation frame timed while the interaction runs, with real pointer taps.
