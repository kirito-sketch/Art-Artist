import type { Media } from '../data/types';
import { mediaRatio, mediaType } from './mediaLayout';

export type BentoPattern = 'tall-left' | 'tall-right' | 'wide-top' | 'wide-bottom' | 'single' | 'pair' | 'quad';
export type BentoGroup = { start: number; count: number; pattern: BentoPattern; ratio: number; slots: number[] };

/** Slots are in reading/DOM order. Tall-right deliberately makes the second item tall. */
export const BENTO_PATTERNS = [
  { pattern: 'tall-left', ratio: 1.6, slots: [.8, 1.6, 1.6] },
  { pattern: 'tall-right', ratio: 1.6, slots: [1.6, .8, 1.6] },
  { pattern: 'wide-top', ratio: .9, slots: [1.8, .9, .9] },
  { pattern: 'wide-bottom', ratio: .9, slots: [.9, .9, 1.8] },
] as const;

function three(media: (Media | undefined)[], ordinal: number) {
  // Score only declared source geometry. Image load/failure cannot regroup the feed.
  const scored = BENTO_PATTERNS.map((p, index) => ({ p, index, score: p.slots.reduce((sum, slot, i) => {
    const m = media[i], source = m ? mediaRatio(m) : 1;
    const weight = m && mediaType(m) === 'portrait' ? 1.4 : 1;
    const featured = p.pattern === 'tall-right' ? 1 : p.pattern === 'wide-bottom' ? 2 : 0;
    return sum + Math.abs(Math.log(source / slot)) * weight * (i === featured ? 2 : 1);
  }, 0) }));
  // Rotate ties deterministically; never shuffle content or assign independent spans.
  scored.sort((a, b) => a.score - b.score || (a.index - ordinal % 4 + 4) % 4 - (b.index - ordinal % 4 + 4) % 4);
  return scored[0].p;
}

/** Contiguous groups cover every item exactly once; leftovers never reserve an empty cell. */
export function bentoGroups(items: readonly { media: Media[] }[]): BentoGroup[] {
  const groups: BentoGroup[] = [];
  let start = 0;
  while (start < items.length) {
    const remaining = items.length - start;
    const count = remaining <= 4 ? remaining : 3;
    const media = items.slice(start, start + count).map(item => item.media[0]);
    const ratios = media.map(m => m ? mediaRatio(m) : 1);
    if (count === 3) {
      const p = three(media, groups.length);
      groups.push({ start, count, pattern: p.pattern, ratio: p.ratio, slots: [...p.slots] });
    } else if (count === 1) {
      const ratio = Math.max(.75, Math.min(1.91, ratios[0]));
      groups.push({ start, count, pattern: 'single', ratio, slots: [ratio] });
    } else if (count === 2) {
      const slot = Math.max(.8, Math.min(1.6, Math.sqrt(ratios[0] * ratios[1])));
      groups.push({ start, count, pattern: 'pair', ratio: slot * 2, slots: [slot, slot] });
    } else {
      groups.push({ start, count, pattern: 'quad', ratio: 1, slots: [1, 1, 1, 1] });
    }
    start += count;
  }
  return groups;
}
