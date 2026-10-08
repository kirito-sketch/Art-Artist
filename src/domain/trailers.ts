import type { HouseProject, Trailer } from '../state/world';

/*
 * Trailer rules (docs/ux-refinement/PLAN.md, D6 and D7).
 *
 * D7: a trailer or teaser is required only to make a NEW project public at post-production or released. Drafts and
 * projects in development, pre-production or shooting never need one, and projects that existed before the rule keep
 * their still or poster fallback.
 */
export const TRAILER_STAGES = ['Post-production', 'Released'] as const;

export const publishedTrailers = (list: readonly Trailer[] = []) => list.filter((t) => t.status === 'published');

/** Why this project can't be public in this state, or null. `next` is the change being made (share, or a new stage). */
export function trailerGate(p: Pick<HouseProject, 'stage' | 'shared' | 'trailers' | 'trailerRule'>, next: { shared?: boolean; stage?: HouseProject['stage'] } = {}): string | null {
  const shared = next.shared ?? p.shared;
  const stage = next.stage ?? p.stage;
  if (!p.trailerRule || !shared || !(TRAILER_STAGES as readonly string[]).includes(stage)) return null;
  if (publishedTrailers(p.trailers).length) return null;
  return stage === 'Released' ? 'Add and publish a trailer or teaser before making a released project public.' : 'Add and publish a trailer or teaser before making a project in post-production public.';
}

/** The order versions are offered in: the project's own languages first, then the rest; trailers before teasers. */
export function orderVersions(list: readonly Trailer[], languages: readonly string[] = []): Trailer[] {
  const rank = (t: Trailer) => (languages.includes(t.language) ? languages.indexOf(t.language) : 99);
  return [...list].sort((a, b) => rank(a) - rank(b) || a.language.localeCompare(b.language) || (a.kind === b.kind ? 0 : a.kind === 'trailer' ? -1 : 1));
}

/** A trailer upload's own limits: longer than a showreel's, the same 1080p ceiling. */
export const TRAILER_LIMITS = { seconds: 5 * 60, longEdge: 1920, shortEdge: 1080, bytes: 500 * 1024 * 1024 };
export function trailerFileError(file: { size: number; name: string; type: string }) {
  if (!/\.(mp4|mov|webm)$/i.test(file.name) || !['video/mp4', 'video/quicktime', 'video/webm', ''].includes(file.type)) return 'Choose an MP4, MOV or WebM video.';
  if (!file.size) return 'This file is empty. Choose another video.';
  if (file.size > TRAILER_LIMITS.bytes) return 'Use an export of 500 MB or less.';
  return null;
}
export function trailerMetadataError(seconds: number, width: number, height: number) {
  if (!Number.isFinite(seconds) || seconds <= 0 || !width || !height) return 'This video could not be read. Try an MP4 export.';
  if (seconds > TRAILER_LIMITS.seconds) return 'Trailers and teasers can be up to 5 minutes.';
  if (Math.max(width, height) > TRAILER_LIMITS.longEdge || Math.min(width, height) > TRAILER_LIMITS.shortEdge) return 'Use a 1080p export or smaller.';
  return null;
}
