import * as seed from '../../data/seed';
import type { Craft, IndustryEvent, Media, Opportunity, Person, Post } from '../../data/types';
import { isLive, type Work } from '../../data/works';
import { agoDays, pickSpotlight, type SpotContext, type SpotItem, type Spotlit } from '../../domain/spotlight';
import { stats } from '../../domain/reviews';
import { priceLabel, typeLabel, whenLabel } from '../../domain/events';
import { creditedOn } from '../../domain/home/graph';
import { org, party, person } from '../../state/selectors';
import { reviewsOf, work } from '../../state/world';
import type { SavedKind } from '../../state/store';

/*
 * District Home's Spotlight, from real data to cards (docs/DISTRICT_FIXES.md). The rules live in
 * domain/spotlight.ts; this turns roles, projects, posts, events and releases into SpotItems and the
 * chosen ones into cards with one label, a title, one meta line and one fact.
 */

const DAY = 864e5;
/** The team's national pin (a SpotItem key, e.g. "release:dhoop"). Never per craft. Unset in the prototype. */
export const SPOTLIGHT_PIN: string | undefined = undefined;

export interface SpotSources {
  now: number;
  me: Person;
  roles: Opportunity[];
  projects: Work[];
  rolesOf: (w: Work) => Opportunity[];
  posts: Post[];
  events: IndustryEvent[];
  releases: Work[];
}

const houseOf = (w: Work) => (w.orgIds[0] ? org(w.orgIds[0]) : undefined);
const cityOf = (w: Work) => houseOf(w)?.city ?? (w.ownerId ? person(w.ownerId).city : '');
const langOf = (w: Work) => w.format.split(' · ')[1];
const day = (ms: number) => new Date(ms).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' });

export function spotItems(s: SpotSources): SpotItem[] {
  const out: SpotItem[] = [];
  for (const o of s.roles) {
    if (o.authorId === s.me.id) continue;
    out.push({ key: `role:${o.id}`, type: 'role', ref: o.id, title: o.project, organiser: o.orgId ?? o.authorId ?? o.id, city: o.city.split(',')[0], crafts: o.forCrafts, languages: o.language ? [o.language] : [], ageDays: agoDays(o.postedAgo), inDays: o.closesInDays, need: o.role });
  }
  for (const w of s.projects) {
    if (!isLive(w)) continue;
    const change = seed.projectUpdates.find((u) => u.projectId === w.id && u.kind === 'stage' && u.hoursAgo <= 72);
    const roles = s.rolesOf(w);
    out.push({
      key: `project:${w.id}`,
      type: 'project',
      ref: w.id,
      title: w.title,
      organiser: w.orgIds[0] ?? w.ownerId ?? w.id,
      city: cityOf(w),
      crafts: [...new Set(roles.flatMap((r) => r.forCrafts))],
      languages: langOf(w) ? [langOf(w)] : [],
      ageDays: change ? change.hoursAgo / 24 : undefined,
      people: creditedOn(w.id),
      mine: creditedOn(w.id).includes(s.me.id),
      stageChanged: !!change,
      crewing: roles.length > 0,
      need: roles[0]?.role,
      stage: change?.to ?? w.stage,
    });
  }
  for (const p of s.posts) {
    const a = party(p.authorId);
    if (!a || p.authorId === s.me.id || !p.media.length) continue;
    out.push({ key: `post:${p.id}`, type: 'post', ref: p.id, title: p.project ?? p.text, organiser: p.authorId, city: a.kind === 'person' ? (a as Person).city : undefined, crafts: a.kind === 'person' ? [(a as Person).craft] : [], ageDays: agoDays(p.time), by: a.name });
  }
  for (const e of s.events) {
    if (e.status !== 'scheduled' || e.start < s.now) continue;
    out.push({ key: `event:${e.id}`, type: 'event', ref: e.id, title: e.title, organiser: e.hostId, city: e.venue === 'Online' ? undefined : e.city, crafts: Array.isArray(e.audience) ? (e.audience as Craft[]) : [], ageDays: e.publishedAt ? (s.now - e.publishedAt) / DAY : undefined, inDays: Math.floor((e.start - s.now) / DAY), interest: e.interestedCount, people: e.projectId ? creditedOn(e.projectId) : [], day: day(e.start), eventType: e.type, mine: (e.speakerIds ?? []).includes(s.me.id) || e.hostId === s.me.id });
  }
  for (const w of s.releases) {
    const st = stats(reviewsOf(w.id));
    out.push({ key: `release:${w.id}`, type: 'release', ref: w.id, title: w.title, organiser: w.orgIds[0] ?? w.ownerId ?? w.id, city: cityOf(w), languages: langOf(w) ? [langOf(w)] : [], people: creditedOn(w.id), rating: st.enough ? st.avg : undefined, mine: creditedOn(w.id).includes(s.me.id) });
  }
  return out;
}

// Fixed for the session: recalculated daily, or after a save, follow or block. Never while on screen.
const cache = new Map<string, Spotlit[]>();
export function spotlightFor(s: SpotSources, c: Omit<SpotContext, 'pin'>, change: string): Spotlit[] {
  const key = [s.me.id, s.me.city, new Date(s.now).toDateString(), change].join('|');
  const hit = cache.get(key);
  if (hit) return hit;
  const list = pickSpotlight(spotItems(s), { ...c, pin: SPOTLIGHT_PIN });
  cache.set(key, list);
  return list;
}

/** "This week" (Spotlight Direction A, ?preview=home): the same sources, the stricter notable rules. */
const weekCache = new Map<string, Spotlit[]>();
export function thisWeekFor(s: SpotSources, c: Omit<SpotContext, 'pin'>, change: string): Spotlit[] {
  const key = [s.me.id, s.me.city, new Date(s.now).toDateString(), change].join('|');
  const hit = weekCache.get(key);
  if (hit) return hit;
  const list = pickSpotlight(spotItems(s), { ...c, pin: SPOTLIGHT_PIN }, 'week');
  weekCache.set(key, list);
  return list;
}

/**
 * A This-week card: what it is and when (the chip on the image), why it is here for you (the reason), the title and
 * one line. Every card has a reason; none repeats a section below.
 */
export interface WeekCard {
  key: string;
  type: Spotlit['type'];
  chip: string;
  reason: string;
  title: string;
  meta: string;
  media?: Media;
  save?: { id: string; kind: SavedKind };
  open: SpotCard['open'];
}

const STAGE_CHIP: Record<string, string> = { Shooting: 'Now shooting', Released: 'Just released', 'Post-production': 'In post', 'Pre-production': 'In pre-production', Development: 'In development' };
const shortDate = (ms: number) => new Date(ms).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

export function weekCard(it: Spotlit, d: { roles: Opportunity[]; events: IndustryEvent[]; me: Person; network: string[]; following: string[]; quote: (id: string) => { text: string; by: string } | undefined }): WeekCard | undefined {
  const known = (id?: string) => !!id && (d.network.includes(id) || d.following.includes(id));
  switch (it.type) {
    case 'event': {
      const e = d.events.find((x) => x.id === it.ref);
      if (!e) return undefined;
      const host = party(e.hostId);
      const kind = typeLabel(e.type).split(' or ')[0];
      const reason = (e.speakerIds ?? []).includes(d.me.id) ? "You're speaking" : e.hostId === d.me.id ? 'You are hosting' : known(e.hostId) ? `From ${host?.name ?? 'someone you know'}` : e.interestedCount && e.interestedCount >= 50 ? `${e.interestedCount} interested` : e.city === d.me.city ? `In ${e.city}` : kind;
      return { key: it.key, type: 'event', chip: `${kind} · ${shortDate(e.start)}`, reason, title: e.title, meta: [e.venue === 'Online' ? 'Online' : `${e.venue.split(',')[0]}, ${e.city}`, host?.name].filter(Boolean).join(' · '), media: e.cover, save: { id: e.id, kind: 'event' }, open: { name: 'event', id: e.id } };
    }
    case 'project': {
      const w = work(it.ref);
      if (!w) return undefined;
      const roles = d.roles.filter((o) => ('projectId' in o && (o as { projectId?: string }).projectId === w.id) || o.project === w.title).length;
      const house = houseOf(w);
      const since = it.stageChanged && it.ageDays !== undefined ? (it.ageDays < 1 ? 'since today' : it.ageDays < 2 ? 'since yesterday' : `for ${Math.floor(it.ageDays)} days`) : '';
      const reason = it.mine ? "You're credited on it" : [known(house?.id ?? w.ownerId) ? `${house?.name ?? 'Someone you know'}, you've worked together` : house?.name, since].filter(Boolean).join(' · ');
      return { key: it.key, type: 'project', chip: STAGE_CHIP[it.stage ?? w.stage] ?? w.stage, reason, title: w.title, meta: [cityOf(w), roles ? `${roles} open ${roles === 1 ? 'role' : 'roles'}` : langOf(w)].filter(Boolean).join(' · '), media: w.stills[0] ?? w.media, save: { id: w.id, kind: 'project' }, open: { name: 'work', id: w.id } };
    }
    case 'release': {
      const w = work(it.ref);
      if (!w) return undefined;
      const st = stats(reviewsOf(w.id));
      const q = d.quote(w.id);
      return { key: it.key, type: 'release', chip: 'Out this week', reason: st.enough ? `★ ${st.avg.toFixed(1)} · ${st.count} ratings` : 'New release', title: w.title, meta: q ? `"${q.text}"` : [houseOf(w)?.name, langOf(w)].filter(Boolean).join(' · '), media: w.stills[0] ?? w.media, open: { name: 'work', id: w.id } };
    }
    case 'role': {
      const o = d.roles.find((x) => x.id === it.ref);
      if (!o) return undefined;
      const by = o.orgId ? org(o.orgId).name : o.authorId ? person(o.authorId).name : '';
      return { key: it.key, type: 'role', chip: o.closesInDays === 0 ? 'Closes today' : `Closes in ${o.closesInDays} days`, reason: `From ${by}, in your network`, title: o.role, meta: [o.project, o.city.split(',')[0], o.paid ? 'Paid' : 'Unpaid'].join(' · '), media: o.media, save: { id: o.id, kind: 'role' }, open: { name: 'opportunity', id: o.id } };
    }
    case 'post':
      return undefined;
  }
}

export interface SpotCard {
  key: string;
  kicker: string;
  title: string;
  meta: string;
  /** The one fact that helps you decide: pay and dates, who is on it, the price, a line from a review. */
  fact?: string;
  faces?: string[];
  media?: Media;
  clip?: string;
  save: { id: string; kind: SavedKind };
  open: { name: 'opportunity' | 'work' | 'event'; id: string } | { name: 'posts'; ids: string[]; index: number };
}

/** A spotlit item as a card. Undefined when its record has gone (filled, removed) since the list was chosen. */
export function spotCard(it: Spotlit, d: { roles: Opportunity[]; posts: Post[]; events: IndustryEvent[]; meId: string; city: string; quote: (id: string) => { text: string; by: string } | undefined }): SpotCard | undefined {
  const k = ({ role: 'ROLE', event: 'EVENT', project: 'PROJECT', post: 'POST', release: 'REVIEW' } as const)[it.type];
  switch (it.type) {
    case 'role': {
      const o = d.roles.find((x) => x.id === it.ref);
      if (!o) return undefined;
      const by = o.orgId ? org(o.orgId).name : o.authorId ? person(o.authorId).name : '';
      return { key: it.key, kicker: k, title: o.role, meta: [o.project, by].filter(Boolean).join(' · '), fact: [o.closesInDays === 0 ? 'Closes today' : o.closesInDays != null ? `Closes in ${o.closesInDays} days` : 'Open role', o.city, o.paid ? 'Paid' : 'Unpaid'].join(' · '), media: o.media, save: { id: o.id, kind: 'role' }, open: { name: 'opportunity', id: o.id } };
    }
    case 'project': {
      const w = work(it.ref);
      if (!w) return undefined;
      return { key: it.key, kicker: k, title: w.title, meta: houseOf(w)?.name ?? (w.ownerId ? person(w.ownerId).name : ''), fact: w.stage, media: w.stills[0] ?? w.media, clip: w.id, save: { id: w.id, kind: 'project' }, open: { name: 'work', id: w.id } };
    }
    case 'post': {
      const p = d.posts.find((x) => x.id === it.ref);
      const a = p && party(p.authorId);
      if (!p || !a) return undefined;
      const line = p.project ?? p.text.split(/[.!?\n]/)[0];
      return { key: it.key, kicker: k, title: line, meta: a.name, fact: [a.kind === 'person' ? (a as Person).role : 'Production house', a.city].filter(Boolean).join(' · '), media: p.media[0], save: { id: p.id, kind: 'post' }, open: { name: 'posts', ids: [p.id], index: 0 } };
    }
    case 'event': {
      const e = d.events.find((x) => x.id === it.ref);
      if (!e) return undefined;
      return { key: it.key, kicker: k, title: e.title, meta: party(e.hostId)?.name ?? e.venue, fact: [whenLabel(e.start), e.venue === 'Online' ? 'Online' : e.city, priceLabel(e)].join(' · '), media: e.cover, save: { id: e.id, kind: 'event' }, open: { name: 'event', id: e.id } };
    }
    case 'release': {
      const w = work(it.ref);
      if (!w) return undefined;
      const rating = stats(reviewsOf(w.id));
      return { key: it.key, kicker: k, title: w.title, meta: [houseOf(w)?.name, langOf(w) ?? w.format].filter(Boolean).join(' · '), fact: rating.enough ? `★ ${rating.avg.toFixed(1)} · ${rating.count} ratings` : 'Read the reviews', media: w.stills[0] ?? w.media, clip: w.id, save: { id: w.id, kind: 'project' }, open: { name: 'work', id: w.id } };
    }
  }
}
