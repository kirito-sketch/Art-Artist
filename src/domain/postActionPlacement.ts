import type { Media } from '../data/types';
import { mediaFit, mediaRatio, mediaType } from './mediaLayout';

/** Project a declared focal point through the displayed crop; this is not subject/text detection. */
export function postActionPlacement(media: Media | undefined, frame: { width: number; height: number }, video: boolean, fit?: 'cover' | 'contain'): { bottom: number; side: 'left' | 'right' } {
  const normal = video ? 80 : 12;
  const atRight = (bottom: number): { bottom: number; side: 'right' } => ({ bottom, side: 'right' });
  const candidates = [...new Set([normal, normal + 68, normal + 136, frame.height - 62])].filter(bottom => bottom >= normal && bottom + 62 <= frame.height);
  if (!media?.focal || !frame.width || !frame.height) return atRight(media && mediaType(media) === 'artwork' && !video ? 80 : normal);
  const safe = (n: number) => Number.isFinite(n) ? Math.max(0, Math.min(100, n)) / 100 : .5;
  const x = safe(media.focal.x), y = safe(media.focal.y);
  const ratio = mediaRatio(media), frameRatio = frame.width / frame.height;
  const contain = (fit ?? mediaFit(media)) === 'contain';
  const wide = contain ? ratio < frameRatio : ratio > frameRatio;
  const width = wide ? frame.height * ratio : frame.width;
  const height = wide ? frame.height : frame.width / ratio;
  // Cover uses the same focal point for object-position. Contained artwork is centred.
  const subjectX = x * width + (frame.width - width) * (contain ? .5 : x);
  const subjectY = y * height + (frame.height - height) * (contain ? .5 : y);
  const subjectRadius = Math.min(frame.width, frame.height) * .12;
  const pillLeft = Math.max(12, frame.width - 184);
  if (subjectX + subjectRadius < pillLeft) return atRight(mediaType(media) === 'artwork' && !video ? 80 : normal);
  const clear = candidates.find(bottom => {
    const top = frame.height - bottom - 50;
    return subjectY + subjectRadius < top || subjectY - subjectRadius > top + 50;
  });
  if (clear !== undefined) return atRight(clear);
  // A short video may have no room to move upward; use the opposite side if it is clearer.
  return { bottom: normal, side: subjectX > frame.width / 2 ? 'left' : 'right' };
}
