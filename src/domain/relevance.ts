/*
 * Relevance (V30, docs/V30.md): one adaptable model instead of a Home per craft.
 *
 * The question Home answers is "what matters to me right now?". Two things decide it:
 *  - who you are: primary craft, other crafts, city, availability, network;
 *  - what you are trying to do right now: your professional intent, which changes over time
 *    (finding work, building a team, collaborating, growing a network, not looking).
 *
 * The layout stays the same for everyone. Intent changes the ORDER of Home's sections and the
 * RANKING inside each one, and every recommendation carries the reason it is there.
 */
import * as seed from '../data/seed';
import type { Craft, Opportunity, Person } from '../data/types';
import { isLive } from '../data/works';
import { worksForOrg } from '../state/world';
import { blockedBy, discoverableProjects, discoverableRoles, publicCreditsFor, searchablePeople } from './discovery';

export type Intent = 'work' | 'hire' | 'collaborate' | 'network' | 'explore';

/** How intent is offered to people: plain actions, never persona labels. */
export const INTENTS: { id: Intent; label: string; hint: string; status: string }[] = [
  { id: 'work', label: 'Find work', hint: 'Roles, casting and paid work in your craft', status: 'Looking for work' },
  { id: 'hire', label: 'Find people for a project', hint: 'Crew, cast and collaborators for something you are making', status: 'Building a team' },
  { id: 'collaborate', label: 'Collaborate', hint: 'Short films, music videos and passion projects', status: 'Open to collaborations' },
  { id: 'network', label: 'Grow my network', hint: 'People in your craft and the work they do', status: 'Growing my network' },
  { id: 'explore', label: 'Just exploring', hint: 'Not looking right now', status: 'Not looking right now' },
];
export const intentDef = (i: Intent) => INTENTS.find((x) => x.id === i)!;

/** Crafts whose people usually assemble teams. Used only as a default until the person says otherwise. */
const ASSEMBLES = new Set<Craft>(['director', 'production']);
export const defaultIntent = (craft: Craft): Intent => (ASSEMBLES.has(craft) ? 'hire' : 'work');

export type HomeSection = 'forYou' | 'people' | 'activity' | 'projects';

/** Same four sections for everyone; intent decides their order. Opportunities sink when you are hiring or not looking. */
export const HOME_ORDER: Record<Intent, HomeSection[]> = {
  work: ['forYou', 'projects', 'people', 'activity'],
  collaborate: ['forYou', 'people', 'projects', 'activity'],
  hire: ['people', 'activity', 'projects', 'forYou'],
  network: ['people', 'activity', 'projects', 'forYou'],
  explore: ['activity', 'projects', 'people', 'forYou'],
};

const firstCity = (c: string) => c.split(/[ &,·]/)[0];

export interface Ranked<T> {
  item: T;
  why: string;
}

// ------------------------------------------------------------------------------------- opportunities
/**
 * Opportunities: roles, casting and collaboration requests, ranked for this person and intent.
 * Primary craft weighs most, then other crafts, then city, then what the intent asks for.
 */
export function opportunitiesFor(me: Person, intent: Intent, userCollabs: Opportunity[] = [], hidden: Record<string, unknown> = {}): Ranked<Opportunity>[] {
  const crafts = [me.craft, ...(me.crafts ?? [])];
  const blocked = blockedBy(me.id);
  const scored = discoverableRoles(me.id, userCollabs, blocked)
    .filter((o) => !hidden[o.id] && o.authorId !== me.id)
    .map((o) => {
      const primary = o.forCrafts.includes(me.craft);
      const other = !primary && o.forCrafts.some((c) => crafts.includes(c));
      const near = !!me.city && o.city.includes(me.city);
      let score = (primary ? 10 : other ? 6 : 0) + (near ? 3 : 0) + (o.highlight ? 1 : 0) + (o.closesInDays !== undefined && o.closesInDays <= 5 ? 1 : 0);
      if (intent === 'collaborate') score += o.kind === 'collab' ? 4 : 0;
      if (intent === 'work') score += o.kind !== 'collab' || o.paid ? 2 : 0;
      const reason = [primary ? 'Your craft' : other ? 'One of your crafts' : '', near ? `In ${me.city}` : o.distance === 'Travel covered' ? 'Travel covered' : ''].filter(Boolean).join(' · ');
      return { item: o, why: o.highlight ?? reason, score, relevant: primary || other };
    })
    .filter((x) => x.relevant)
    .sort((a, b) => b.score - a.score);
  return scored.map(({ item, why }) => ({ item, why }));
}

// --------------------------------------------------------------------------------------------- people
/**
 * People you may want to work with. What "useful" means depends on intent:
 *  - finding work: people in your craft to learn from, and the people who hire (directors, producers);
 *  - hiring / collaborating: people in OTHER crafts, available first, nearby first;
 *  - networking / exploring: people in your craft and city.
 */
export function peopleFor(me: Person, intent: Intent, following: string[]): Ranked<Person>[] {
  const mine = new Set<Craft>([me.craft, ...(me.crafts ?? [])]);
  const curated = new Set(seed.suggestedFor[me.id] ?? []);
  const team = intent === 'hire' || intent === 'collaborate';
  const scored = searchablePeople(me.id).map((p) => {
    const sameCraft = mine.has(p.craft);
    const near = !!me.city && p.city === me.city;
    const available = !!p.availableFrom;
    const credits = publicCreditsFor(p.id).length;
    const hires = ASSEMBLES.has(p.craft);
    let score = (near ? 3 : 0) + (curated.has(p.id) ? 2 : 0) + Math.min(credits, 3) * 0.5 - (following.includes(p.id) ? 2 : 0);
    if (team) score += (sameCraft ? -4 : 4) + (available ? 4 : 0);
    else if (intent === 'work') score += (sameCraft ? 3 : 0) + (hires ? 4 : 0);
    else score += sameCraft ? 4 : 0;
    const why = team
      ? [available ? `Available from ${p.availableFrom}` : '', near ? `In ${me.city}` : p.city].filter(Boolean).join(' · ')
      : intent === 'work' && hires && !sameCraft
        ? `Hires crew · ${near ? me.city : p.city}`
        : [sameCraft ? 'Your craft' : '', near ? `In ${me.city}` : p.city].filter(Boolean).join(' · ');
    return { item: p, why, score };
  });
  return scored.sort((a, b) => b.score - a.score).map(({ item, why }) => ({ item, why }));
}

// ------------------------------------------------------------------------------------------- projects
/** Active projects only (pre-production, shooting, post): the ones you can still be part of. Hiring first, your city next. */
export function projectsFor(me: Person, hidden: Record<string, unknown> = {}) {
  const roles = discoverableRoles(me.id).filter((r) => !hidden[r.id]);
  return discoverableProjects(blockedBy(me.id))
    .filter((w) => w.ownerId !== me.id && w.orgIds.length && isLive(w))
    .map((w) => {
      const hiring = roles.filter((r) => r.project.toLowerCase().startsWith(w.title.toLowerCase().split(' ·')[0]) || (r as { projectId?: string }).projectId === w.id).length;
      const house = seed.orgs.find((o) => o.id === w.orgIds[0]);
      const near = !!house && !!me.city && house.city === me.city;
      return { w, hiring, near, score: (hiring ? 4 : 0) + (near ? 2 : 0) };
    })
    .sort((a, b) => b.score - a.score);
}

/** Houses for a city first, then those making something now. Production houses surface through their projects on Home. */
export function housesFor(me: Person) {
  return seed.orgs
    .filter((o) => o.verified && !blockedBy(me.id).includes(o.id))
    .map((o) => ({ o, live: worksForOrg(o.id).some(isLive) }))
    .sort((a, b) => Number(b.o.city === me.city) - Number(a.o.city === me.city) || Number(b.live) - Number(a.live));
}

export { firstCity };
