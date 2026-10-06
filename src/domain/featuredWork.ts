import { publicCreditsFor } from './discovery';
import { world } from '../state/world';
import { profileOf, type FeaturedWork } from '../state/profile';

export function eligibleFeaturedProjects(personId: string) {
  const credited = new Set(publicCreditsFor(personId).map((c) => c.projectId));
  return world.projects.filter((p) => p.shared && (p.ownerId === personId || credited.has(p.id)));
}

export function safeWorkUrl(raw: string) {
  try { const u = new URL(raw.trim()); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; }
  catch { return null; }
}

export function featuredWorkOf(personId: string): FeaturedWork[] {
  const p = profileOf(personId);
  const eligible = new Set(eligibleFeaturedProjects(personId).map((w) => w.id));
  return (p.featuredWork ?? p.workLinks.map((l) => ({ id: l.id, kind: 'external' as const, title: l.label, url: l.url })))
    .filter((f) => f.kind === 'project' ? eligible.has(f.projectId) : !!safeWorkUrl(f.url));
}
