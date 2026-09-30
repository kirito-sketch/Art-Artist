import * as seed from '../data/seed';
import type { Notification, Opportunity } from '../data/types';
import { publicWorks, world, project as wproject } from '../state/world';

/*
 * What each surface may show. Discover, profiles and notifications read through these, and the
 * automated privacy checks read through the same functions, so "never public" is tested where it is decided.
 */

/** People this viewer can find: public profiles, minus anyone they have blocked. */
export const searchablePeople = (viewerId: string, blocked: string[] = []) => seed.people.filter((p) => p.id !== viewerId && p.visibility === 'public' && !blocked.includes(p.id));

/** Roles Discover can list for this viewer: open project roles, their own collaborations, and other listings. */
export function discoverableRoles(viewerId: string, userCollabs: Opportunity[] = []): Opportunity[] {
  return [...world.roles.filter((r) => r.visibility === 'open'), ...userCollabs, ...seed.opportunities.filter((o) => o.authorId !== viewerId)];
}

/** Productions that appear in search. Unverified houses are visible only to people who act for them. */
export const searchableHouses = (blocked: string[] = []) => seed.orgs.filter((o) => o.verified && !blocked.includes(o.id));

/** Projects anyone can see: only those the owner has shared. */
export const publicProjects = publicWorks;

/** Credits that show on a person's public profile: accepted, on a project the production has shared. */
export function publicCreditsFor(personId: string) {
  return world.credits.filter((c) => c.personId === personId && c.status === 'accepted' && wproject(c.projectId)?.shared);
}

/** Notifications for this person: their own, plus those of every house they may act for. */
export function notificationsFor(viewerId: string, memberships: string[], local: Notification[] = []): Notification[] {
  return [...world.notifications.filter((n) => n.toPersonId === viewerId || (!!n.forId && memberships.includes(n.forId))), ...local];
}
