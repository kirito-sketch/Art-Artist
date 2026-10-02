/*
 * Portfolio bento: a fixed pattern on a 6-column grid, so the layout never depends on the pixel size or
 * orientation of uploaded images (every tile crops its image with object-fit: cover).
 *
 * Each grid row takes its height from one tile with a set aspect ratio; the other tile in the row
 * stretches to it. Rows, in order:
 *   1 image   hero (full width, 3:2)
 *   2 images  two squares
 *   3+        hero, then rows alternating [wide 4:3 + tall] and [square + square]; the tall tile swaps
 *             sides on every other wide row. A single image left over becomes a full-width band (2:1).
 * Adding, removing or reordering images reflows into the same pattern: no holes, no random spans.
 */
export type BentoRatio = 'hero' | 'square' | 'wide' | 'band';
export interface BentoTile {
  /** Columns of the 6-column grid. */
  span: 2 | 3 | 4 | 6;
  /** The tile that sets its row's height. Absent: stretches to the row. */
  ratio?: BentoRatio;
}

export function bentoLayout(n: number): BentoTile[] {
  if (n <= 0) return [];
  if (n === 1) return [{ span: 6, ratio: 'hero' }];
  if (n === 2) return [{ span: 3, ratio: 'square' }, { span: 3, ratio: 'square' }];
  const tiles: BentoTile[] = [{ span: 6, ratio: 'hero' }];
  let rest = n - 1;
  for (let row = 0; rest > 0; row++) {
    if (rest === 1) {
      tiles.push({ span: 6, ratio: 'band' });
      break;
    }
    if (row % 2 === 1) tiles.push({ span: 3, ratio: 'square' }, { span: 3, ratio: 'square' });
    else if (row % 4 === 0) tiles.push({ span: 4, ratio: 'wide' }, { span: 2 });
    else tiles.push({ span: 2 }, { span: 4, ratio: 'wide' });
    rest -= 2;
  }
  return tiles;
}
