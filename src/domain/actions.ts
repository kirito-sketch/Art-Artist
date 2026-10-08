import * as seed from '../data/seed';
import type { Opportunity } from '../data/types';
import { party, person } from '../state/selectors';
import { normalisePhone, phoneTaken, profileOf, validPhone } from '../state/profile';
import { canReview, MAX_TEXT, reviewsOpen, validStars, type Review } from './reviews';
import { world, wid, publicName, creditedOn, project as wproject, type Amendment, type Association, type Format, type HouseProject, type Thread } from '../state/world';

/*
 * The actions that change Art and Artist's shared records (projects, roles, associations, credits, interests and
 * the notifications they cause). The app's store calls these, and so do the automated edge-case checks,
 * so a check exercises exactly the code the prototype runs. Screens never write to the world directly.
 *
 * Every action receives the Actor: who is signed in, which identity they are acting as, and what they
 * are allowed to do. Rules about who may do what belong here, not in the screens that hide a button.
 */

export interface Actor {
  /** The signed-in person. */
  viewerId: string;
  /** 'self' for their personal identity, or the organisation they are acting for. */
  acting: string;
  /** Organisations this person may act for. */
  memberships: string[];
  /** Whether this person holds credit authority for the house they act for. */
  canIssue: boolean;
}

/** Roles on an unannounced project never borrow its private artwork. */
export const GENERIC_ROLE_IMAGE = { id: 'role-generic', kind: 'image' as const, src: 'images/covers/coastline.jpg' };

export type RoleState = { state: 'filled' | 'closed'; reason: string };

/* ------------------------------------------------------------ projects */

export function createProject(actor: Actor, d: { workingTitle: string; format: Format; languages: string[] }) {
  const p: HouseProject = { id: wid('hp'), ...(actor.acting !== 'self' ? { houseId: actor.acting } : { ownerId: actor.viewerId }), workingTitle: d.workingTitle, format: d.format, languages: d.languages, stage: 'Development', shared: false, trailerRule: true };
  world.projects.unshift(p);
  return p.id;
}

export function updateProject(_actor: Actor, id: string, patch: Partial<HouseProject>) {
  const p = wproject(id);
  if (!p) return;
  Object.assign(p, patch);
  // Artwork reaches public roles only once the project itself is shared.
  world.roles.forEach((r) => r.projectId === id && ((r.project = publicName(p)), (r.stage = p.stage), p.shared && p.artwork && (r.media = p.artwork)));
}

/* ------------------------------------------------------------ roles */

export function addRole(_actor: Actor, projectId: string, f: { role: string; about: string; dates: string; city: string; paid: boolean; compensation: string; questions: string[]; visibility: 'private' | 'open' }) {
  const p = wproject(projectId)!;
  const r = {
    id: wid('wr'), projectId, visibility: f.visibility, kind: 'crew' as const, role: f.role, project: publicName(p), projectType: `${p.format} · ${p.languages.join(', ')}`,
    ...(p.houseId ? { orgId: p.houseId } : { authorId: p.ownerId }),
    city: f.city || 'To be confirmed', dates: f.dates || 'Dates to be confirmed', compensation: f.paid ? f.compensation || 'Paid' : 'Unpaid', paid: f.paid, closesInDays: 14, stage: p.stage, language: p.languages.join(', '),
    about: f.about, lookingFor: [], questions: f.questions.filter(Boolean).slice(0, 3), match: [], forCrafts: [], media: (p.shared && p.artwork) || GENERIC_ROLE_IMAGE, postedAgo: 'now',
  };
  world.roles.unshift(r);
  return r.id;
}

export function setRoleVisibility(_actor: Actor, id: string, v: 'private' | 'open') {
  const r = world.roles.find((x) => x.id === id);
  if (r) (r.visibility = v), (r.postedAgo = 'now');
}

/** Closing keeps the role and its history. Everyone still interested learns the outcome instead of silence. */
export function closeRole(_actor: Actor, id: string, state: 'filled' | 'closed', reason: string, chosenId?: string) {
  if (world.roleStatus[id]) return;
  world.roleStatus[id] = { state, reason };
  const r = world.roles.find((x) => x.id === id);
  if (!r) return;
  const by = r.orgId ? party(r.orgId)!.name : person(r.authorId!).name;
  const told = new Set<string>();
  world.interests
    .filter((i) => i.opportunityId === id && !i.withdrawn && i.personId !== chosenId)
    .forEach((i) => {
      if (told.has(i.personId)) return;
      told.add(i.personId);
      // The public name only: someone who showed interest never learns the working title this way.
      world.notifications.unshift({ id: wid('wn'), toPersonId: i.personId, kind: 'interest', actorId: r.orgId ?? r.authorId!, text: `${by} ${state === 'filled' ? 'filled' : 'closed'} ${r.role} on ${r.project}. Thanks for your interest.`, time: 'now', unread: true, route: { name: 'opportunity', id } });
    });
}

/** After publishing, details can change but not what the role is. Material changes are listed to people who showed interest. */
export function editRole(_actor: Actor, id: string, patch: Partial<Opportunity>, changed: string[]) {
  const r = world.roleEdits[id];
  world.roleEdits[id] = { ...r, ...patch, changed: [...new Set([...(r?.changed ?? []), ...changed])] };
}

export function reopenRole(_actor: Actor, id: string) {
  delete world.roleStatus[id];
}

/* ------------------------------------------------------------ people on a project */

export function addToProject(_actor: Actor, projectId: string, who: { personId?: string; pending?: { name: string; phone: string } }, workingRole: string, dept: string, fromRoleId?: string) {
  const p = wproject(projectId)!;
  const a: Association = { id: wid('wa'), projectId, ...who, workingRole, dept, fromRoleId, status: 'added' };
  world.associations.push(a);
  const owner = p.houseId ? party(p.houseId)!.name : person(p.ownerId!).name;
  // Transparency, not permission: the person is told privately. There is nothing to accept.
  if (who.personId) world.notifications.unshift({ id: wid('wn'), toPersonId: who.personId, kind: 'credit', actorId: p.houseId ?? p.ownerId!, text: `${owner} added you to ${p.workingTitle} as ${workingRole}`, time: 'now', unread: true, route: { name: 'association', id: a.id } });
  return a.id;
}

export function editAssociation(_actor: Actor, id: string, patch: Partial<Association>) {
  const a = world.associations.find((x) => x.id === id);
  if (!a) return;
  Object.assign(a, patch);
  if (a.status === 'flagged' && (patch.workingRole || patch.dept)) a.status = 'added';
}

/** Removing someone from a project drops anything not yet accepted. An accepted credit stays: it is their record. */
export function removeAssociation(actor: Actor, id: string) {
  editAssociation(actor, id, { status: 'removed' });
  world.credits = world.credits.filter((x) => !(x.associationId === id && x.status !== 'accepted'));
}

export function flagAssociation(_actor: Actor, id: string) {
  const a = world.associations.find((x) => x.id === id);
  if (!a) return;
  a.status = 'flagged';
  const p = wproject(a.projectId)!;
  if (p.houseId) world.notifications.unshift({ id: wid('wn'), forId: p.houseId, kind: 'credit', actorId: a.personId!, text: `${person(a.personId!).name} says being on ${p.workingTitle} as ${a.workingRole} isn't right`, time: 'now', unread: true, route: { name: 'hproject', id: p.id } });
}

/* ------------------------------------------------------------ credits */

/** Without credit authority a member can only prepare a credit; someone with authority issues it. */
export function issueCredit(actor: Actor, associationId: string, line: string, dept: string) {
  const a = world.associations.find((x) => x.id === associationId)!;
  const p = wproject(a.projectId)!;
  // An accepted credit is never reissued over. Changing it goes through an amendment the person asks for and accepts.
  if (world.credits.some((c) => c.associationId === associationId && c.status === 'accepted')) return undefined;
  const status = actor.canIssue ? 'proposed' : 'prepared';
  const corrected = world.credits.some((c) => c.associationId === associationId && c.status === 'correction');
  world.credits = world.credits.filter((c) => c.associationId !== associationId || c.status === 'accepted');
  const c = { id: wid('wc'), projectId: a.projectId, associationId, personId: a.personId!, line, dept, status, issuedBy: actor.viewerId } as const;
  world.credits.push({ ...c });
  // The notification opens the person's own view of the project, where the credit waits for them.
  if (status === 'proposed') world.notifications.unshift({ id: wid('wn'), toPersonId: a.personId, kind: 'credit', actorId: p.houseId!, text: `${party(p.houseId!)?.name} issued you ${corrected ? 'a corrected credit' : 'a credit'} on ${p.workingTitle}: ${line}. Accept it to make it official.`, time: 'now', unread: true, route: { name: 'association', id: associationId } });
  return status;
}

export function proposePrepared(_actor: Actor, creditId: string) {
  const c = world.credits.find((x) => x.id === creditId);
  if (!c) return;
  const p = wproject(c.projectId)!;
  c.status = 'proposed';
  world.notifications.unshift({ id: wid('wn'), toPersonId: c.personId, kind: 'credit', actorId: p.houseId!, text: `${party(p.houseId!)!.name} issued you a credit on ${p.workingTitle}: ${c.line}. Accept it to make it official.`, time: 'now', unread: true, route: { name: 'association', id: c.associationId } });
}

/** The person accepts a credit a production issued to them. Returns the project, or nothing if there was no such credit. */
export function acceptCredit(actor: Actor, cid: string) {
  const wc = world.credits.find((x) => x.id === cid);
  if (!wc || wc.status !== 'proposed') return undefined;
  wc.status = 'accepted';
  // A revised credit replaces the version it amends. The old version is kept as history, never deleted.
  const old = wc.supersedes ? world.credits.find((x) => x.id === wc.supersedes) : undefined;
  if (old) old.status = 'superseded';
  world.amendments.forEach((m) => m.revisionId === cid && (m.status = 'accepted'));
  const p = wproject(wc.projectId)!;
  world.notifications.unshift({ id: wid('wn'), forId: p.houseId, kind: 'credit', actorId: actor.viewerId, text: `${person(actor.viewerId).name} accepted the ${old ? 'revised ' : ''}credit on ${p.workingTitle}: ${wc.line}`, time: 'now', unread: true, route: { name: 'hproject', id: p.id } });
  return p;
}

export function requestCorrection(actor: Actor, cid: string, reason?: string) {
  const wc = world.credits.find((x) => x.id === cid);
  if (!wc) return false;
  // An accepted credit is a professional record: it is never sent back. The person asks for an amendment instead.
  if (wc.status === 'accepted') return !!requestAmendment(actor, cid, reason ?? '');
  // A revised version they don't want: the accepted credit stays as it is.
  if (wc.supersedes) return declineRevision(actor, cid);
  wc.status = 'correction';
  wc.note = reason;
  const p = wproject(wc.projectId)!;
  world.notifications.unshift({ id: wid('wn'), forId: p.houseId, kind: 'credit', actorId: actor.viewerId, text: `${person(actor.viewerId).name} asked to correct a credit on ${p.workingTitle}: ${reason ?? ''}`, time: 'now', unread: true, route: { name: 'hproject', id: p.id } });
  return true;
}

/* ------------------------------------------------------------ amending an accepted credit */

/**
 * The person asks to amend an accepted credit. Nothing about the credit changes: it stays public as it
 * is while the house reviews. One open request per credit.
 */
export function requestAmendment(actor: Actor, creditId: string, reason: string) {
  const c = world.credits.find((x) => x.id === creditId);
  if (!c || c.status !== 'accepted' || c.personId !== actor.viewerId) return undefined;
  if (world.amendments.some((m) => m.creditId === creditId && (m.status === 'open' || m.status === 'revised'))) return undefined;
  const m: Amendment = { id: wid('am'), creditId, associationId: c.associationId, projectId: c.projectId, personId: c.personId, reason, status: 'open' };
  world.amendments.push(m);
  const p = wproject(c.projectId)!;
  world.notifications.unshift({ id: wid('wn'), forId: p.houseId, kind: 'credit', actorId: c.personId, text: `${person(c.personId).name} asked to amend an accepted credit on ${p.workingTitle}: ${reason}`, time: 'now', unread: true, route: { name: 'hproject', id: p.id } });
  return m.id;
}

/** The house agrees and proposes a revised credit. The accepted one stays public until the person accepts the revision. */
export function proposeRevision(actor: Actor, amendmentId: string, line: string, dept: string) {
  const m = world.amendments.find((x) => x.id === amendmentId);
  if (!m || m.status !== 'open') return undefined;
  const old = world.credits.find((x) => x.id === m.creditId)!;
  const p = wproject(m.projectId)!;
  const c = { id: wid('wc'), projectId: m.projectId, associationId: m.associationId, personId: m.personId, line, dept, status: 'proposed' as const, supersedes: old.id, issuedBy: actor.viewerId };
  world.credits.push(c);
  m.status = 'revised';
  m.revisionId = c.id;
  world.notifications.unshift({ id: wid('wn'), toPersonId: m.personId, kind: 'credit', actorId: p.houseId!, text: `${party(p.houseId!)!.name} proposed a revised credit on ${p.workingTitle}: ${line}. Your current credit stays until you accept.`, time: 'now', unread: true, route: { name: 'association', id: m.associationId } });
  return c.id;
}

/** The house does not agree. The accepted credit remains the current public record. */
export function keepCredit(_actor: Actor, amendmentId: string) {
  const m = world.amendments.find((x) => x.id === amendmentId);
  if (!m || m.status !== 'open') return false;
  m.status = 'kept';
  const p = wproject(m.projectId)!;
  world.notifications.unshift({ id: wid('wn'), toPersonId: m.personId, kind: 'credit', actorId: p.houseId!, text: `${party(p.houseId!)!.name} kept your credit on ${p.workingTitle} as it is`, time: 'now', unread: true, route: { name: 'association', id: m.associationId } });
  return true;
}

/** The person prefers their current credit to the revised version. The revision is kept as history. */
export function declineRevision(actor: Actor, revisionId: string) {
  const r = world.credits.find((x) => x.id === revisionId);
  if (!r || !r.supersedes || r.status !== 'proposed' || r.personId !== actor.viewerId) return false;
  r.status = 'declined';
  world.amendments.forEach((m) => m.revisionId === revisionId && (m.status = 'withdrawn'));
  return true;
}

/* ------------------------------------------------------------ interest */

/** Roles created in the prototype reach their house through the shared world. Returns false for plain listings. */
export function sendInterest(actor: Actor, id: string, note: string, answers?: string[]) {
  const role = world.roles.find((r) => r.id === id);
  if (!role || blockedBetween(actor.viewerId, role.orgId ?? role.authorId ?? '')) return false;
  world.interests = world.interests.filter((i) => !(i.opportunityId === id && i.personId === actor.viewerId));
  world.interests.push({ id: wid('wi'), personId: actor.viewerId, opportunityId: id, note: note || undefined, answers: answers?.some(Boolean) ? answers : undefined, time: 'now' });
  const r = world.roles.find((x) => x.id === id)!;
  if (r.orgId) world.notifications.unshift({ id: wid('wn'), forId: r.orgId, kind: 'interest', actorId: actor.viewerId, text: `${person(actor.viewerId).name} is interested in ${r.role} on ${r.project}`, time: 'now', unread: true, route: { name: 'hproject', id: r.projectId } });
  return true;
}

/** Withdrawing keeps the record. The house sees "No longer interested" in its review, never a silent gap. */
export function withdrawInterest(actor: Actor, id: string) {
  world.interests.forEach((i) => i.opportunityId === id && i.personId === actor.viewerId && (i.withdrawn = true));
}

export function undoWithdrawInterest(actor: Actor, id: string) {
  world.interests.forEach((i) => i.opportunityId === id && i.personId === actor.viewerId && (i.withdrawn = false));
}

/** The house's side of reviewing one Interest. The person is never told "Not now". */
export function reviewInterest(_actor: Actor, interestId: string, review: 'messaged' | 'notNow' | undefined) {
  const i = world.interests.find((x) => x.id === interestId);
  if (i) i.review = review;
}

/* ------------------------------------------------------------ conversations */

/** The identity this actor speaks as: themselves, or the house they are acting for. */
export const speakingAs = (actor: Actor) => (actor.acting === 'self' ? actor.viewerId : actor.acting);

/** A block by either person closes contact between the two identities. Houses don't block; people do. */
export const blockedBetween = (a: string, b: string) => world.blocks.some((x) => (x.by === a && x.target === b) || (x.by === b && x.target === a));

/**
 * Whether this actor may contact that party. Checks the identity they speak as (a block of the house)
 * and the human behind it (a block of them personally), so switching to a house can't get round a block.
 * Another member of the same house is unaffected unless the house itself is blocked.
 */
export const mayContact = (actor: Actor, other: string, as = speakingAs(actor)) => !blockedBetween(as, other) && !blockedBetween(actor.viewerId, other);

/** One thread per pair of identities and context. Direct messages share one context per pair. */
export function startThread(actor: Actor, withId: string, context: Thread['context'], media?: Thread['media']): string | undefined {
  const me = speakingAs(actor);
  const found = world.threads.find((t) => t.sides.includes(me) && t.sides.includes(withId) && t.context.refId === context.refId);
  if (found) return found.id;
  if (!mayContact(actor, withId, me)) return undefined;
  const t: Thread = { id: wid('th'), sides: [me, withId], context, media, messages: [], unreadFor: [], updated: 'now' };
  world.threads.unshift(t);
  return t.id;
}

export function sendThreadMessage(actor: Actor, threadId: string, text: string, time: string) {
  const t = world.threads.find((x) => x.id === threadId);
  if (!t) return false;
  const me = t.sides.includes(speakingAs(actor)) ? speakingAs(actor) : t.sides.find((s) => s === actor.viewerId || actor.memberships.includes(s))!;
  const other = t.sides.find((s) => s !== me)!;
  if (!mayContact(actor, other, me)) return false;
  const first = !t.messages.some((m) => m.from === me);
  t.messages.push({ id: wid('m'), from: me, by: actor.viewerId, text, time });
  t.unreadFor = [other];
  t.updated = 'now';
  if (t.action?.side === me) t.action = undefined;
  world.threads = [t, ...world.threads.filter((x) => x !== t)];
  // The first message from one side tells the other side, addressed to the identity that owns the thread.
  if (first) {
    const about = t.context.kind === 'project' ? '' : ` about ${t.context.detail.split(' · ')[0]}`;
    const to = seed.orgs.some((o) => o.id === other) ? { forId: other } : { toPersonId: other };
    world.notifications.unshift({ id: wid('wn'), ...to, kind: 'message', actorId: me, text: `${party(me)!.name} messaged you${about}`, time: 'now', unread: true, route: { name: 'conversation', id: t.id } });
  }
  return true;
}

export function markThreadRead(actor: Actor, threadId: string) {
  const t = world.threads.find((x) => x.id === threadId);
  if (!t) return;
  t.unreadFor = t.unreadFor.filter((s) => s !== actor.viewerId && !actor.memberships.includes(s));
}

/* ------------------------------------------------------------ blocking */

/** Personal: a member acting for a house still blocks for their own account only. Records are untouched. */
export function block(actor: Actor, target: string) {
  if (!world.blocks.some((b) => b.by === actor.viewerId && b.target === target)) world.blocks.push({ by: actor.viewerId, target });
}

export function unblock(actor: Actor, target: string) {
  world.blocks = world.blocks.filter((b) => !(b.by === actor.viewerId && b.target === target));
}

/** A filled role keeps its record. Hiring again for the same craft and project is a new role. */
export function openAgainFrom(base: Opportunity) {
  return { ...base, id: `${base.id}-again-${Date.now()}`, postedAgo: 'now', closesInDays: 14 };
}

/* ------------------------------------------------------------ houses */

export function verifyPendingHouses() {
  seed.orgs.forEach((o) => (o.verified = true));
}

/* ------------------------------------------------------------ reviews */

/** Whether this actor may review the film right now: released, open, and not made by them or their house. */
export function mayReview(actor: Actor, projectId: string, now = Date.now()) {
  const p = wproject(projectId);
  if (!p?.shared || !reviewsOpen(p, now)) return false;
  return canReview({ viewerId: actor.viewerId, acting: actor.acting, memberships: actor.memberships, creditedIds: creditedOn(projectId), houseIds: [p.houseId, ...(p.coHouseIds ?? [])].filter((x): x is string => !!x) });
}

/** One review per person per film: saving again edits it. */
export function saveReview(actor: Actor, projectId: string, d: { stars: number; text?: string; spoiler?: boolean }) {
  if (!mayReview(actor, projectId) || !validStars(d.stars)) return false;
  const text = d.text?.trim().slice(0, MAX_TEXT) || undefined;
  const mine = world.reviews.find((r) => r.projectId === projectId && r.personId === actor.viewerId);
  if (mine) Object.assign(mine, { stars: d.stars, text, spoiler: !!text && !!d.spoiler, edited: true });
  else world.reviews.unshift({ id: wid('rv'), projectId, personId: actor.viewerId, stars: d.stars, text, spoiler: !!text && !!d.spoiler, at: Date.now(), helpful: [] });
  return true;
}

export function deleteReview(actor: Actor, id: string) {
  const i = world.reviews.findIndex((r) => r.id === id && r.personId === actor.viewerId);
  if (i < 0) return undefined;
  return world.reviews.splice(i, 1)[0];
}

export function restoreReview(r: Review) {
  if (!world.reviews.some((x) => x.projectId === r.projectId && x.personId === r.personId)) world.reviews.unshift(r);
}

/** Helpful is personal and never on your own review. */
export function toggleHelpful(actor: Actor, id: string) {
  const r = world.reviews.find((x) => x.id === id);
  if (!r || r.personId === actor.viewerId) return;
  r.helpful = r.helpful.includes(actor.viewerId) ? r.helpful.filter((x) => x !== actor.viewerId) : [...r.helpful, actor.viewerId];
}

/* ------------------------------------------------------------ phone and records added by phone */

/**
 * Verify a mobile number for this account (the code step happens in the screen). One number belongs to one
 * person (EC-AUTH-015): a number verified elsewhere is refused. Identity only: nothing is shared with anyone.
 */
export function verifyPhone(actor: Actor, number: string): 'ok' | 'invalid' | 'taken' {
  if (!validPhone(number)) return 'invalid';
  if (phoneTaken(number, actor.viewerId)) return 'taken';
  profileOf(actor.viewerId).phone = { number: normalisePhone(number), verified: true };
  return 'ok';
}

/**
 * The person confirms a project record a production created against their verified number
 * (docs/CONSOLIDATION.md §7): it becomes a normal association. Never automatic, never by name. Credits then
 * follow the unchanged credit rules.
 */
export function confirmPendingRecord(actor: Actor, associationId: string) {
  const x = profileOf(actor.viewerId);
  const a = world.associations.find((r) => r.id === associationId);
  if (!a?.pending || a.personId || !x.phone?.verified || normalisePhone(a.pending.phone) !== x.phone.number) return false;
  a.personId = actor.viewerId;
  delete a.pending;
  const p = wproject(a.projectId)!;
  if (p.houseId) world.notifications.unshift({ id: wid('wn'), forId: p.houseId, kind: 'credit', actorId: actor.viewerId, text: `${person(actor.viewerId).name} confirmed they're on ${p.workingTitle} as ${a.workingRole}`, time: 'now', unread: true, route: { name: 'hproject', id: p.id } });
  return true;
}

/** "Not me": the record stays private to the house and no further invites go to this number (EC-PEND-002). */
export function declinePendingRecord(actor: Actor, associationId: string) {
  const x = profileOf(actor.viewerId);
  const a = world.associations.find((r) => r.id === associationId);
  if (!a?.pending || !x.phone?.verified || normalisePhone(a.pending.phone) !== x.phone.number) return false;
  a.pending.notMe = true;
  return true;
}
