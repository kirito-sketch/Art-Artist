import * as seed from '../../data/seed';
import type { Craft, IndustryEvent, Media, Opportunity, Person, Post } from '../../data/types';
import { isLive, type Work } from '../../data/works';
import { agoDays, kicker, pickSpotlight, type SpotContext, type SpotItem, type Spotlit } from '../../domain/spotlight';
import { stats } from '../../domain/reviews';
import { priceLabel } from '../../domain/events';
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
    out.push({ key: `event:${e.id}`, type: 'event', ref: e.id, title: e.title, organiser: e.hostId, city: e.venue === 'Online' ? undefined : e.city, crafts: Array.isArray(e.audience) ? (e.audience as Craft[]) : [], ageDays: e.publishedAt ? (s.now - e.publishedAt) / DAY : undefined, inDays: Math.floor((e.start - s.now) / DAY), interest: e.interestedCount, people: e.projectId ? creditedOn(e.projectId) : [], day: day(e.start) });
  }
  for (const w of s.releases) {
    const st = stats(reviewsOf(w.id));
    out.push({ key: `release:${w.id}`, type: 'release', ref: w.id, title: w.title, organiser: w.orgIds[0] ?? w.ownerId ?? w.id, city: cityOf(w), languages: langOf(w) ? [langOf(w)] : [], people: creditedOn(w.id), rating: st.enough ? st.avg : undefined });
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
  const k = kicker(it);
  switch (it.type) {
    case 'role': {
      const o = d.roles.find((x) => x.id === it.ref);
      if (!o) return undefined;
      const by = o.orgId ? org(o.orgId).name : o.authorId ? person(o.authorId).name : '';
      return { key: it.key, kicker: k, title: o.role, meta: [o.project, by].filter(Boolean).join(' · '), fact: [o.paid ? o.compensation : 'Unpaid', o.dates].filter(Boolean).join(' · '), media: o.media, save: { id: o.id, kind: 'role' }, open: { name: 'opportunity', id: o.id } };
    }
    case 'project': {
      const w = work(it.ref);
      if (!w) return undefined;
      const faces = creditedOn(w.id).filter((x) => x !== d.meId);
      return { key: it.key, kicker: k, title: w.title, meta: [houseOf(w)?.name ?? (w.ownerId ? person(w.ownerId).name : ''), langOf(w) ?? w.format].filter(Boolean).join(' · '), faces, media: w.stills[0] ?? w.media, clip: w.id, save: { id: w.id, kind: 'project' }, open: { name: 'work', id: w.id } };
    }
    case 'post': {
      const p = d.posts.find((x) => x.id === it.ref);
      const a = p && party(p.authorId);
      if (!p || !a) return undefined;
      const line = p.project ?? p.text.split(/[.!?\n]/)[0];
      return { key: it.key, kicker: k, title: line, meta: [a.kind === 'person' ? (a as Person).role : 'Production house', p.time].filter(Boolean).join(' · '), media: p.media[0], save: { id: p.id, kind: 'post' }, open: { name: 'posts', ids: [p.id], index: 0 } };
    }
    case 'event': {
      const e = d.events.find((x) => x.id === it.ref);
      if (!e) return undefined;
      const time = new Date(e.start).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).replace(/\s?(am|pm)/i, (x) => ` ${x.trim().toLowerCase()}`);
      const place = e.venue === 'Online' ? 'Online' : e.city === d.city ? e.venue : `${e.venue}, ${e.city}`;
      return { key: it.key, kicker: k, title: e.title, meta: `${place} · ${time}`, fact: [priceLabel(e), party(e.hostId)?.name].filter(Boolean).join(' · '), save: { id: e.id, kind: 'event' }, open: { name: 'event', id: e.id } };
    }
    case 'release': {
      const w = work(it.ref);
      if (!w) return undefined;
      const q = d.quote(w.id);
      return { key: it.key, kicker: k, title: w.title, meta: [houseOf(w)?.name, langOf(w) ?? w.format].filter(Boolean).join(' · '), fact: q ? `“${q.text}” ${q.by}` : undefined, media: w.stills[0] ?? w.media, clip: w.id, save: { id: w.id, kind: 'project' }, open: { name: 'work', id: w.id } };
    }
  }
}
