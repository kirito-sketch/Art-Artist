/*
 * Relevance (V30, docs/V30.md): one adaptable model instead of a Home per craft.
 *
 * Home answers two questions, weighted by how much the product knows about the person:
 *  - for an established person: "what matters to me right now?";
 *  - for a first-time person: "is this network worth using?". Their first Home shows the strongest
 *    real value for someone like them: people, opportunities, projects and creative work.
 *
 * Inputs: who you are (primary craft, other crafts, city, availability, network), what you are trying
 * to do now (intent), and how much behaviour there is yet (stage). The layout is the same for everyone:
 * intent and stage change the ORDER of Home's modules, their titles, and the RANKING inside them.
 *
 * Nothing is allowed to go sparse. Every list widens step by step:
 *   1. exact (craft, intent, city, availability) → 2. adjacent (complementary crafts, nearby)
 *   → 3. broader industry (active projects, credible people, houses) → 4. curated discovery (strong work).
 * Every item carries the reason it is there.
 */
import * as seed from '../data/seed';
import type { Craft, NetworkEvent, Opportunity, Person, Post } from '../data/types';
import { isLive } from '../data/works';
import { worksForOrg } from '../state/world';
import { blockedBy, discoverableProjects, discoverableRoles, publicCreditsFor, searchableHouses, searchablePeople } from './discovery';

export type Intent = 'work' | 'hire' | 'collaborate' | 'network' | 'explore';

/** How intent is offered to people: plain actions, never persona labels. */
export const INTENTS: { id: Intent; label: string; short: string; hint: string; status: string }[] = [
  { id: 'work', label: 'Find work', short: 'Find work', hint: 'Roles, casting and paid work in your craft', status: 'Looking for work' },
  { id: 'hire', label: 'Find people for a project', short: 'Find people', hint: 'Crew, cast and collaborators for something you are making', status: 'Building a team' },
  { id: 'collaborate', label: 'Collaborate', short: 'Collaborate', hint: 'Short films, music videos and passion projects', status: 'Open to collaborations' },
  { id: 'network', label: 'Grow my network', short: 'Grow network', hint: 'People in your craft and the work they do', status: 'Growing my network' },
  { id: 'explore', label: 'Just exploring', short: 'Exploring', hint: 'Not looking right now', status: 'Not looking right now' },
];
export const intentDef = (i: Intent) => INTENTS.find((x) => x.id === i)!;

/** Crafts whose people usually assemble teams. Used only as a default until the person says otherwise. */
const ASSEMBLES = new Set<Craft>(['director', 'production']);
export const defaultIntent = (craft: Craft): Intent => (ASSEMBLES.has(craft) ? 'hire' : 'work');

/** Crafts that work side by side: the first widening step when exact matches run thin. */
const ADJACENT: Partial<Record<Craft, Craft[]>> = {
  cinematographer: ['camera', 'lighting', 'colourist'],
  camera: ['cinematographer', 'lighting'],
  lighting: ['cinematographer', 'camera'],
  editor: ['colourist', 'vfx', 'sound'],
  colourist: ['editor', 'cinematographer', 'vfx'],
  vfx: ['editor', 'colourist'],
  sound: ['music', 'editor'],
  music: ['sound'],
  'production-design': ['costume', 'makeup'],
  costume: ['production-design', 'makeup'],
  makeup: ['costume', 'production-design'],
  director: ['writing', 'production'],
  writing: ['director'],
  production: ['director'],
};

/**
 * How much Home knows yet. Same modules at every stage; only composition and ranking change.
 *  - first: just out of onboarding, no behaviour. Show the network's value, broadly.
 *  - early: a new person who has started following, saving or showing interest. Those signals start to count.
 *  - established: an active network. Personal relevance and activity lead.
 */
export type Stage = 'first' | 'early' | 'established';
export function stageOf(isNew: boolean, signals: Signals): Stage {
  if (!isNew) return 'established';
  return signals.following.length || signals.savedRoleCrafts.length || signals.interested ? 'early' : 'first';
}

/** Behaviour that sharpens ranking as it accumulates (early usage). */
export interface Signals {
  following: string[];
  savedRoleCrafts: Craft[];
  interested: number;
}

export type HomeSection = 'forYou' | 'people' | 'projects' | 'activity' | 'work';

/**
 * Module order. The person's intent decides priority, but every Home shows people, opportunities,
 * projects and creative work somewhere, so nobody mistakes Art and Artist for only a job board, a
 * hiring directory or a feed. Established Homes put personal activity higher; creative work stays last.
 */
// Looking for work or a collaboration, the roles section already shows the projects behind each role; a
// "Projects you could join" tray under it repeated the same projects with a hiring count. Those intents don't get it.
export function homeOrder(intent: Intent, stage: Stage): HomeSection[] {
  if (stage === 'established')
    return {
      work: ['forYou', 'people', 'activity', 'work'],
      collaborate: ['forYou', 'people', 'activity', 'work'],
      hire: ['people', 'activity', 'projects', 'forYou', 'work'],
      network: ['people', 'activity', 'work', 'projects', 'forYou'],
      explore: ['activity', 'projects', 'work', 'people', 'forYou'],
    }[intent] as HomeSection[];
  return {
    work: ['forYou', 'people', 'activity', 'work'],
    collaborate: ['forYou', 'people', 'work', 'activity'],
    hire: ['people', 'projects', 'activity', 'forYou', 'work'],
    network: ['people', 'work', 'activity', 'projects', 'forYou'],
    explore: ['projects', 'work', 'people', 'activity', 'forYou'],
  }[intent] as HomeSection[];
}

export interface Ranked<T> {
  item: T;
  why: string;
  /** 1 exact · 2 adjacent · 3 broader industry · 4 curated discovery */
  tier: 1 | 2 | 3 | 4;
}

const take = <T,>(list: Ranked<T>[], min: number) => list.slice(0, Math.max(min, list.filter((x) => x.tier === 1).length));

// ------------------------------------------------------------------------------------- opportunities
/**
 * Opportunities: roles, casting and collaboration requests. Exact craft first, then adjacent crafts,
 * then anything near you, then the strongest open work on Art and Artist. Never fewer than `min`
 * while there is anything open.
 */
export function opportunitiesFor(me: Person, intent: Intent, userCollabs: Opportunity[] = [], hidden: Record<string, unknown> = {}, signals?: Signals, min = 5): Ranked<Opportunity>[] {
  const crafts = [me.craft, ...(me.crafts ?? [])];
  const adjacent = new Set(crafts.flatMap((c) => ADJACENT[c] ?? []).filter((c) => !crafts.includes(c)));
  const saved = new Set(signals?.savedRoleCrafts ?? []);
  const scored = discoverableRoles(me.id, userCollabs, blockedBy(me.id))
    .filter((o) => !hidden[o.id] && o.authorId !== me.id)
    .map((o) => {
      const primary = o.forCrafts.includes(me.craft);
      const other = !primary && o.forCrafts.some((c) => crafts.includes(c));
      const adj = !primary && !other && o.forCrafts.some((c) => adjacent.has(c));
      const near = !!me.city && o.city.includes(me.city);
      const tier: Ranked<Opportunity>['tier'] = primary || other ? 1 : adj ? 2 : near ? 3 : 4;
      let score = (primary ? 10 : other ? 6 : adj ? 3 : 0) + (near ? 3 : 0) + (o.highlight ? 1 : 0) + (o.closesInDays !== undefined && o.closesInDays <= 5 ? 1 : 0);
      score += o.forCrafts.some((c) => saved.has(c)) ? 2 : 0; // early usage: what you saved says what you want
      if (intent === 'collaborate') score += o.kind === 'collab' ? 4 : 0;
      if (intent === 'work') score += o.kind !== 'collab' || o.paid ? 2 : 0;
      const why =
        o.highlight ??
        (tier === 1
          ? [primary ? 'Your craft' : 'One of your crafts', near ? `In ${me.city}` : o.distance === 'Travel covered' ? 'Travel covered' : ''].filter(Boolean).join(' · ')
          : tier === 2
            ? 'Close to your craft'
            : tier === 3
              ? `Open in ${me.city}`
              : 'Open on Art and Artist');
      return { item: o, why, tier, score };
    })
    .sort((a, b) => a.tier - b.tier || b.score - a.score);
  return take(scored.map(({ item, why, tier }) => ({ item, why, tier })), min);
}

// --------------------------------------------------------------------------------------------- people
/**
 * People worth your attention. What "useful" means depends on intent:
 *  - finding work: your craft, and the people who hire (directors, producers);
 *  - hiring / collaborating: OTHER crafts, available first, nearby first;
 *  - networking / exploring: your craft and city.
 * Early usage: people in the crafts you have started following rank higher. Credible people
 * (verified credits) always rank up, so a thin match still shows real professionals.
 */
export function peopleFor(me: Person, intent: Intent, following: string[], signals?: Signals): Ranked<Person>[] {
  const mine = new Set<Craft>([me.craft, ...(me.crafts ?? [])]);
  const curated = new Set(seed.suggestedFor[me.id] ?? []);
  const followedCrafts = new Set((signals?.following ?? []).map((id) => seed.people.find((p) => p.id === id)?.craft).filter(Boolean));
  const team = intent === 'hire' || intent === 'collaborate';
  const scored = searchablePeople(me.id).map((p) => {
    const sameCraft = mine.has(p.craft);
    const near = !!me.city && p.city === me.city;
    const available = !!p.availableFrom;
    const credits = publicCreditsFor(p.id).length;
    const hires = ASSEMBLES.has(p.craft);
    let score = (near ? 3 : 0) + (curated.has(p.id) ? 2 : 0) + Math.min(credits, 3) * 0.75 - (following.includes(p.id) ? 3 : 0) + (followedCrafts.has(p.craft) ? 1.5 : 0);
    if (team) score += (sameCraft ? -4 : 4) + (available ? 4 : 0);
    else if (intent === 'work') score += (sameCraft ? 3 : 0) + (hires ? 4 : 0) + (me.craft === 'actor' && hires ? 2 : 0);
    else score += sameCraft ? 4 : 0;
    const relevant = team ? !sameCraft : intent === 'work' ? sameCraft || hires : sameCraft;
    const tier: Ranked<Person>['tier'] = relevant && near ? 1 : relevant ? 2 : credits ? 3 : 4;
    const why = team
      ? [available ? `Available from ${p.availableFrom}` : '', near ? `In ${me.city}` : p.city].filter(Boolean).join(' · ')
      : intent === 'work' && hires && !sameCraft
        ? `Hires crew · ${near ? me.city : p.city}`
        : sameCraft
          ? ['Your craft', near ? `In ${me.city}` : p.city].join(' · ')
          : credits
            ? `${credits} verified ${credits === 1 ? 'credit' : 'credits'} · ${p.city}`
            : p.city;
    return { item: p, why, tier, score };
  });
  return scored.sort((a, b) => b.score - a.score).map(({ item, why, tier }) => ({ item, why, tier }));
}

/** Professionals available now, other crafts first (the people tray's "Available now" filter). */
export function availableFor(me: Person, following: string[]): Ranked<Person>[] {
  return peopleFor(me, 'hire', following).filter((r) => !!r.item.availableFrom);
}

// ------------------------------------------------------------------------------------------- projects
/**
 * Projects: being made now and hiring first, then being made nearby, then recent released work by
 * verified productions, so the tray always shows real projects happening on Art and Artist.
 */
export function projectsFor(me: Person, hidden: Record<string, unknown> = {}, min = 4) {
  const roles = discoverableRoles(me.id).filter((r) => !hidden[r.id]);
  const all = discoverableProjects(blockedBy(me.id))
    .filter((w) => w.ownerId !== me.id && w.orgIds.length)
    .map((w) => {
      const hiring = roles.filter((r) => r.project.toLowerCase().startsWith(w.title.toLowerCase().split(' ·')[0]) || (r as { projectId?: string }).projectId === w.id).length;
      const house = seed.orgs.find((o) => o.id === w.orgIds[0]);
      const near = !!house && !!me.city && house.city === me.city;
      const live = isLive(w);
      return { w, hiring, near, live, score: (live ? 6 : 0) + (hiring ? 4 : 0) + (near ? 2 : 0) };
    })
    .sort((a, b) => b.score - a.score);
  const live = all.filter((x) => x.live);
  return live.length >= min ? live : [...live, ...all.filter((x) => !x.live)].slice(0, Math.max(min, live.length));
}

/** Verified production houses, your city first, then those making something now, then those hiring. */
export function housesFor(me: Person) {
  const roles = discoverableRoles(me.id);
  return searchableHouses(blockedBy(me.id))
    .map((o) => ({ o, live: worksForOrg(o.id).some(isLive), hiring: roles.filter((r) => r.orgId === o.id).length }))
    .sort((a, b) => Number(b.o.city === me.city) - Number(a.o.city === me.city) || b.hiring - a.hiring || Number(b.live) - Number(a.live));
}

// ------------------------------------------------------------------------------------------- activity
/**
 * Industry activity: public professional events on Art and Artist (credits issued, projects started,
 * people becoming available, collaboration requests). A first-time person has no network yet, so this
 * stands in for "your network" and shows the community is active. Portfolio and reel uploads are excluded.
 */
export function industryActivity(me: Person, exclude: string[] = []): NetworkEvent[] {
  const blocked = blockedBy(me.id);
  const seen = new Set<string>();
  return Object.values(seed.networkEvents)
    .flat()
    .filter((e) => e.kind !== 'portfolio' && e.kind !== 'reel' && !exclude.includes(e.id))
    .filter((e) => !e.actorIds.some((a) => a === me.id || blocked.includes(a)))
    .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
    .sort((a, b) => a.weight - b.weight);
}

// ------------------------------------------------------------------------------------------- work
/**
 * Creative work, contained: posts with media from people in your craft first, then adjacent crafts,
 * then the strongest work in the community. Never the main feed: a tray, at most eight.
 */
export function workFor(me: Person, following: string[], userPosts: Post[] = []): Ranked<Post>[] {
  const crafts = new Set<Craft>([me.craft, ...(me.crafts ?? [])]);
  const adjacent = new Set([...crafts].flatMap((c) => ADJACENT[c] ?? []));
  const blocked = blockedBy(me.id);
  return [...seed.posts, ...userPosts.filter((p) => p.authorId !== me.id && p.status !== 'failed')]
    .filter((p) => p.media.length && p.authorId !== me.id && !blocked.includes(p.authorId))
    .map((p) => {
      const a = seed.people.find((x) => x.id === p.authorId);
      const tier: Ranked<Post>['tier'] = a && crafts.has(a.craft) ? 1 : a && adjacent.has(a.craft) ? 2 : following.includes(p.authorId) ? 3 : 4;
      const why = tier === 1 ? 'Your craft' : a ? a.role : '';
      return { item: p, why, tier, score: -tier * 10 + (p.likes ?? 0) / 100 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ item, why, tier }) => ({ item, why, tier }));
}
