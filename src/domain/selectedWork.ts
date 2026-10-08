import type { Media } from '../data/types';
import { displayedSource } from './mediaPresentation';
import { mediaRatio } from './mediaLayout';

/**
 * Selected work on a profile (docs/ux-refinement/PLAN.md, Stage 2): a compact preview of at most five pieces in at
 * most two rows, in the person's own order, with See all for the rest. Each count has one fixed pattern on an explicit
 * grid, so every cell is filled exactly once (no holes) and the layout never depends on image loading:
 *
 *   1      one full-width frame (16:9)
 *   2      two side by side (square, or 4:3 when both are landscape)
 *   3      a large square on the left, two small squares stacked on the right
 *   4      wide + small over small + wide (a zigzag)
 *   5      wide + small over three small
 *   6+     the five-piece pattern; the last tile carries "+N" and opens the full collection
 *
 * When the first piece is portrait, the 3, 4 and 5 patterns lead with a tall tile instead of a wide or large one, so a
 * portrait is never forced into a landscape frame. Nothing is reordered.
 */
export type WorkTile = { index: number; col: number; row: number; colSpan: number; rowSpan: number };
export type WorkBento = { cols: number; rows: number; cellRatio: number; tiles: WorkTile[]; more: number };

export const SELECTED_WORK_MAX = 5;
const PORTRAIT = 0.95;
const LANDSCAPE = 1.2;

const t = (index: number, col: number, row: number, colSpan = 1, rowSpan = 1): WorkTile => ({ index, col, row, colSpan, rowSpan });

export function selectedWorkBento(media: readonly Media[]): WorkBento {
  const n = Math.min(media.length, SELECTED_WORK_MAX);
  const more = Math.max(0, media.length - SELECTED_WORK_MAX);
  const ratio = (i: number) => mediaRatio(displayedSource(media[i]));
  if (n === 0) return { cols: 1, rows: 0, cellRatio: 1, tiles: [], more };
  if (n === 1) return { cols: 1, rows: 1, cellRatio: 16 / 9, tiles: [t(0, 1, 1)], more };
  if (n === 2) return { cols: 2, rows: 1, cellRatio: ratio(0) >= LANDSCAPE && ratio(1) >= LANDSCAPE ? 4 / 3 : 1, tiles: [t(0, 1, 1), t(1, 2, 1)], more };
  const tall = ratio(0) < PORTRAIT;
  const tiles =
    n === 3
      ? tall
        ? [t(0, 1, 1, 1, 2), t(1, 2, 1, 2, 1), t(2, 2, 2, 2, 1)]
        : [t(0, 1, 1, 2, 2), t(1, 3, 1), t(2, 3, 2)]
      : n === 4
        ? tall
          ? [t(0, 1, 1, 1, 2), t(1, 2, 1, 2, 1), t(2, 2, 2), t(3, 3, 2)]
          : [t(0, 1, 1, 2, 1), t(1, 3, 1), t(2, 1, 2), t(3, 2, 2, 2, 1)]
        : tall
          ? [t(0, 1, 1, 1, 2), t(1, 2, 1), t(2, 3, 1), t(3, 2, 2), t(4, 3, 2)]
          : [t(0, 1, 1, 2, 1), t(1, 3, 1), t(2, 1, 2), t(3, 2, 2), t(4, 3, 2)];
  return { cols: 3, rows: 2, cellRatio: 1, tiles, more };
}

/** Every cell of the grid, covered exactly once. Used by the tests and as a development assertion. */
export function coversGrid(b: WorkBento) {
  const cells = new Map<string, number>();
  for (const x of b.tiles)
    for (let c = x.col; c < x.col + x.colSpan; c++)
      for (let r = x.row; r < x.row + x.rowSpan; r++) {
        if (c < 1 || r < 1 || c > b.cols || r > b.rows) return false;
        cells.set(`${c}:${r}`, (cells.get(`${c}:${r}`) ?? 0) + 1);
      }
  return cells.size === b.cols * b.rows && [...cells.values()].every((v) => v === 1);
}
