import * as seed from '../data/seed';
import type { Notification, Opportunity } from '../data/types';
import { publicWorks, world, project as wproject } from '../state/world';

/*
 * What each surface may show. Discover, profiles and notifications read through these, and the
 * automated privacy checks read through the same functions, so "never public" is tested where it is decided.
 */

/** Everyone and every house this person has blocked. Blocks are shared records, so every surface reads the same list. */
export const blockedBy = (viewerId: string) => world.blocks.filter((b) => b.by === viewerId).map((b) => b.target);

/** People this viewer can find: public profiles, minus anyone they have blocked. */
export const searchablePeople = (viewerId: string, blocked: string[] = blockedBy(viewerId)) => seed.people.filter((p) => p.id !== viewerId && p.visibility === 'public' && !blocked.includes(p.id));

/**
 * Active, promoted content from someone you blocked (roles, recommendations, suggestions) is hidden.
 * Their historical records (accepted credits, past projects) are not: those stay reachable from the record.
 */
const fromBlocked = (o: Opportunity, blocked: string[]) => blocked.includes(o.orgId ?? o.authorId ?? '');

/** Roles Discover can list for this viewer: open project roles, their own collaborations, and other listings. */
export function discoverableRoles(viewerId: string, userCollabs: Opportunity[] = [], blocked: string[] = blockedBy(viewerId)): Opportunity[] {
  return [...world.roles.filter((r) => r.visibility === 'open'), ...userCollabs, ...seed.opportunities.filter((o) => o.authorId !== viewerId)].filter((o) => !fromBlocked(o, blocked));
}

/** Roles recommended on Home for this viewer's craft, minus anyone they blocked. */
export function recommendedRoles(viewerId: string, craft: string, blocked: string[] = blockedBy(viewerId)): Opportunity[] {
  return [...world.roles.filter((r) => r.visibility === 'open'), ...seed.opportunities].filter((o) => o.forCrafts.includes(craft as never) && o.authorId !== viewerId && !fromBlocked(o, blocked));
}

/** Productions that appear in search and suggestions. Unverified houses are visible only to people who act for them. */
export const searchableHouses = (blocked: string[] = []) => seed.orgs.filter((o) => o.verified && !blocked.includes(o.id));

/** Public projects Discover suggests: shared ones, minus those led by a house you blocked. A direct link still opens the record. */
export const discoverableProjects = (blocked: string[] = []) => publicWorks().filter((w) => !blocked.includes(w.orgIds[0] ?? w.ownerId ?? ''));

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
