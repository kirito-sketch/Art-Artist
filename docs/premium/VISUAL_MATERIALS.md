# Visual materials audit

Part of the premium-feel work (`docs/premium/README.md`). Motion is half of why an app feels expensive; the other half is its materials: how surfaces are lit, how deep they sit, how glass behaves, how corners and type line up. This audit counts what the prototype actually uses, says what that does to the feel, and sets the one family new work should use.

Counted from `src/styles/*.css` on 10 October 2026.

## What we found

| Material | Tokens defined | Distinct values in use | Effect on feel |
|---|---|---|---|
| Shadows | 2 (`--shadow-float`, `--shadow-card`) | **93** distinct `box-shadow` values in 186 declarations; 23 use a token | Depth reads as random: two cards side by side sit at different heights. Most are pure black, which looks grey and dirty on the warm paper ground |
| Glass / blur | 1 set (`--glass-*`, the tab bar lens) | **15** blur recipes (6 to 22 px, saturation 110 to 180%) | Floating surfaces look like different materials. Small blurs (6 to 10 px) read as frosted plastic, not glass |
| Corner radii | 5 (`--r-s` 10, `--r-m` 14, `--r-l` 20, `--r-xl` 28, pill) | **about 30**: 2, 3, 4, 6, 8, 9, 10, 12, 14, 16, 18, 20, 22, 26, 28, 32 px, 24%, 26% | Nested corners don't run parallel (an image with 16 px inside a card with 14 px); a sheet top is 32, 28 or 26 depending on the sheet |
| Type sizes | 5 (`--t-1`…`--t-5`: 34, 22, 17, 15, 13) | **62** distinct sizes, including 9, 10, 10.5, 11, 11.5, 12, 12.5, 13.5, 14.5, 15.5 px | Hierarchy blurs; half-pixel sizes render inconsistently; text below 13 px breaks the tokens file's own rule |
| Elevation (stacking) | none named | z-index set ad hoc per component | Fine today; needs names before native |

What already works and stays: the warm paper ground, one action colour, photography as the brightest thing on screen, the glass tab bar (`?nav=glass`, the default), solid surfaces for anything you read.

## The material family

Defined in `src/styles/materials.css`, light and dark. Every new surface takes one of these; nothing else.

### Elevation

Shadows are **stacked** (a tight contact shadow under a wide ambient one) and **tinted** with the paper's warm ink (`rgb(28 22 14)`) instead of black. That pairing is most of what makes a surface look like an object rather than a smudge.

| Level | Token | Used for | Light value |
|---|---|---|---|
| 0 flat | `--edge` only | Grouped lists, rows, inputs | `inset 0 0 0 0.5px` warm ink at 10% |
| 1 resting | `--elev-1` | Cards on the page | `0 1px 2px` 6% + `0 2px 8px` 5% |
| 2 raised | `--elev-2` | Controls on photography (Save, share, back on a hero) | `0 1px 2px` 12% + `0 4px 14px` 14% |
| 3 floating | `--elev-3` | Tab bar, toasts, menus | `0 2px 6px` 8% + `0 14px 36px` 16% |
| 4 overlay | `--elev-4` | Sheets (cast upward) | `0 -1px 3px` 6% + `0 -12px 40px` 14% |

Dark theme: the same levels in black at higher opacity (shadows barely show on charcoal, so the **edge** does the work there: a 0.5 px warm-white line at 12%).

**The top highlight** (`--edge-hi`, a 1 px white line at 75% along the top inside edge) goes on raised and overlay surfaces. It is the cue that makes a sheet or a glass bar look lit from above. One per surface; never on flat surfaces.

### Glass

One recipe, the tab bar's: blur 22 px, saturation 170%, fill white at 58% (light) or warm charcoal at 55% (dark), plus the top highlight and a hairline edge. Over photography the fill turns dark (18 18 20 at 36%) so white text stays readable.

Rules:
- Glass is for **floating controls over moving content** only: the tab bar, controls on a hero image, a sticky bar over a scrolling list. Never for a surface you read (sheets, cards, forms are solid).
- Never stack glass on glass.
- Every glass surface has a solid fallback under `prefers-reduced-transparency` and where `backdrop-filter` is missing (already in `glass.css`).
- Native: iOS `UIBlurEffect(.systemThinMaterial)` (or SwiftUI `.ultraThinMaterial`) is the reference; Android has no system equivalent before API 31, so use `RenderEffect.createBlurEffect` on 31+ and the solid fallback below.

### Radii

Six steps: `--r-xs` 6 (tags, small thumbnails), `--r-s` 10 (inputs, small cards), `--r-m` 14 (cards, toasts), `--r-l` 20 (large cards, media), `--r-xl` 28 (sheet tops), pill. Circles stay 50%.

**Concentric rule:** an element inside a rounded container gets the container's radius minus the gap between them (a 20 px card with 6 px padding holds a 14 px image). That is what makes nested corners look machined rather than approximate. Native iOS: use `.continuous` corner curves (squircle) everywhere; it is a large part of why iOS surfaces look finished.

### Type

The five sizes stay (34, 22, 17, 15, 13) plus one label size (12, uppercase, tracked +4%) for kickers like "CREW JOB". Weights: regular, semibold, bold. No half-pixel sizes, nothing below 12. Tabular figures wherever numbers line up (counts, dates, money).

## Applied in this pass

The surfaces seen most often now use the family:

| Surface | Before | Now |
|---|---|---|
| Sheets | flat, no shadow, grey scrim | `--elev-4` + top highlight, warm scrim |
| Toasts | `--shadow-float` (black) | `--elev-3` + edge |
| Controls on photos (Save, share, back) | one-off black shadow | `--elev-2` + edge |
| Screen being swiped back | none | a soft edge shadow on the revealed screen |
| Images | popped in when loaded | fade in from the placeholder ground (240 ms); cached images show at once |

## What's left (for the native build, and for this prototype as screens are touched)

1. Replace the remaining 90-odd one-off shadows with the five levels. Most map directly: hairline insets become `--edge`; small black drops become `--elev-1` or `--elev-2`; large ones become `--elev-3`.
2. Collapse the 15 blur recipes into the one glass.
3. Snap radii to the six steps and apply the concentric rule (biggest offenders: posters at 2, 3 and 9 px; sheet tops at 26/28/32).
4. Snap the 62 type sizes to the scale. The 12.5 and 13.5 px sizes become 13; 14 and 14.5 become 15; 11 to 11.5 become the 12 px label or 13.
5. Name stacking layers (page, sticky, floating chrome, sheet, toast, system) for native.

Native developers should build from the family above, not from the prototype's CSS values.
