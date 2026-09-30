import * as seed from '../data/seed';
import type { NetworkEvent, Opportunity, Org, Party, Person, Post, Viewer } from '../data/types';
import type { Scenario } from './store';
import { world } from './world';

export const party = (id: string): Party | undefined => seed.parties[id];
export const person = (id: string) => seed.parties[id] as Person;
export const org = (id: string) => seed.parties[id] as Org;

export function findOpportunity(id: string, userCollabs: Opportunity[] = []) {
  return userCollabs.find((o) => o.id === id) ?? seed.opportunities.find((o) => o.id === id) ?? world.roles.find((o) => o.id === id);
}

/** Opportunities the recommendation layer would return for this viewer. */
export function forYou(viewer: Viewer, scenario: Scenario): Opportunity[] {
  const matches = seed.opportunities.filter((o) => o.forCrafts.includes(viewer.craft) && o.authorId !== viewer.id);
  if (scenario.newUser) {
    // A brand-new profile only has role + city to go on, so we show fewer, broader matches and say so.
    return matches.slice(0, 2).map((o) => ({ ...o, match: ['Your role', o.city.split(' ')[0]] }));
  }
  return matches;
}

export function networkFor(viewer: Viewer, scenario: Scenario): NetworkEvent[] {
  if (scenario.newUser) return [];
  return [...(seed.networkEvents[viewer.id] ?? [])].sort((a, b) => a.weight - b.weight);
}

export function postsFor(viewer: Viewer, scenario: Scenario, following: string[], userPosts: Post[]): Post[] {
  const mine = userPosts.filter((p) => p.authorId === viewer.id);
  if (scenario.newUser || viewer.id === 'tara') return mine;
  return [...mine, ...seed.posts.filter((p) => following.includes(p.authorId))];
}

export const firstName = (p: Party) => (p.kind === 'org' ? p.name : p.name.split(' ')[0]);

export const kindLabel: Record<Opportunity['kind'], string> = {
  crew: 'Crew job',
  casting: 'Casting call',
  collab: 'Collaboration',
};

export const availableLabel = (from: string) => (from === 'Now' ? 'Available now' : `Available from ${from}`);
