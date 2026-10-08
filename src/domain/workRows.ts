import type { Media } from '../data/types';
import { displayedSource } from './mediaPresentation';
import { mediaRatio } from './mediaLayout';

/**
 * Selected work on a profile (docs/MEDIA_SYSTEM.md): rows in the person's own order. A landscape piece takes a full row
 * at its natural shape (bounded to 2.39:1); two consecutive portrait or square pieces share a row at one common
 * ratio; a portrait with no partner takes a full row, bounded to 4:5 so it never towers. Nothing is reordered, and no
 * landscape frame is forced into portrait (or the reverse).
 */
export type WorkRow = { items: number[]; ratio: number };

const LANDSCAPE = 1.2;
export function workRows(media: readonly Media[]): WorkRow[] {
  const r = media.map((m) => mediaRatio(displayedSource(m)));
  const rows: WorkRow[] = [];
  for (let i = 0; i < media.length; i++) {
    if (r[i] >= LANDSCAPE) rows.push({ items: [i], ratio: Math.min(2.39, r[i]) });
    else if (i + 1 < media.length && r[i + 1] < LANDSCAPE) {
      rows.push({ items: [i, i + 1], ratio: Math.max(.75, Math.min(1, Math.sqrt(r[i] * r[i + 1]))) });
      i++;
    } else rows.push({ items: [i], ratio: Math.max(.8, Math.min(1, r[i])) });
  }
  return rows;
}
