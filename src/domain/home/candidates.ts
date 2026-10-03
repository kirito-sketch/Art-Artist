import * as seed from '../../data/seed';
import type { Opportunity, Person, Post, ProjectUpdate } from '../../data/types';
import { isLive, type Work } from '../../data/works';
import { work, worksForOrg } from '../../state/world';
import { blockedBy, discoverableProjects } from '../discovery';
import { housesFor, opportunitiesFor, peopleFor, workFor, type Intent, type Signals } from '../relevance';
import { closeness, creditedOn, reasonForPerson, sharedProject, workedWith } from './graph';
import type { HomeInput } from './session';
import type { Candidate, PersonalNews, Significance } from './types';

/*
 * Turns the app's real data into Home candidates (docs/HOME.md). Each adapter decides significance with the
 * agreed levels and fills the ranking keys; the composer does the rest. Nothing here builds counts or task
 * summaries: personal news is one item, written as news.
 */
export interface HomeContext {
  me: Person;
  intent: Intent;
  following: string[];
  signals?: Signals;
  userPosts?: Post[];
  userCollabs?: Opportunity[];
  hiddenRoles?: Record<string, unknown>;
  pendingCredits?: { id: string; title: string; role: string; orgId: string; correction?: boolean }[];
  /** When this app session started: prototype content is dated relative to it. */
  loadedAt: number;
  /** Just out of onboarding: no network or behaviour yet. */
  isNew: boolean;
  /** Extra candidates from other modules (Events, docs/EVENTS.md). */
  extra?: Candidate[];
}

const H = 60 * 60 * 1000;
const TIER = { 1: 1, 2: 0.6, 3: 0.3, 4: 0.15 } as const;
const MAJOR = /^(Director|Director of Photography|DoP|Cinematographer|Editor|Production Designer|Producer|Writer)$/i;
const first = (name: string) => name.split(' ')[0];
const personName = (id: string) => seed.people.find((p) => p.id === id)?.name ?? '';
const usable = (w: Work | undefined): w is Work => !!w && w.media?.id !== 'ph';
const houseOf = (w: Work) => seed.orgs.find((o) => o.id === w.orgIds[0]);

/** A project update, with significance from the agreed levels. */
export function updateCandidate(u: ProjectUpdate, ctx: HomeContext): Candidate | null {
  const w = work(u.projectId);
  if (!usable(w)) return null;
  const me = ctx.me.id;
  const mine = creditedOn(w.id).includes(me);
  const knownActor = (u.actorIds ?? []).find((a) => workedWith(me).has(a));
  let significance: Significance = 'medium';
  if (u.kind === 'stage' && u.to === 'Shooting') significance = 'high';
  else if (u.kind === 'crew' && (knownActor || MAJOR.test(u.to))) significance = 'high';
  else if (u.kind === 'crew' && !u.actorIds?.length) significance = 'low';
  const actor = u.actorIds?.[0] ? personName(u.actorIds[0]) : '';
  const text =
    u.kind === 'stage' ? (u.to === 'Shooting' ? 'Started shooting' : `Moved to ${u.to.toLowerCase()}`) : u.kind === 'crew' ? (actor ? `${actor} joined as ${u.to}` : `${u.to} attached`) : u.to;
  let reason: string | undefined;
  if (knownActor) {
    const on = sharedProject(me, knownActor);
    reason = on ? `${first(personName(knownActor))} worked with you on ${on.title}` : undefined;
  } else if (mine) reason = `You're credited on ${w.title}`;
  const house = houseOf(w);
  return {
    id: `projectUpdates:${u.id}`,
    type: 'projectUpdates',
    objectId: u.id,
    version: u.id,
    significance,
    relationship: mine ? 1 : knownActor ? 0.8 : creditedOn(w.id).some((p) => workedWith(me).has(p)) ? 0.4 : 0,
    professional: 0.3,
    place: house && house.city === ctx.me.city ? 1 : 0,
    at: ctx.loadedAt - u.hoursAgo * H,
    quality: 0.8,
    reason,
    leadable: true,
    data: { projectId: w.id, text, tag: u.kind === 'stage' ? u.to : w.stage, faces: knownActor ? [knownActor] : creditedOn(w.id).filter((p) => workedWith(me).has(p)).slice(0, 3) },
  };
}

/** Personal news: the most recent credit addressed to you, as one sentence. Never a count. */
export function personalNews(ctx: HomeContext): PersonalNews | null {
  const c = (ctx.pendingCredits ?? []).find((x) => !x.correction);
  if (!c) return null;
  const org = seed.orgs.find((o) => o.id === c.orgId);
  if (!org) return null;
  return { id: `credit:${c.id}`, text: `${org.name} added you to ${c.title} as ${c.role}.`, actorId: org.id, route: { name: 'profile', id: ctx.me.id }, actionLabel: 'Review', at: ctx.loadedAt, urgent: true };
}

function peopleCandidates(ctx: HomeContext): Candidate[] {
  const list = peopleFor(ctx.me, ctx.intent, ctx.following, ctx.signals).filter((r) => r.item.id !== ctx.me.id && !ctx.following.includes(r.item.id));
  const groups = [list.slice(0, 3), list.slice(3, 6)].filter((g) => g.length >= 2);
  return groups.map((g, i) => ({
    id: `people:${g.map((r) => r.item.id).join('+')}`,
    type: 'people' as const,
    objectId: g.map((r) => r.item.id).join('+'),
    version: '1',
    significance: 'medium' as const,
    relationship: Math.max(...g.map((r) => closeness(ctx.me.id, r.item.id))) * 0.8,
    professional: Math.max(...g.map((r) => TIER[r.tier])),
    place: g.filter((r) => r.item.city === ctx.me.city).length / g.length,
    at: ctx.loadedAt - (6 + i * 12) * H,
    quality: 0.8,
    leadable: false,
    data: { people: g.map((r) => ({ id: r.item.id, reason: reasonForPerson(ctx.me.id, r.item.id) ?? r.why })) },
  }));
}

function postCandidates(ctx: HomeContext): Candidate[] {
  return workFor(ctx.me, ctx.following, ctx.userPosts ?? [])
    .slice(0, 8)
    .map(({ item: p, tier }, i) => {
      const author = seed.people.find((x) => x.id === p.authorId);
      return {
        id: `post:${p.id}`,
        type: 'post' as const,
        objectId: p.id,
        version: '1',
        significance: 'medium' as const,
        relationship: ctx.following.includes(p.authorId) ? 0.6 : closeness(ctx.me.id, p.authorId) * 0.5,
        professional: TIER[tier],
        place: author?.city === ctx.me.city ? 1 : 0,
        at: ctx.loadedAt - (8 + i * 10) * H,
        quality: p.media.length ? 0.8 : 0.3,
        reason: ctx.following.includes(p.authorId) ? 'You follow them' : undefined,
        leadable: false,
        data: { postId: p.id },
      };
    });
}

function opportunityCandidates(ctx: HomeContext): Candidate[] {
  return opportunitiesFor(ctx.me, ctx.intent, ctx.userCollabs ?? [], ctx.hiddenRoles ?? {}, ctx.signals, 2)
    .slice(0, 2)
    .map(({ item: o, why, tier }, i) => ({
      id: `opportunity:${o.id}`,
      type: 'opportunity' as const,
      objectId: o.id,
      version: '1',
      significance: (tier === 1 ? 'high' : 'medium') as Significance,
      relationship: 0,
      professional: TIER[tier],
      place: o.city?.includes(ctx.me.city) ? 1 : 0,
      at: ctx.loadedAt - (12 + i * 6) * H,
      quality: 0.8,
      reason: why,
      leadable: false,
      data: { roleId: o.id },
    }));
}

function houseCandidates(ctx: HomeContext): Candidate[] {
  const known = workedWith(ctx.me.id);
  return housesFor(ctx.me)
    .slice(0, 2)
    .map(({ o, live }, i) => {
      const people = new Set(worksForOrg(o.id).flatMap((w) => creditedOn(w.id)).filter((p) => known.has(p)));
      const making = worksForOrg(o.id).find(isLive);
      const reason = [making ? `Making ${making.title}` : null, people.size ? `has worked with ${people.size} ${people.size === 1 ? 'person' : 'people'} you know` : null].filter(Boolean).join(' · ') || undefined;
      return {
        id: `house:${o.id}`,
        type: 'house' as const,
        objectId: o.id,
        version: making?.stage ?? '1',
        significance: (live ? 'medium' : 'low') as Significance,
        relationship: people.size ? 0.5 : 0,
        professional: 0.2,
        place: o.city === ctx.me.city ? 1 : 0,
        at: ctx.loadedAt - (20 + i * 10) * H,
        quality: o.verified ? 0.8 : 0.3,
        reason,
        leadable: false,
        data: { houseId: o.id },
      };
    });
}

/** Two people in your world verified on the same project. */
function creditRelationCandidate(ctx: HomeContext): Candidate[] {
  const circle = new Set([...ctx.following, ...workedWith(ctx.me.id)]);
  const best = discoverableProjects(blockedBy(ctx.me.id))
    .map((w) => ({ w, people: creditedOn(w.id).filter((p) => p !== ctx.me.id && circle.has(p)) }))
    .filter((x) => x.people.length >= 2)
    .sort((a, b) => b.people.length - a.people.length)[0];
  if (!best) return [];
  const [a, b] = best.people;
  const withYou = creditedOn(best.w.id).includes(ctx.me.id);
  return [
    {
      id: `creditRelation:${best.w.id}`,
      type: 'creditRelation',
      objectId: best.w.id,
      version: best.people.join('+'),
      significance: 'medium',
      relationship: 0.5,
      professional: 0.3,
      place: 0,
      at: ctx.loadedAt - 30 * H,
      quality: 0.8,
      leadable: false,
      data: { projectId: best.w.id, people: [a, b], text: `${first(personName(a))} and ${first(personName(b))} were verified on ${best.w.title}${withYou ? ', with you' : ''}` },
    },
  ];
}

/** Cold start, in sourcing order: craft and place, active projects, people, work, houses. */
function coldStart(ctx: HomeContext, people: Candidate[], posts: Candidate[], houses: Candidate[]): Candidate[] {
  const live = discoverableProjects(blockedBy(ctx.me.id)).filter((w) => isLive(w) && usable(w) && w.ownerId !== ctx.me.id);
  const local = live.filter((w) => houseOf(w)?.city === ctx.me.city);
  const projectCard = (w: Work, near: boolean): Candidate => ({
    id: `projectUpdates:live-${w.id}`,
    type: 'projectUpdates',
    objectId: `live-${w.id}`,
    version: w.stage,
    significance: near ? 'high' : 'medium',
    relationship: 0,
    professional: 0.5,
    place: near ? 1 : 0,
    at: ctx.loadedAt - 2 * H,
    quality: 0.8,
    reason: near ? `Being made in ${ctx.me.city}` : undefined,
    leadable: true,
    data: { projectId: w.id, text: w.stage === 'Shooting' ? 'Shooting now' : `In ${w.stage.toLowerCase()}`, tag: w.stage },
  });
  return [...local.map((w) => projectCard(w, true)), ...live.filter((w) => !local.includes(w)).map((w) => projectCard(w, false)), ...people, ...posts, ...houses.filter((h) => h.place === 1)];
}

export function homeInput(ctx: HomeContext): HomeInput {
  const people = peopleCandidates(ctx);
  const posts = postCandidates(ctx);
  const houses = houseCandidates(ctx);
  const updates = seed.projectUpdates.map((u) => updateCandidate(u, ctx)).filter((x): x is Candidate => !!x);
  const candidates = ctx.isNew ? [] : [...updates, ...people, ...posts, ...opportunityCandidates(ctx), ...houses, ...creditRelationCandidate(ctx), ...(ctx.extra ?? [])];
  return { candidates, personal: personalNews(ctx), coldStart: [...coldStart(ctx, people, posts, houses), ...(ctx.isNew ? ctx.extra ?? [] : [])] };
}
