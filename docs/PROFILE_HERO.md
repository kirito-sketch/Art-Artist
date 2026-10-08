# Legacy Individual profile hero

This document describes the explicit Legacy presentation. The current shared immersive Individual hero is documented in [PROFILE_IMMERSIVE.md](PROFILE_IMMERSIVE.md).

Scope: the individual profile (`ProfileScreen`) only. Production house profiles (`OrgScreen`) are a different
component and are unchanged.

## Composition

| | Before | After |
|---|---|---|
| Hero height | fixed 470 px | 45% of the phone's height, clamped to 300 to 400 px (380 px at 390 × 844, −19%) |
| Avatar | 80 px, entirely inside the sheet (24 px below its top) | 96 px (+20%), 44 px over the photo and 52 px on the sheet |
| Sheet over photo | 40 px | 28 px, `display: flow-root` so the avatar's negative margin cannot collapse out of the sheet |
| Sheet top → name | 147 px | 93 px |
| Avatar ring | 3 px surface colour | 4 px, the sheet's own colour, so it reads as a cut-out rather than a white ring |

`--phone-h` is the phone's height (`852px` in the prototype frame, `100dvh` in App mode and on small
screens), so the hero scales with the screen rather than assuming one device. The hero height includes the
status-bar inset: on a notched iPhone the controls sit below the inset (`--status-bar`) and the photo runs
under it, as before.

First viewport at 390 × 844 (everything clears the floating tab bar): craft, name and verified mark, role,
place and languages, verified credits and years, availability, and the Edit profile or Follow/Message actions.
At 375 × 667 everything down to availability clears it (before: the name was hidden).

## Scroll depth

`src/ui/useHeroParallax.ts`, attached as a callback ref on the scrolling element. The browser scrolls the
page natively; nothing intercepts it. Per frame (one `requestAnimationFrame`, scheduled from a passive
scroll listener):

- the photo layer: `translate3d(0, 0.3 × scroll, 0) scale(1 + 0.03 × progress)`, so it travels at 70% of
  the content's speed and grows 3% over the hero's height;
- the dim layer: `opacity = 0.26 × progress`;
- the share/settings controls are inside the hero and leave with it.

No React state is touched per frame; the only state change is the status-bar tint flipping when the hero has
mostly gone (a boolean, set when it changes). Reduced motion: no transform, no dim; the page just scrolls.
Resize is observed with a `ResizeObserver` so the progress stays correct across rotation or text-size changes.

