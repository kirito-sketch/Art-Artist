import { MEDIA_GEOMETRY } from '../data/mediaGeometry';
import type { Media } from '../data/types';

/** Explicit metadata wins. Path classification is only a conservative legacy fallback. */
export function mediaType(m: Media) {
  return m.contentType ?? (/\/posters\//.test(m.src) ? 'artwork' : /\/people\//.test(m.src) ? 'portrait' : 'photo');
}
const valid = (d?: { width?: number; height?: number }) => !!d?.width && !!d?.height && Number.isFinite(d.width) && Number.isFinite(d.height) && d.width > 0 && d.height > 0;
const measured = (path?: string) => (path ? MEDIA_GEOMETRY[path.replace(/^\//, '')] : undefined);
/**
 * The geometry of what is actually shown: declared dimensions (uploads, videos), else the measured delivered file,
 * else the measured fallback (seed stills and posters that were never delivered render their fallback).
 */
export function knownGeometry(m: Media): { width: number; height: number } | undefined {
  for (const d of [m.width && m.height ? { width: m.width, height: m.height } : undefined, measured(m.src), measured(m.poster), measured(m.fallback)]) if (valid(d)) return d;
  return undefined;
}
export function mediaRatio(m: Media) {
  const dimensions = knownGeometry(m);
  if (dimensions) return dimensions.width / dimensions.height;
  return mediaType(m) === 'portrait' ? .8 : mediaType(m) === 'artwork' ? 2 / 3 : /\/(stills|covers)\//.test(m.src) ? 16 / 9 : 1;
}
export function mediaPosition(m?: Media, focal = m?.focal) {
  const safe = (n: number | undefined, fallback: number) => Number.isFinite(n) ? Math.max(0, Math.min(100, n!)) : fallback;
  return `${safe(focal?.x, 50)}% ${safe(focal?.y, m && mediaType(m) === 'portrait' ? 25 : 50)}%`;
}
export function mediaFit(m: Media) { return mediaType(m) === 'artwork' ? 'contain' : 'cover'; }
