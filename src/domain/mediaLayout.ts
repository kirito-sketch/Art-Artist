import type { Media } from '../data/types';

/** Explicit metadata wins. Path classification is only a conservative legacy fallback. */
export function mediaType(m: Media) {
  return m.contentType ?? (/\/posters\//.test(m.src) ? 'artwork' : /\/people\//.test(m.src) ? 'portrait' : 'photo');
}
export function mediaRatio(m: Media) {
  if (m.width && m.height && m.width > 0 && m.height > 0) return m.width / m.height;
  return mediaType(m) === 'portrait' ? .8 : mediaType(m) === 'artwork' ? 2 / 3 : /\/(stills|covers)\//.test(m.src) ? 16 / 9 : 1;
}
export function mediaPosition(m?: Media, focal = m?.focal) {
  const safe = (n: number | undefined, fallback: number) => Number.isFinite(n) ? Math.max(0, Math.min(100, n!)) : fallback;
  return `${safe(focal?.x, 50)}% ${safe(focal?.y, m && mediaType(m) === 'portrait' ? 25 : 50)}%`;
}
export function mediaFit(m: Media) { return mediaType(m) === 'artwork' ? 'contain' : 'cover'; }

/** Within each ordered group, shape chooses the pattern; DOM/result order never changes. */
export function bentoPattern(media: (Media | undefined)[], group: number) {
  if (media.length === 3 && media.slice(0, 2).every(m => m && mediaRatio(m) < .9)) return { kind: 'portrait-pair', feature: 0 };
  const portrait = media.findIndex(m => m && mediaRatio(m) < .9);
  if (media.length === 3 && portrait >= 0) return { kind: group % 2 ? 'portrait-right' : 'portrait-left', feature: portrait };
  return { kind: media[0] && mediaRatio(media[0]) >= 1.65 ? 'wide' : 'balanced', feature: 0 };
}
