import type { Media } from '../data/types';
import type { ProfileCover, Reel } from '../state/profile';
import { videoEmbed } from './showreel';
import { mediaPosition } from './mediaLayout';

export type CoverProject = { id: string; artwork?: Media };
/** Callers supply only public, eligible projects. Private reel drafts never enter this resolver. */
export function resolveProfileCover(choice: ProfileCover | undefined, images: Media[], projects: CoverProject[], reel?: Reel, portrait?: Media) {
  const publicReel = reel && (reel.source?.kind !== 'native' || reel.source.status === 'ready') ? reel : undefined;
  const playable = !!publicReel && (publicReel.source?.kind === 'native' ? !!publicReel.url : !!videoEmbed(publicReel.source, publicReel.url));
  if (choice?.kind === 'portrait' && portrait) return { media: portrait, showreel: false };
  if (choice?.kind === 'portfolio') {
    const media = images.find((m) => m.id === choice.mediaId && m.kind === 'image');
    if (media) return { media, showreel: false };
  }
  if (choice?.kind === 'project') {
    const media = projects.find((p) => p.id === choice.projectId)?.artwork;
    if (media) return { media, showreel: false };
  }
  if (choice?.kind === 'showreel' && publicReel) return { media: publicReel.cover, showreel: playable };
  return { media: portrait ?? images.find((m) => m.kind === 'image') ?? projects.find((p) => p.artwork)?.artwork ?? publicReel?.cover, showreel: false };
}

/** Stored percentages cannot put the focal point outside the image or inject invalid CSS. */
export function profileCoverPosition(choice?: ProfileCover, media?: Media) {
  if (media) return mediaPosition(media, choice?.focal ?? media.focal);
  const percent = (value: number | undefined, fallback: number) => Number.isFinite(value) ? Math.max(0, Math.min(100, value!)) : fallback;
  return `${percent(choice?.focal?.x, 50)}% ${percent(choice?.focal?.y, choice?.kind === 'portrait' || !choice || choice.kind === 'auto' ? 35 : 50)}%`;
}
