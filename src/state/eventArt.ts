import * as seed from '../data/seed';
import type { IndustryEvent, Media } from '../data/types';
import { isLive } from '../data/works';
import { work, worksForOrg } from './world';

/**
 * What an event looks like (one rule for the New version): its own cover, else its film, else the host's current
 * project, else the host's own work. Existing images only; nothing is generated.
 */
export function eventArt(e: IndustryEvent): Media | undefined {
  if (e.cover) return e.cover;
  const w = e.projectId ? work(e.projectId) : undefined;
  if (w && w.media.id !== 'ph') return w.stills[0] ?? w.media;
  const lead = worksForOrg(e.hostId).filter((x) => x.media.id !== 'ph').sort((a, b) => Number(isLive(b)) - Number(isLive(a)))[0];
  if (lead) return lead.stills[0] ?? lead.media;
  return (seed.portfolio[e.hostId] ?? []).find((m) => m.kind === 'image');
}
