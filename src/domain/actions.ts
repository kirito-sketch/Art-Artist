import * as seed from '../data/seed';
import type { Opportunity } from '../data/types';
import { party, person } from '../state/selectors';
import { world, wid, publicName, project as wproject, type Association, type Format, type HouseProject } from '../state/world';

/*
 * The actions that change Ana's shared records (projects, roles, associations, credits, interests and
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
  const p: HouseProject = { id: wid('hp'), ...(actor.acting !== 'self' ? { houseId: actor.acting } : { ownerId: actor.viewerId }), workingTitle: d.workingTitle, format: d.format, languages: d.languages, stage: 'Development', shared: false };
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

export function closeRole(_actor: Actor, id: string, state: 'filled' | 'closed', reason: string) {
  world.roleStatus[id] = { state, reason };
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
  const status = actor.canIssue ? 'proposed' : 'prepared';
  world.credits = world.credits.filter((c) => c.associationId !== associationId || c.status === 'accepted');
  const c = { id: wid('wc'), projectId: a.projectId, associationId, personId: a.personId!, line, dept, status } as const;
  world.credits.push({ ...c });
  if (status === 'proposed') world.notifications.unshift({ id: wid('wn'), toPersonId: a.personId, kind: 'credit', actorId: p.houseId!, text: `${party(p.houseId!)?.name} issued you a credit on ${p.workingTitle}: ${line}. Accept it to make it official.`, time: 'now', unread: true, route: { name: 'profile', id: a.personId! } });
  return status;
}

export function proposePrepared(_actor: Actor, creditId: string) {
  const c = world.credits.find((x) => x.id === creditId);
  if (!c) return;
  const p = wproject(c.projectId)!;
  c.status = 'proposed';
  world.notifications.unshift({ id: wid('wn'), toPersonId: c.personId, kind: 'credit', actorId: p.houseId!, text: `${party(p.houseId!)!.name} issued you a credit on ${p.workingTitle}: ${c.line}. Accept it to make it official.`, time: 'now', unread: true, route: { name: 'profile', id: c.personId } });
}

/** The person accepts a credit a production issued to them. Returns the project, or nothing if there was no such credit. */
export function acceptCredit(actor: Actor, cid: string) {
  const wc = world.credits.find((x) => x.id === cid);
  if (!wc) return undefined;
  wc.status = 'accepted';
  const p = wproject(wc.projectId)!;
  world.notifications.unshift({ id: wid('wn'), forId: p.houseId, kind: 'credit', actorId: actor.viewerId, text: `${person(actor.viewerId).name} accepted the credit on ${p.workingTitle}: ${wc.line}`, time: 'now', unread: true, route: { name: 'hproject', id: p.id } });
  return p;
}

export function requestCorrection(actor: Actor, cid: string, reason?: string) {
  const wc = world.credits.find((x) => x.id === cid);
  if (!wc) return false;
  wc.status = 'correction';
  wc.note = reason;
  const p = wproject(wc.projectId)!;
  world.notifications.unshift({ id: wid('wn'), forId: p.houseId, kind: 'credit', actorId: actor.viewerId, text: `${person(actor.viewerId).name} asked to correct a credit on ${p.workingTitle}: ${reason ?? ''}`, time: 'now', unread: true, route: { name: 'hproject', id: p.id } });
  return true;
}

/* ------------------------------------------------------------ interest */

/** Roles created in the prototype reach their house through the shared world. Returns false for plain listings. */
export function sendInterest(actor: Actor, id: string, note: string, answers?: string[]) {
  if (!world.roles.some((r) => r.id === id)) return false;
  world.interests = world.interests.filter((i) => !(i.opportunityId === id && i.personId === actor.viewerId));
  world.interests.push({ id: wid('wi'), personId: actor.viewerId, opportunityId: id, note: note || undefined, answers: answers?.some(Boolean) ? answers : undefined, time: 'now' });
  const r = world.roles.find((x) => x.id === id)!;
  if (r.orgId) world.notifications.unshift({ id: wid('wn'), forId: r.orgId, kind: 'interest', actorId: actor.viewerId, text: `${person(actor.viewerId).name} is interested in ${r.role} on ${r.project}`, time: 'now', unread: true, route: { name: 'hproject', id: r.projectId } });
  return true;
}

export function withdrawInterest(actor: Actor, id: string) {
  world.interests.forEach((i) => i.opportunityId === id && i.personId === actor.viewerId && (i.withdrawn = true));
}

/** A filled role keeps its record. Hiring again for the same craft and project is a new role. */
export function openAgainFrom(base: Opportunity) {
  return { ...base, id: `${base.id}-again-${Date.now()}`, postedAgo: 'now', closesInDays: 14 };
}

/* ------------------------------------------------------------ houses */

export function verifyPendingHouses() {
  seed.orgs.forEach((o) => (o.verified = true));
}
