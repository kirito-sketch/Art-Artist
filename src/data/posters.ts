import type { Media } from './types';

/*
 * Official 2:3 theatrical posters, by project id (docs/ux-refinement/POSTER_INVENTORY.md). Only artwork supplied by
 * the production goes here: a still is never cropped into a poster, and generated art is never presented as one.
 * Until a project's poster is listed, its credit shows the type-set poster (src/ui/PosterCard.tsx).
 *
 * To add one: put the file at public/images/posters/<project id>.jpg (2:3; 600×900 or larger preferred) and add the id below.
 */
const SUPPLIED: string[] = ['faultlines', 'neeliraat', 'monsoon', 'kaaval', 'ratri', 'dhoop'];

export const posterFor = (projectId: string): Media | undefined =>
  SUPPLIED.includes(projectId) ? { id: `poster-${projectId}`, kind: 'image', src: `images/posters/${projectId}.jpg`, width: 334, height: 501 } : undefined;
