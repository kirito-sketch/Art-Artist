import type { Interest, Media, Notification, Opportunity } from '../data/types';

/*
 * A small shared "backend" for the creation flows. It lives outside the per-viewer store so it survives
 * switching between Kiran, Tara and a house in the prototype panel, which is what lets the end-to-end
 * story be tested. Every concept is its own record:
 *   Project      private to its owner until deliberately shared
 *   Role         one object: private → open on Ana → filled / closed (an Opportunity with a projectId)
 *   Association  "this production currently associates you with this project in this working role"
 *   Credit       production-issued record: prepared → proposed → accepted | correction
 * An association is never a credit, and adding someone never makes anything public.
 */

export type Format = 'Feature' | 'Series' | 'Short' | 'Documentary' | 'Music video' | 'Ad film';
export const FORMATS: Format[] = ['Feature', 'Series', 'Short', 'Documentary', 'Music video', 'Ad film'];
export const LANGUAGES = ['Telugu', 'Hindi', 'Tamil', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'English'];
export const STAGES = ['Development', 'Pre-production', 'Shooting', 'Post-production', 'Released'] as const;

export interface HouseProject {
  id: string;
  /** Organisation that owns it, or a person for an independent project. */
  houseId?: string;
  ownerId?: string;
  workingTitle: string;
  format: Format;
  /** Projects can be multilingual; never assume exactly one. */
  languages: string[];
  stage: (typeof STAGES)[number];
  /** Public-facing details, filled in over time. Nothing here is public until shared. */
  publicTitle?: string;
  logline?: string;
  artwork?: Media;
  shared: boolean;
}

export interface Association {
  id: string;
  projectId: string;
  /** A real Ana person, or a private placeholder for someone not on Ana (never a profile). */
  personId?: string;
  pending?: { name: string; phone: string };
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
  status: 'prepared' | 'proposed' | 'accepted' | 'correction';
  note?: string;
}

export interface WorldInterest extends Interest {
  dismissed?: boolean;
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
import type { Work } from '../data/works';
const PLACEHOLDER: Media = { id: 'ph', kind: 'image', src: 'images/covers/neela.jpg' };
export function toPublicWork(p: HouseProject): Work | undefined {
  if (!p.shared) return undefined;
  return {
    id: p.id,
    title: publicName(p),
    year: '2026',
    format: `${p.format === 'Feature' ? 'Feature film' : p.format} · ${p.languages.join(', ')}`,
    stage: p.stage,
    orgIds: p.houseId ? [p.houseId] : [],
    ownerId: p.ownerId,
    logline: p.logline ?? '',
    media: p.artwork ?? PLACEHOLDER,
    stills: p.artwork ? [p.artwork] : [],
    credits: world.credits.filter((c) => c.projectId === p.id && c.status === 'accepted').map((c) => ({ personId: c.personId, role: c.line, dept: c.dept })),
  };
}
