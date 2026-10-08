# Deterministic Discover Bento groups

## Root cause of the mobile hole

The previous PostGrid put the entire feed in one two-column Grid. Independent tile aspect ratios determined each implicit row's height; `align-self: start` left shorter items below that height unfilled. The `bentoTile` helper additionally made wide/medium items at every third index span both columns.

The reported seed sequence placed Vikram's portrait beside Ishaan's landscape, then the portrait video on the left of the following row. The subsequent two-column Rhea item could not fit in the remaining right cell and started another row. The unfilled portion beneath Ishaan plus the empty cell beside the video formed the large gap.

This was not caused by image stretching, network loading or explicit grid-row spans. Images were already absolutely positioned. It happened within a populated feed, not only at the end. The default sparse Grid auto-placement and incomplete implicit rows were the cause.

## Structure

`src/domain/bentoLayout.ts` partitions consecutive posts into complete independent rectangles. `PostGrid` renders those groups in a vertical flex list. Every group has a reserved aspect ratio, two explicit equal grid tracks per axis and named grid areas. Tiles have no independent aspect ratio or minimum-content height that can expand those tracks.

| Pattern | First item | Second item | Third item | Group ratio |
| --- | --- | --- | --- | --- |
| Tall left | Left, full height | Upper right | Lower right | 1.6 |
| Tall right | Upper left | Right, full height | Lower left | 1.6 |
| Wide top | Full-width top | Lower left | Lower right | 0.9 |
| Wide bottom | Upper left | Upper right | Full-width bottom | 0.9 |

Tall-right makes the **second** post the tall tile, keeping row-major visual order consistent with DOM order. No post sorting, dense packing, arbitrary margins or feed-wide row spans are used.

The four patterns are scored deterministically against existing source ratios. Portrait metadata and the featured slot have greater weight. Ties rotate predictably. Source media, IDs, carousel framing and original Post presentation are untouched. Shared Photo handles declared Fit/Fill/focal metadata; artwork stays contained and images are never stretched or replaced by blurred filler.

Each tall group's two supporting track heights plus the shared 10px gutter exactly equal its tall tile. Grid containers, not intrinsic image dimensions, determine geometry. Column, stack and group gutters all use `--bento-gap`.

## Leftovers

- One: one complete featured tile, with a bounded source-aware ratio.
- Two: one balanced two-tile rectangle, with one common height.
- Three: one complete library pattern.
- Four: a balanced two-by-two rectangle.

Long lists use groups of three until four or fewer remain. Examples: five becomes 3+2, seven becomes 3+4, ten becomes 3+3+4. No cells are reserved for absent items.

## Interaction and safe areas

Group wrappers have presentation semantics; posts remain list items and retain their keyboard buttons. `onOpen(group.start + slot)` preserves the original Discover index and vertical viewer order. Saved's existing non-Bento PostGrid is unchanged.

The scrolling Discover screen owns `--tabbar-clearance`, which is `100px + env(safe-area-inset-bottom)` in normal App mode. Redundant PostGrid bottom padding was removed. Navigation itself was not redesigned.

## Verification

The production build and 188 unit tests passed. Unit coverage partitions counts 0–100 without loss, duplication, source mutation or order changes; tests all four source-selected patterns and explicit leftovers.

Rendered checks cover 120 mixed-media layouts: counts 1–12, 13, 17 and 24 at 393×852, 390×844, 375×812 and 320×568, in both themes. Inputs include portrait, landscape, square, poster, carousel and video thumbnails. Coverage checks verify filled cells, equal column closure, 10px gutters, no overlaps, DOM/visual order, Fit/Fill without stretching, keyboard indexes and final-item navigation clearance. All four core patterns are also rendered explicitly.

Delayed-thumbnail checks compare group/tile geometry before and after delivery. A simulated 34px safe-area contribution verifies final-item clearance. The actual seeded Discover feed is checked for correct tap → viewer indexes and complete stream order at each phone width. These are browser-emulated mobile viewports; physical iPhone testing is not claimed.
