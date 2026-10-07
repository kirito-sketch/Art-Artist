import { MEDIA_GEOMETRY } from '../data/mediaGeometry';
import type { Media, MediaFraming, MediaSurface, PostPresentation } from '../data/types';
import { mediaPosition, mediaRatio, mediaType } from './mediaLayout';

/** Destination policy. Original assets and source focal points are never modified. */
export const MEDIA_PRESETS: Record<MediaSurface, { ratio?: number; min?: number; max?: number; fit?: 'cover' | 'contain'; sizes: string }> = {
  preview: { sizes: '(max-width: 600px) 100vw, 430px' },
  post: { min: .75, max: 1.91, sizes: '(max-width: 600px) 100vw, 430px' },
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
  return choice === 'original' ? presentationRatio(media[0], 'post') : POST_FRAMES[choice];
}
export function mediaPresentation(media: Media, surface: MediaSurface = 'preview', frameRatio?: number) {
  const preset = MEDIA_PRESETS[surface];
  const setting = surface === 'original' ? undefined : media.presentations?.[surface];
  const ratio = mediaRatio(media), frame = frameRatio ?? presentationRatio(media, surface);
  const bounded = Math.abs(ratio - frame) > .02;
  const unknown = !(media.width && media.height && Number.isFinite(media.width) && Number.isFinite(media.height) && media.width > 0 && media.height > 0) && !MEDIA_GEOMETRY[media.src.replace(/^\//, '')];
  const preserve = mediaType(media) === 'artwork' || (surface === 'post' && bounded) || (unknown && surface !== 'profile-hero' && surface !== 'avatar');
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
  return src === media.src ? media : { ...media, src, contentType: undefined, width: undefined, height: undefined, variants: undefined };
}
export function isPlayableVideo(media: Media) {
  return media.kind === 'video' && (/\.(mp4|webm|mov)(?:[?#]|$)/i.test(media.src) || /^(blob:|data:video\/)/.test(media.src));
}

/** Controlled tiles chosen before load from stored source geometry. Unknowns preserve composition. */
export function bentoTile(media?: Media) {
  const ratio = media ? mediaRatio(media) : 1;
  const shape = ratio >= 1.65 ? 'wide' : ratio < .9 ? 'tall' : ratio >= 1.15 ? 'medium' : 'square';
  return { shape, ratio: shape === 'wide' ? Math.min(1.91, ratio) : shape === 'tall' ? Math.max(.65, ratio) : shape === 'medium' ? 4 / 3 : 1 };
}
