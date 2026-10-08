import * as seed from '../data/seed';
import { SEED_WORKS, type Work, type WorkStage } from '../data/works';
import type { Interest, Media, Notification, Opportunity } from '../data/types';
import { SEED_REVIEWS } from '../data/reviews';
import { releaseAt, type Review } from '../domain/reviews';

/*
 * A small shared "backend" for the creation flows. It lives outside the per-viewer store so it survives
 * switching between Kiran, Tara and a house in the prototype panel, which is what lets the end-to-end
 * story be tested. Every concept is its own record:
 *   Project      private to its owner until deliberately shared
 *   Role         one object: private → open on Art and Artist → filled / closed (an Opportunity with a projectId)
 *   Association  "this production currently associates you with this project in this working role"
 *   Credit       production-issued record: prepared → proposed → accepted | correction
 * An association is never a credit, and adding someone never makes anything public.
 */

export type Format = 'Feature' | 'Series' | 'Short' | 'Documentary' | 'Music video' | 'Ad film' | 'Theatre';
export const FORMATS: Format[] = ['Feature', 'Series', 'Short', 'Documentary', 'Music video', 'Ad film'];
export const LANGUAGES = ['Telugu', 'Hindi', 'Tamil', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'English'];
export const STAGES = ['Development', 'Pre-production', 'Shooting', 'Post-production', 'Released'] as const;

/**
 * A trailer or teaser for a project, one per language version (docs/ux-refinement/PLAN.md, D6). Only `published`
 * versions of a shared project reach the public page. `temporary` marks a session-only file (a device preview kept in
 * this browser tab): it is never presented as a stored upload, and disappears on reload. Persistent storage is the
 * open proposal in docs/ux-refinement/TRAILER_STORAGE.md.
 */
export interface Trailer {
  id: string;
  /** A clip is the film's own footage shown until a trailer exists; it is never called a trailer. */
  kind: 'trailer' | 'teaser' | 'clip';
  language: string;
  url: string;
  poster?: Media;
  duration?: string;
  width?: number;
  height?: number;
  status: 'draft' | 'published';
  temporary?: boolean;
  /** A labelled stand-in clip for review (Studio only), never the film's real trailer. */
  sample?: boolean;
}

export interface HouseProject {
  id: string;
  /** Organisation that owns it (the lead production), or a person for an independent project. */
  houseId?: string;
  /** Co-producing houses. They appear on the public page; credit authority for them is an open question. */
  coHouseIds?: string[];
  ownerId?: string;
  workingTitle: string;
  format: Format;
  /** Projects can be multilingual; never assume exactly one. */
  languages: string[];
  stage: WorkStage;
  /** Display label for older records, e.g. "Short film · 18 min". */
  formatLabel?: string;
  year?: string;
  stills?: Media[];
  /** Public-facing details, filled in over time. Nothing here is public until shared. */
  publicTitle?: string;
  logline?: string;
  artwork?: Media;
  shared: boolean;
  /** Set by the house (YYYY-MM-DD). Reviews open on this day. */
  releaseDate?: string;
  /** Trailer and teaser versions, by language (D6). */
  trailers?: Trailer[];
  /** Created after the trailer rule (D7): sharing it at post-production or released needs a trailer. Seeded projects keep their fallback. */
  trailerRule?: boolean;
}

export interface Association {
  id: string;
  projectId: string;
  /** A real Art and Artist person, or a private placeholder for someone not on Art and Artist (never a profile). */
  personId?: string;
  /** notMe: the person at that number said it isn't them; no more invites (EC-PEND-002). */
  pending?: { name: string; phone: string; notMe?: boolean };
  workingRole: string;
  dept: string;
  fromRoleId?: string;
  status: 'added' | 'flagged' | 'removed';
}

export interface WorldCredit {
  id: string;
  projectId: string;
  associationId: string;
  personId: string;
  line: string;
  dept: string;
  /**
   * superseded  an accepted version later replaced by an accepted revision; kept as history, never public
   * declined    a proposed revision the person chose not to accept; the accepted version stays current
   */
  status: 'prepared' | 'proposed' | 'accepted' | 'correction' | 'superseded' | 'declined';
  note?: string;
  /** A proposed revision of this accepted credit. Accepting it supersedes that credit. */
  supersedes?: string;
  /** The person who issued it (internal attribution; the public issuer is the house). */
  issuedBy?: string;
}

/**
 * A request to amend an accepted credit. The accepted credit stays the public record throughout;
 * only the person accepting a revised version replaces it.
 *   open       the person asked; the house hasn't decided
 *   revised    the house proposed a revised credit (revisionId), waiting for the person
 *   kept       the house kept the credit as it is
 *   accepted   the person accepted the revision; it replaced the old version
 *   withdrawn  the person kept the current credit instead
 */
export interface Amendment {
  id: string;
  creditId: string;
  associationId: string;
  projectId: string;
  personId: string;
  reason: string;
  status: 'open' | 'revised' | 'kept' | 'accepted' | 'withdrawn';
  revisionId?: string;
}

/** The record never disappears: withdrawn, messaged or set aside, it stays the history of this role. */
export type WorldInterest = Interest;

/**
 * A conversation between two identities (a person, or a house acting through its members). Both sides
 * read the same record, so what the house sends as Konark is what the person receives from Konark.
 */
/** Where one association's credit stands: the current public version, anything pending, the latest amendment and the history. */
export function creditState(associationId: string) {
  const cs = world.credits.filter((c) => c.associationId === associationId);
  return {
    current: cs.find((c) => c.status === 'accepted'),
    pending: [...cs].reverse().find((c) => c.status === 'prepared' || c.status === 'proposed' || c.status === 'correction'),
    amendment: [...world.amendments].reverse().find((m) => m.associationId === associationId),
    history: cs.filter((c) => c.status === 'superseded'),
  };
}

export interface Thread {
  id: string;
  /** One suggested next step for one side, e.g. confirming a recce. */
  action?: { side: string; label: string; reply: string };
  /** Party ids: a person id or a house id. */
  sides: [string, string];
  context: { kind: 'crew' | 'casting' | 'collab' | 'project'; label: string; detail: string; refId?: string };
  media?: Media;
  /** `from` is the identity (person or house). `by` is the human who sent it: kept internally, never shown to the other side. */
  messages: { id: string; from: string; by?: string; text: string; time: string }[];
  /** Sides with something unread. */
  unreadFor: string[];
  updated: string;
}

/** One person blocking a person or a house. Personal: it never blocks on behalf of a house. */
export interface Block {
  by: string;
  target: string;
}

export interface WorldNotification extends Notification {
  /** A person the notification is for (their personal identity). */
  toPersonId?: string;
}

export interface RoleExtra {
  projectId: string;
  visibility: 'private' | 'open';
}

export const world = {
  projects: [] as HouseProject[],
  roles: [] as (Opportunity & RoleExtra)[],
  associations: [] as Association[],
  credits: [] as WorldCredit[],
  interests: [] as WorldInterest[],
  notifications: [] as WorldNotification[],
  threads: [] as Thread[],
  /** A poster's changes to a published role, and which material details changed. Everyone reads the same edits. */
  roleEdits: {} as Record<string, Partial<Opportunity> & { changed?: string[] }>,
  blocks: [] as Block[],
  amendments: [] as Amendment[],
  /** Filled or closed roles, by role id. A filled role is a record; hiring again is a new role. */
  roleStatus: {} as Record<string, { state: 'filled' | 'closed'; reason: string }>,
  /** Film reviews: one per person per film. */
  reviews: [] as Review[],
};

let n = 0;
export const wid = (p: string) => `${p}${Date.now().toString(36)}${n++}`;

/** The name the outside world may see. The working title stays private until the house reveals a title. */
export function publicName(p: HouseProject) {
  if (p.shared && p.publicTitle) return p.publicTitle;
  return `Untitled ${p.languages[0] ?? ''} ${p.format.toLowerCase()}`.replace(/\s+/g, ' ');
}
export const project = (id: string) => world.projects.find((p) => p.id === id);
export const roleProject = (roleId: string) => project(world.roles.find((r) => r.id === roleId)?.projectId ?? '');
export const DEPTS = ['Direction', 'Camera', 'Lighting', 'Sound', 'Art', 'Costume', 'Post', 'Cast', 'Production', 'Writing'];

/** The public page is built only from what the owner chose to reveal, plus accepted credits. */
const PLACEHOLDER: Media = { id: 'ph', kind: 'image', src: 'images/covers/neela.jpg' };
export function toPublicWork(p: HouseProject): Work | undefined {
  if (!p.shared) return undefined;
  return {
    id: p.id,
    title: publicName(p),
    year: p.year ?? '2026',
    format: p.formatLabel ?? `${p.format === 'Feature' ? 'Feature film' : p.format} · ${p.languages.join(', ')}`,
    stage: p.stage,
    orgIds: p.houseId ? [p.houseId, ...(p.coHouseIds ?? [])] : [],
    ownerId: p.ownerId,
    logline: p.logline ?? '',
    media: p.artwork ?? PLACEHOLDER,
    stills: p.stills ?? (p.artwork ? [p.artwork] : []),
    credits: world.credits.filter((c) => c.projectId === p.id && c.status === 'accepted').map((c) => ({ personId: c.personId, role: c.line, dept: c.dept })),
    releaseDate: p.releaseDate,
    // Drafts never leave the workspace.
    trailers: (p.trailers ?? []).filter((t) => t.status === 'published'),
  };
}

/* ------------------------------------------------------------ helpers screens use */

export const work = (id: string) => {
  const p = project(id);
  return p ? toPublicWork(p) : undefined;
};
export const publicWorks = () => world.projects.map(toPublicWork).filter((w): w is Work => !!w);
export const worksForOrg = (orgId: string) => publicWorks().filter((w) => w.orgIds.includes(orgId));
export const reviewsOf = (projectId: string) => world.reviews.filter((r) => r.projectId === projectId);
export const reviewsBy = (personId: string) => world.reviews.filter((r) => r.personId === personId).sort((a, b) => b.at - a.at);
/** Everyone who holds or was offered a credit on the project, in any state. */
export const creditedOn = (projectId: string) => [...new Set(world.associations.filter((a) => a.projectId === projectId && a.personId).map((a) => a.personId!))];

/* ------------------------------------------------------------ seeding */

/*
 * The older sample films become the same kind of record as anything created in the prototype. Accepted
 * credits come with the association they grew from; in-progress films have associations only.
 */
const FORMAT_OF = (label: string): Format =>
  /^Web series|^Series/.test(label) ? 'Series' : /^Short/.test(label) ? 'Short' : /^Music video/.test(label) ? 'Music video' : /^Theatre/.test(label) ? 'Theatre' : /^Docu/.test(label) ? 'Documentary' : 'Feature';

SEED_WORKS.forEach((w) => {
  const langs = w.format.split(' · ').slice(1).filter((x) => LANGUAGES.includes(x));
  world.projects.push({
    id: w.id,
    houseId: w.orgIds[0],
    coHouseIds: w.orgIds.slice(1),
    ownerId: w.ownerId,
    workingTitle: w.workingTitle ?? w.title,
    publicTitle: w.shared ? w.title : undefined,
    format: FORMAT_OF(w.format),
    formatLabel: w.format,
    languages: langs,
    stage: w.stage,
    year: w.year,
    logline: w.logline || undefined,
    artwork: w.media,
    stills: w.stills,
    shared: w.shared,
    releaseDate: w.releaseDate,
  });
  const link = (c: { personId: string; role: string; dept: string }) => {
    const a: Association = { id: `a-${w.id}-${c.personId}-${world.associations.length}`, projectId: w.id, personId: c.personId, workingRole: c.role, dept: c.dept, status: 'added' };
    world.associations.push(a);
    return a;
  };
  w.credits.forEach((c) => {
    const a = link(c);
    world.credits.push({ id: `c-${a.id}`, projectId: w.id, associationId: a.id, personId: c.personId, line: c.role, dept: c.dept, status: 'accepted' });
  });
  (w.added ?? []).forEach(link);
  (w.proposed ?? []).forEach((c) => {
    const a = link(c);
    world.credits.push({ id: `c-${a.id}`, projectId: w.id, associationId: a.id, personId: c.personId, line: c.line, dept: c.dept, status: c.correction ? 'correction' : 'proposed', note: c.correction });
  });
});

Object.entries(SEED_REVIEWS).forEach(([pid, list]) => {
  const rel = project(pid)?.releaseDate;
  if (!rel) return;
  list.forEach((r, k) => world.reviews.push({ id: `rv-${pid}-${k}`, projectId: pid, personId: r.personId, stars: r.stars, text: r.text, spoiler: r.spoiler, at: Math.min(Date.now() - 36e5, releaseAt(rel) + r.h * 36e5), helpful: r.helpful ?? [] }));
});

/* Someone not on Art and Artist yet, added by phone (docs/CONSOLIDATION.md §7). Joining with this verified number offers the match. */
world.associations.push({ id: 'a-neela-pending-ravi', projectId: 'neela', pending: { name: 'Ravi Kumar', phone: '98480 22334' }, workingRole: 'Assistant Director', dept: 'Direction', status: 'added' });

/* Roles that belong to the houses you can act for move onto their projects. Other houses' roles stay as plain listings. */
const ROLE_PROJECT: Record<string, string> = { 'o-neela-dop': 'neela', 'o-neela-journalist': 'neela', 'o-backwaters': 'backwaters' };
Object.entries(ROLE_PROJECT).forEach(([rid, pid]) => {
  const i = seed.opportunities.findIndex((o) => o.id === rid);
  if (i < 0) return;
  const [o] = seed.opportunities.splice(i, 1);
  world.roles.push({ ...o, projectId: pid, visibility: 'open' });
});
const neela = world.roles.find((r) => r.id === 'o-neela-dop')!;
(
  [
    ['Colourist', 'Post'],
    ['Gaffer', 'Lighting'],
  ] as const
).forEach(([role], k) =>
  world.roles.push({ ...neela, id: `r-neela-private-${k}`, role, visibility: 'private', about: `${role} for a 38-day shoot in Araku. Not announced yet.`, questions: [], compensation: 'Paid', postedAgo: '2d' }),
);

world.interests.push(...(seed.interests.konark ?? []));
seed.interests.konark = [];

world.notifications.push(
  { id: 'wn-seed-1', forId: 'konark', kind: 'interest', actorId: 'vikram', text: 'Vikram Sen and 2 others are interested in Director of Photography on Neela Akasham', time: '1h', unread: true, route: { name: 'hproject', id: 'neela' } },
  { id: 'wn-seed-2', forId: 'konark', kind: 'credit', actorId: 'sameer', text: 'Sameer Ali asked to correct a credit on Neeli Raat: Chief Lighting Technician, not Gaffer', time: '3h', unread: true, route: { name: 'hproject', id: 'neeliraat' } },
  { id: 'wn-seed-3', forId: 'konark', kind: 'credit', actorId: 'meera', text: 'Monsoon Letters: all 6 credits are now public', time: '2d', unread: false, route: { name: 'work', id: 'monsoon' } as never },
  { id: 'wn-seed-4', toPersonId: 'kiran', kind: 'credit', actorId: 'bluelotus', text: 'Blue Lotus Originals issued you a credit on Fault Lines · S1. Accept it to make it official.', time: '8m', unread: true, route: { name: 'profile', id: 'kiran' } },
);

/*
 * Kiran and Konark already talk about the DoP role. It is one shared thread: Kiran reads it from Konark
 * Pictures, and anyone acting for Konark reads the same messages as the house.
 */
{
  const i = seed.conversations.kiran.findIndex((c) => c.id === 'c-konark');
  const [c] = seed.conversations.kiran.splice(i, 1);
  seed.conversations.aditi = seed.conversations.aditi.filter((x) => x.id !== 'c-aditi-kiran');
  world.threads.push({
    id: 'th-konark-kiran',
    sides: ['konark', 'kiran'],
    context: c.context as Thread['context'],
    media: c.media,
    action: c.action && { side: 'kiran', ...c.action },
    messages: c.messages.map((m) => ({ id: m.id, from: m.from === 'me' ? 'kiran' : 'konark', text: m.text, time: m.time })),
    unreadFor: ['kiran'],
    updated: '12m',
  });
}
