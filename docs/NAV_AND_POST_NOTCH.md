# Glass navigation lens and post action notch (default)

Two separate approved decisions, both the default everywhere (the app, /test and Compare) since October 2026.
`src/ui/preview.ts` holds the switches:

| URL | Effect |
| --- | --- |
| `?nav=off` | The previous solid bottom navigation, for comparison. |
| `?actions=pill` | The previous frosted action pill and native video controls, for comparison. |
| `?samples` | Opens a stream of review samples: real seeded posts first, then ratio, video and failure samples (`src/qa/notchSamples.ts`). |

`?dir=a` and `?dir=c` (profile-direction review) keep their own navigation treatment.

The two use different materials on purpose. Glass is for controls floating above content (the bar, and the small video controls on media). The notch is part of the card: solid, no glass. They share icons, stroke weight, 44 px targets, spring motion and focus treatment.

## Navigation: the selected lens

### What was wrong

- **The lens was nearly invisible in light mode.** It was white at 62% over a bar of white at 58%. Two white rims (the bar's and the lens's) also read as double outlines.
- **It was attached to each tab.** Each tab rendered its own lens and Framer Motion animated it between tabs with `layoutId`. The tab is scaled to 0.94 while pressed, and selection changes during that press, so the measured start box was the scaled one. The lens started from a skewed box (measured jump of 12 px at the first frame) and overshot the target.
- **Competing selected cues.** The older state (green icon, 1.5 px lift, green avatar ring) stayed on top of the lens.

### How it works now

- **One lens per bar** (`src/nav/TabBar.tsx`): a single element inside `.tabbar-pill`, placed from the selected tab's `offsetLeft` and `offsetWidth`. Layout offsets ignore transforms, so a pressed tab never skews it. A `ResizeObserver` on the bar re-places it on resize or font change, and switching who you act as re-places it too.
- **Size.** The lens is the tab plus 2 px each side (64 px), inset 4 px top and bottom (58 px tall) and fully rounded, so it sits concentric with the bar.
- **Animation.** It animates `x` and `width` with a critically damped spring (stiffness 520, damping 46), so it glides and lands without overshoot. With reduced motion it moves instantly. The bar's own size never changes.
- **Layering.** The lens is painted first in the bar, so tabs and Create sit above it. It glides behind Create, which never takes it.
- **Material** (`src/styles/glass.css`, `[data-nav='glass']`):
  - The lens is a tint of the same glass, one step denser: ink at 10% in light, white at 13% in dark, white at 20% over hero imagery. It has a soft top highlight and no rim of its own.
  - Selected icon and label use full glass ink. The rest use 62%. Over imagery they switch to white and white at 74%.
  - The selected glyph is filled and the label semibold, so colour is never the only cue. Green stays with Create.
- **Fallbacks.** Reduced transparency and browsers without backdrop blur get a solid bar, and the lens tint still reads on it.

## Post actions: Option A

### The notch

- The media track is masked (`src/styles/post-notch.css`). A full layer is XORed with one 168 × 60 shape anchored bottom-right:
  - the 156 × 48 cut-out
  - two 12 px convex corners where the media rounds off
  - a 16 px concave inner corner

  The media and its placeholder are physically cut, and whatever is behind the card (the page ground) shows through in both themes. Nothing is painted on top.
- The actions sit in the cut-out: Like, Share, Save, three 44 × 44 targets, 22 px icons at a 1.75 stroke.
  - Inactive icons are `--text-2`. Liked and saved are filled in `--text`, as in the reference (no red). Like gives a 1.18 pop.
  - Save keeps the existing confirmation and Undo.
  - Share opens the existing share flow.
- The cut-out is 156 × 48 on every ratio. On a 2.34:1 still at 320 px it takes 40% of the height, which still works. The source is never cropped further to make room.
- One `PostActions` component serves the pill (default app), the notch and the viewer. The order and the logic are shared, not duplicated.
- The like count moves into the Like button's accessible label, so the cut-out keeps one width.
- **Carousels.** The actions belong to the post. The index sits bottom-left on photos and top-centre on video, clear of the progress line.
- **Upload.** In the framing preview, a dashed outline shows the area the notch will cover.

### Feed video

In the feed you watch. Seeking lives in the viewer (`src/screens/home/FeedVideo.tsx`).

- The frame is one Play/Pause button. When paused, a 60 px glass Play shows in the centre.
- Expand sits top-left and Mute top-right, as 34 px glass circles in 44 px targets.
- A 3 px progress line runs from 12 px in to 12 px before the cut-out. It is a read-only `progressbar` with an accurate value text, and it takes no pointer events. There is no scrubber, no ±10, no cast and no overflow menu.
- **Unchanged from before:**
  - There is no autoplay; playback is always started by the user.
  - The video pauses when it leaves the screen.
  - Sound is on when you press Play.

  Muted autoplay was evaluated and not added: the existing player never autoplayed, and adding it is a product decision.
- The bundled MP4s also ship as WebM; both are offered so browsers without H.264 still play.
- **Failure.** When the source fails, the card shows "Video unavailable" over the dimmed poster, and the notch stays.

### Expanded viewer

`src/screens/home/PostVideoViewer.tsx` is a stack route (`postVideo`) that opens from Expand.

- It opens at the feed's frame and keeps playing if the feed was playing.
- Controls:
  - a full-width scrubber (a native range input) with elapsed and remaining time
  - back and forward 10 seconds
  - Play/Pause, Mute
  - Full screen where the browser supports it
- Keyboard: Space or K toggles playback, ← and → jump 10 seconds, M mutes, Escape closes. Swiping down also closes it.
- The post actions sit on their own row 20 px below the transport, under a hairline: same order, same state (Like and Save are shared stores).
- The viewer has no notch, because there is no card.
- On close, it hands its frame back, and the feed card resumes from there (`src/state/playhead.ts`).
- The video uses `object-fit: contain`, so portrait and landscape clips are never stretched.

## Limits and open points

- **Footage.** The repository has no landscape, 9:16 or long video; every clip is a native 4:5, six-second file. The 16:9 and 9:16 samples frame that clip at those ratios, and the player crops it with `object-fit`; no file is changed. Real landscape footage should be checked before rollout.
- **Captions.** No clip has a caption track, so the viewer has no CC control yet. It should appear when a `<track>` exists.
- **Like count.** It is no longer visible on the card (it is announced). If the client wants it visible, it belongs under the caption, not in the notch.
