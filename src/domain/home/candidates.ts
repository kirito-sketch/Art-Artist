import * as seed from '../../data/seed';
import type { Opportunity, Person, Post, ProjectUpdate } from '../../data/types';
import { isLive, type Work } from '../../data/works';
import { work, worksForOrg } from '../../state/world';
import { blockedBy, discoverableProjects } from '../discovery';
import { housesFor, opportunitiesFor, peopleFor, workFor, type Intent, type Signals } from '../relevance';
import { closeness, creditedOn, reasonForPerson, sharedProject, workedWith } from './graph';
import type { HomeInput } from './session';
import { MAX_MIDDLE_FIRST_RUN, type Candidate, type PersonalNews, type Significance } from './types';

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
}

const H = 60 * 60 * 1000;
const TIER = { 1: 1, 2: 0.6, 3: 0.3, 4: 0.15 } as const;
const MAJOR = /^(Director|Director of Photography|DoP|Cinematographer|Editor|Production Designer|Producer|Writer)$/i;
const first = (name: string) => name.split(' ')[0];
const personName = (id: string) => seed.people.find((p) => p.id === id)?.name ?? '';
const usable = (w: Work | undefined): w is Work => !!w && w.media?.id !== 'ph';
const houseOf = (w: Work) => seed.orgs.find((o) => o.id === w.orgIds[0]);
const speaks = (me: Person, w: Work) => (me.languages ?? []).some((l) => w.format.includes(l));

/**
 * Why a project is relevant to you, only when it answers that question: people you've verifiably worked with
 * on it, someone you follow, or that it's being made where you are. Otherwise no reason at all.
 */
export function projectReason(me: Person, following: string[], w: Work): { reason?: string; known: string[]; followed?: string } {
  const on = creditedOn(w.id).filter((p) => p !== me.id);
  const known = on.filter((p) => workedWith(me.id).has(p));
  if (known.length >= 2) return { reason: `${known.length} people you've worked with are on this project`, known };
  if (known.length === 1) {
    const shared = sharedProject(me.id, known[0]);
    return { reason: shared ? `${first(personName(known[0]))} from ${shared.title} is on this project` : undefined, known };
  }
  const followed = on.find((p) => following.includes(p));
  if (followed) return { reason: `Because you follow ${first(personName(followed))}`, known, followed };
  if (houseOf(w)?.city === me.city && isLive(w)) return { reason: `Being made in ${me.city}`, known };
  return { known };
}

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
  const on = knownActor ? sharedProject(me, knownActor) : null;
  // "Rhea worked with you on Kaaval" on a Kaaval update says nothing new: being credited on it is the reason.
  // Faces only when the reason is about them.
  if (on && on.id !== w.id) reason = `${first(personName(knownActor!))} worked with you on ${on.title}`;
  else if (mine) reason = `You're credited on ${w.title}`;
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
    data: { projectId: w.id, project: w.title.toLowerCase(), text, tag: u.kind === 'stage' ? u.to : w.stage, faces: on && on.id !== w.id ? [knownActor!] : [] },
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
    // The card already shows the craft; a reason only when it's about people you've worked with. No filler.
    data: { people: g.map((r) => ({ id: r.item.id, reason: reasonForPerson(ctx.me.id, r.item.id) ?? undefined })) },
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
        // The work speaks for itself: a post from someone you follow needs no "You follow them".
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
      data: { roleId: o.id, project: o.project.toLowerCase() },
    }));
}

function houseCandidates(ctx: HomeContext): Candidate[] {
  const known = workedWith(ctx.me.id);
  return housesFor(ctx.me)
    .slice(0, 2)
    .map(({ o, live }, i) => {
      const people = new Set(worksForOrg(o.id).flatMap((w) => creditedOn(w.id)).filter((p) => known.has(p)));
      // What they're making is the house's identity, shown with its picture; the reason is only a relationship.
      const making = worksForOrg(o.id).find((w) => isLive(w) && usable(w)) ?? worksForOrg(o.id).find(isLive);
      const reason = people.size ? `Worked with ${people.size} ${people.size === 1 ? 'person' : 'people'} you know` : undefined;
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
        data: { houseId: o.id, makingId: making?.id },
      };
    });
}

/**
 * A project worth entering on its own (not an update): media-led, immersive, placed low in the middle. Only
 * projects with real pictures, and only when something makes them relevant to you.
 */
function projectCandidates(ctx: HomeContext): Candidate[] {
  return discoverableProjects(blockedBy(ctx.me.id))
    .filter((w) => usable(w) && w.ownerId !== ctx.me.id && !creditedOn(w.id).includes(ctx.me.id))
    .map((w) => ({ w, ...projectReason(ctx.me, ctx.following, w) }))
    .filter((x) => x.reason)
    .map(({ w, reason, known, followed }, i) => ({
      id: `project:${w.id}`,
      type: 'project' as const,
      objectId: w.id,
      version: w.stage,
      significance: (known.length || (isLive(w) && houseOf(w)?.city === ctx.me.city) ? 'high' : 'medium') as Significance,
      relationship: known.length ? 0.7 : followed ? 0.4 : 0,
      professional: 0.3,
      place: houseOf(w)?.city === ctx.me.city ? 1 : 0,
      at: ctx.loadedAt - (3 + i * 5) * H,
      quality: 0.8,
      reason,
      leadable: true,
      data: { projectId: w.id, project: w.title.toLowerCase(), text: isLive(w) ? (w.stage === 'Shooting' ? 'Shooting now' : `In ${w.stage.toLowerCase()}`) : w.year, tag: w.stage, faces: known.slice(0, 3) },
    }));
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
      data: { projectId: best.w.id, project: best.w.title.toLowerCase(), people: [a, b], text: `${first(personName(a))} and ${first(personName(b))} were verified on ${best.w.title}${withYou ? ', with you' : ''}` },
    },
  ];
}

/**
 * Cold start, in sourcing order: place and language (projects being made near you, then in a language you
 * work in), one role in your craft, other active projects, people, work, houses near you.
 */
function coldStart(ctx: HomeContext, people: Candidate[], posts: Candidate[], houses: Candidate[]): Candidate[] {
  const live = discoverableProjects(blockedBy(ctx.me.id)).filter((w) => isLive(w) && usable(w) && w.ownerId !== ctx.me.id);
  const local = live.filter((w) => houseOf(w)?.city === ctx.me.city);
  const language = live.filter((w) => !local.includes(w) && speaks(ctx.me, w));
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
    data: { projectId: w.id, project: w.title.toLowerCase(), text: w.stage === 'Shooting' ? 'Shooting now' : `In ${w.stage.toLowerCase()}`, tag: w.stage },
  });
  // A second local project can stand on its own, low on the page (one story per project still holds).
  const immersive = local.slice(1, 2).map((w): Candidate => ({ ...projectCard(w, true), id: `project:${w.id}`, type: 'project', objectId: w.id, significance: 'medium' }));
  // A role that fits their craft, if there is one (the composer keeps it at the third unit or lower, and shows one).
  // Two, so that when the lead is the first role's project (one story per project), the other can still show.
  const role = opportunityCandidates(ctx).filter((c) => c.significance === 'high').slice(0, 2);
  const rest = live.filter((w) => !local.includes(w) && !language.includes(w));
  return [...local.map((w) => projectCard(w, true)), ...language.map((w) => projectCard(w, false)), ...role, ...rest.map((w) => projectCard(w, false)), ...people, ...posts, ...immersive, ...houses.filter((h) => h.place === 1)];
}

export function homeInput(ctx: HomeContext): HomeInput {
  const people = peopleCandidates(ctx);
  const posts = postCandidates(ctx);
  const houses = houseCandidates(ctx);
  const updates = seed.projectUpdates.map((u) => updateCandidate(u, ctx)).filter((x): x is Candidate => !!x);
  // Events are not Home content (docs/HOME.md): no adapter feeds them here.
  const candidates = ctx.isNew ? [] : [...updates, ...people, ...posts, ...opportunityCandidates(ctx), ...houses, ...creditRelationCandidate(ctx), ...projectCandidates(ctx)];
  // A first Home is shorter. The role stays where every Home puts it: never in the first viewport.
  const options = ctx.isNew ? { maxMiddle: MAX_MIDDLE_FIRST_RUN } : undefined;
  return { candidates, personal: personalNews(ctx), coldStart: coldStart(ctx, people, posts, houses), options };
}
