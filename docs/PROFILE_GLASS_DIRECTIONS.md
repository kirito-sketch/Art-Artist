# Profile, glass navigation and CTA directions (for review)

Status: **proposal, waiting for a choice.** Nothing changes in the app without `?dir=`.

Three directions for the individual and house profile heroes, the floating navigation and the CTA system, built in the real app with existing images. Open the app with `?dir=a`, `?dir=b` or `?dir=c` (per page load, never stored). The review page with screenshots and the full reasoning was shared as an artifact.

| Direction | Individual hero | House hero | Navigation | CTAs |
| --- | --- | --- | --- | --- |
| A · Poster | Centred title, glass info card, one glass action group | Wide still as a screen over a dark stage, centred | Glass; selected tab is a solid white capsule | Follow solid white, Message glass inside one group |
| **B · Title card (recommended)** | Left-aligned lower third: craft eyebrow, large name, fact chips, solid Follow + glass Message | Same, with a "Now making" slate on the still | Adaptive glass with a gliding lens | Three weights: solid, glass, quiet |
| C · Framed print | Inset photo, solid identity panel | Framed still, solid panel | Nearly solid frosted bar | Green solid Follow, outlined Message |

Code (review only): `src/ui/designDirection.ts` (the switch), `src/screens/profile/HeroDirections.tsx` (identity layer), `src/styles/glass.css` (glass tokens, CTA family and states, nav treatments, reduced-transparency and no-blur fallbacks). The phone element carries `data-dir` and `data-chrome` (light when a hero is under the chrome), which the navigation uses to switch to the media tint.

Glass rules, the CTA inventory, scroll behaviour and scenarios are in the review page. After a direction is chosen, the switch is removed and the chosen direction replaces the current hero; Home, Discover, credit and permission rules are not touched.
