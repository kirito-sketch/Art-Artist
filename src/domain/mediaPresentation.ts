import { MEDIA_GEOMETRY } from '../data/mediaGeometry';
import type { Media, MediaFraming, MediaSurface, PostPresentation } from '../data/types';
import { knownGeometry, mediaPosition, mediaRatio, mediaType } from './mediaLayout';

/** Destination policy. Original assets and source focal points are never modified. */
export const MEDIA_PRESETS: Record<MediaSurface, { ratio?: number; min?: number; max?: number; fit?: 'cover' | 'contain'; sizes: string }> = {
  preview: { sizes: '(max-width: 600px) 100vw, 430px' },
  // 3:4 is the tallest image; 2.39:1 keeps cinemascope frames whole (no crop, no bands). See docs/MEDIA_SYSTEM.md.
  post: { min: .75, max: 2.39, sizes: '(max-width: 600px) 100vw, 430px' },
  'discover-bento': { min: .65, max: 1.91, sizes: '(max-width: 600px) 100vw, 430px' },
  'profile-hero': { sizes: '(max-width: 600px) 100vw, 430px' },
  'portfolio-thumbnail': { min: .65, max: 2.4, sizes: '(max-width: 600px) 50vw, 215px' },
  'credit-card': { ratio: .8, sizes: '(max-width: 600px) 60vw, 240px' },
  'project-card': { ratio: .8, sizes: '(max-width: 600px) 50vw, 240px' },
  'project-hero': { ratio: 1.6, sizes: '(max-width: 600px) 100vw, 430px' },
  'event-card': { ratio: 4 / 3, sizes: '(max-width: 600px) 60vw, 300px' },
  'event-hero': { ratio: 16 / 9, sizes: '(max-width: 600px) 100vw, 430px' },
  spotlight: { ratio: .8, sizes: '(max-width: 600px) 80vw, 350px' },
  'search-thumbnail': { ratio: 1, sizes: '(max-width: 600px) 50vw, 200px' },
  showreel: { ratio: 16 / 9, fit: 'contain', sizes: '(max-width: 600px) 100vw, 430px' },
  original: { fit: 'contain', sizes: '100vw' },
  avatar: { ratio: 1, fit: 'cover', sizes: '96px' },
  logo: { ratio: 1, fit: 'contain', sizes: '96px' },
};
export const POST_FRAMES: Record<Exclude<PostPresentation, 'original'>, number> = { portrait: .75, square: 1, landscape: 1.91 };
export function presentationRatio(media: Media | undefined, surface: MediaSurface) {
  const preset = MEDIA_PRESETS[surface];
  const ratio = media ? mediaRatio(media) : 1;
  if (surface === 'original') return ratio;
  return preset.ratio ?? Math.max(preset.min ?? .1, Math.min(preset.max ?? 10, ratio));
}
export function postFrame(media: Media[], choice: PostPresentation = 'original') {
  if (choice !== 'original') return POST_FRAMES[choice];
  // Image Posts stay bounded at 3:4. A genuine vertical player can retain up to 9:16.
  if (media[0] && isPlayableVideo(media[0])) return Math.max(9 / 16, Math.min(1.91, mediaRatio(media[0])));
  if (media.length < 2) return presentationRatio(media[0], 'post');
  // A carousel has one frame, so it never jumps between slides. Of the slides' own shapes, choose the one that leaves the
  // least empty band across the set (slides keep Fit: nothing is cropped). The first slide is the cover and weighs more.
  const shapes = media.map((m) => presentationRatio(m, 'post'));
  // Portraits and landscapes together: the neutral square shows both fairly (the 4:5 cover nearly full width, stills
  // with modest bands) instead of shrinking one kind to a sliver.
  if (shapes.some((r) => r < .95) && shapes.some((r) => r > 1.2)) return 1;
  const band = (frame: number) => shapes.reduce((sum, r, i) => sum + (1 - Math.min(r, frame) / Math.max(r, frame)) * (i === 0 ? 1.5 : 1), 0);
  return shapes.reduce((best, r) => (band(r) < band(best) - 1e-9 ? r : best), shapes[0]);
}
export function mediaPresentation(media: Media, surface: MediaSurface = 'preview', frameRatio?: number) {
  const preset = MEDIA_PRESETS[surface];
  const setting = surface === 'original' ? undefined : media.presentations?.[surface];
  const ratio = mediaRatio(media), frame = frameRatio ?? presentationRatio(media, surface);
  const bounded = Math.abs(ratio - frame) > .02;
  const unknown = !knownGeometry(media);
  // A Bento tile is a preview with its own shape: it fills (with focal), unless the source is typographic artwork.
  const preserve = mediaType(media) === 'artwork' || (surface === 'post' && bounded) || (unknown && surface !== 'profile-hero' && surface !== 'avatar' && surface !== 'discover-bento');
  const fit = surface === 'original' ? 'contain' : setting?.fit ?? preset.fit ?? (preserve ? 'contain' : 'cover');
  return { fit, focal: setting?.focal ?? media.focal, position: mediaPosition(media, setting?.focal ?? media.focal), ratio: frame, sizes: preset.sizes };
}
export function withFraming(media: Media, surface: MediaSurface, framing: MediaFraming): Media {
  return { ...media, presentations: { ...media.presentations, [surface]: framing } };
}
export function sourceOnly(media: Media): Media {
  const { presentations: _, ...source } = media;
  return source;
}
export function deliveredMedia(media: Media, src: string): Media {
  if (src === media.src) return media;
  // A video's poster is a frame of that video: same geometry.
  if (media.kind === 'video' && src === media.poster) return { ...media, src, variants: undefined };
  return { ...media, src, contentType: undefined, width: undefined, height: undefined, variants: undefined };
}
export function isPlayableVideo(media: Media) {
  return media.kind === 'video' && (/\.(mp4|webm|mov)(?:[?#]|$)/i.test(media.src) || /^(blob:|data:video\/)/.test(media.src));
}

/**
 * One shape for a set of cards (a rail, a grid): landscape 16:9 when most sources are landscape, else 4:5. Cards in
 * one rail never mix heights, and landscape film stills are never forced into portrait cards (or the reverse).
 */
export const CARD_LANDSCAPE = 16 / 9;
export const CARD_PORTRAIT = .8;
export function cardRatio(sources: readonly (Media | undefined)[]) {
  const known = sources.filter((m): m is Media => !!m).map(displayedSource);
  if (!known.length) return CARD_PORTRAIT;
  const wide = known.filter((m) => mediaType(m) !== 'artwork' && mediaRatio(m) > 1.1).length;
  return wide * 2 > known.length ? CARD_LANDSCAPE : CARD_PORTRAIT;
}

/**
 * What a viewer actually sees for a source: a video's poster, or the delivered fallback when the source file was never
 * delivered (seed posters and stills). Real uploads declare their own dimensions and are returned unchanged.
 */
export function displayedSource(m: Media): Media {
  const key = (p?: string) => p?.replace(/^\//, '') ?? '';
  if (m.kind === 'video' && m.poster) return deliveredMedia(m, m.poster);
  if (!(m.width && m.height) && !MEDIA_GEOMETRY[key(m.src)] && m.fallback && MEDIA_GEOMETRY[key(m.fallback)]) return deliveredMedia(m, m.fallback);
  return m;
}
