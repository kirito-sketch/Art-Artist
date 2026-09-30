import * as seed from '../data/seed';
import type { NetworkEvent, Opportunity, Org, Party, Person, Post, Viewer } from '../data/types';
import type { Scenario } from './store';
import { world } from './world';
import { blockedBy, publicProjects, recommendedRoles } from '../domain/discovery';

export const party = (id: string): Party | undefined => seed.parties[id];
export const person = (id: string) => seed.parties[id] as Person;
export const org = (id: string) => seed.parties[id] as Org;

export function findOpportunity(id: string, userCollabs: Opportunity[] = []) {
  return userCollabs.find((o) => o.id === id) ?? seed.opportunities.find((o) => o.id === id) ?? world.roles.find((o) => o.id === id);
}

/** Opportunities the recommendation layer would return for this viewer. */
export function forYou(viewer: Viewer, scenario: Scenario): Opportunity[] {
  const matches = recommendedRoles(viewer.id, viewer.craft);
  if (scenario.newUser) {
    // A brand-new profile only has role + city to go on, so we show fewer, broader matches and say so.
    return matches.slice(0, 2).map((o) => ({ ...o, match: ['Your role', o.city.split(' ')[0]] }));
  }
  return matches;
}

export function networkFor(viewer: Viewer, scenario: Scenario): NetworkEvent[] {
  if (scenario.newUser) return [];
  const blocked = blockedBy(viewer.id);
  return [...(seed.networkEvents[viewer.id] ?? [])].filter((e) => !e.actorIds.some((a) => blocked.includes(a))).sort((a, b) => a.weight - b.weight);
}

export function postsFor(viewer: Viewer, scenario: Scenario, following: string[], userPosts: Post[]): Post[] {
  const mine = userPosts.filter((p) => p.authorId === viewer.id);
  if (scenario.newUser || viewer.id === 'tara') return mine;
  const blocked = blockedBy(viewer.id);
  return [...mine, ...seed.posts.filter((p) => following.includes(p.authorId) && !blocked.includes(p.authorId))];
}

/**
 * Discover → Posts: posts are public, so Discover shows everyone's (people you follow first), minus
 * anyone blocked either way. Home's "Latest posts" stays limited to people you follow.
 */
export function discoverPosts(viewer: Viewer, following: string[], userPosts: Post[]): Post[] {
  const blocked = blockedBy(viewer.id);
  const others = seed.posts.filter((p) => p.authorId !== viewer.id && !blocked.includes(p.authorId));
  const mine = userPosts.filter((p) => p.authorId === viewer.id && p.status !== 'failed');
  return [...mine, ...others.filter((p) => following.includes(p.authorId)), ...others.filter((p) => !following.includes(p.authorId))];
}

/** The public project a post is about, when there is one. */
export function postWork(post: Post) {
  if (!post.project) return undefined;
  const t = post.project.toLowerCase();
  return publicProjects().find((w) => w.title.toLowerCase() === t);
}

export const firstName = (p: Party) => (p.kind === 'org' ? p.name : p.name.split(' ')[0]);

export const kindLabel: Record<Opportunity['kind'], string> = {
  crew: 'Crew job',
  casting: 'Casting call',
  collab: 'Collaboration',
};

export const availableLabel = (from: string) => (from === 'Now' ? 'Available now' : `Available from ${from}`);
