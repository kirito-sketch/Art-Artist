import type { Media } from '../data/types';
import type { ProfileCover, Reel } from '../state/profile';
import { videoEmbed } from './showreel';

export type CoverProject = { id: string; artwork?: Media };
/** Callers supply only public, eligible projects. Private reel drafts never enter this resolver. */
export function resolveProfileCover(choice: ProfileCover | undefined, images: Media[], projects: CoverProject[], reel?: Reel) {
  const publicReel = reel && (reel.source?.kind !== 'native' || reel.source.status === 'ready') ? reel : undefined;
  const playable = !!publicReel && (publicReel.source?.kind === 'native' ? !!publicReel.url : !!videoEmbed(publicReel.source, publicReel.url));
  if (choice?.kind === 'portfolio') {
    const media = images.find((m) => m.id === choice.mediaId && m.kind === 'image');
    if (media) return { media, showreel: false };
  }
  if (choice?.kind === 'project') {
    const media = projects.find((p) => p.id === choice.projectId)?.artwork;
    if (media) return { media, showreel: false };
  }
  if (choice?.kind === 'showreel' && publicReel) return { media: publicReel.cover, showreel: playable };
  return { media: images.find((m) => m.kind === 'image') ?? projects.find((p) => p.artwork)?.artwork ?? publicReel?.cover, showreel: false };
}
