import { MEDIA_GEOMETRY } from '../data/mediaGeometry';
import type { Media } from '../data/types';

/** Explicit metadata wins. Path classification is only a conservative legacy fallback. */
export function mediaType(m: Media) {
  return m.contentType ?? (/\/posters\//.test(m.src) ? 'artwork' : /\/people\//.test(m.src) ? 'portrait' : 'photo');
}
export function mediaRatio(m: Media) {
  const dimensions = m.width && m.height ? m : MEDIA_GEOMETRY[m.src.replace(/^\//, '')];
  if (dimensions?.width && dimensions.height && Number.isFinite(dimensions.width) && Number.isFinite(dimensions.height) && dimensions.width > 0 && dimensions.height > 0) return dimensions.width / dimensions.height;
  return mediaType(m) === 'portrait' ? .8 : mediaType(m) === 'artwork' ? 2 / 3 : /\/(stills|covers)\//.test(m.src) ? 16 / 9 : 1;
}
export function mediaPosition(m?: Media, focal = m?.focal) {
  const safe = (n: number | undefined, fallback: number) => Number.isFinite(n) ? Math.max(0, Math.min(100, n!)) : fallback;
  return `${safe(focal?.x, 50)}% ${safe(focal?.y, m && mediaType(m) === 'portrait' ? 25 : 50)}%`;
}
export function mediaFit(m: Media) { return mediaType(m) === 'artwork' ? 'contain' : 'cover'; }
