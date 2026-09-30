import * as seed from '../data/seed';
import * as act from '../domain/actions';
import { world, wid } from '../state/world';

/*
 * Named changes to the canonical records, written as "name:arg:arg". A scenario lists the ops it
 * needs; they run once, after seeding and before the app renders. Ops only ever build a starting
 * state through the same records the product uses. They never add special cases to screens.
 */

/** A house member with full authority, used to set records up. Not the scenario's own identity. */
const setupActor = (orgId: string): act.Actor => ({ viewerId: 'aditi', acting: orgId, memberships: [orgId], canIssue: true });

function association(personId: string, projectId: string, line: string, dept: string) {
  const a = { id: wid('wa'), projectId, personId, workingRole: line, dept, status: 'added' as const };
  world.associations.push(a);
  return a;
}

export const OPS: Record<string, (...args: string[]) => void> = {
  /** The house loses (or never had) verification. */
  unverify: (orgId) => {
    const o = seed.orgs.find((x) => x.id === orgId);
    if (o) o.verified = false;
  },
  /** A production has issued this person a credit, and they have accepted it. */
  accepted: (personId, projectId, line, dept = 'Production') => {
    const a = association(personId, projectId, line, dept);
    world.credits.push({ id: `c-fx-${personId}-${projectId}`, projectId, associationId: a.id, personId, line, dept, status: 'accepted' });
  },
  /** A production has issued this person a credit; they have not answered yet. */
  proposed: (personId, projectId, line, dept = 'Production') => {
    const a = association(personId, projectId, line, dept);
    world.credits.push({ id: `c-fx-${personId}-${projectId}`, projectId, associationId: a.id, personId, line, dept, status: 'proposed' });
  },
  /** Someone is on the project privately, with no credit yet. */
  added: (personId, projectId, line, dept = 'Production') => {
    association(personId, projectId, line, dept);
  },
  /** Someone not on Ana is on the project by phone. */
  pending: (projectId, name, phone) => {
    world.associations.push({ id: wid('wa'), projectId, pending: { name, phone }, workingRole: 'Assistant Director', dept: 'Direction', status: 'added' });
  },
  /** The production removed this person from the project. */
  removed: (personId, projectId) => {
    world.associations.filter((a) => a.personId === personId && a.projectId === projectId).forEach((a) => act.removeAssociation(setupActor('konark'), a.id));
  },
  /** An open role on Konark's private, unannounced series Kaal. */
  roleOnPrivate: () => {
    act.addRole(setupActor('konark'), 'kaal', { role: 'Script Supervisor', about: 'Hindi web series, 40-day schedule in Mumbai.', dates: 'Feb – Mar 2027', city: 'Mumbai', paid: true, compensation: 'Paid', questions: [], visibility: 'open' });
  },
  /** The role has been closed, or filled. */
  closeRole: (roleId) => act.closeRole(setupActor('konark'), roleId, 'closed', 'Closed early'),
  fillRole: (roleId) => act.closeRole(setupActor('konark'), roleId, 'filled', 'Filled on Ana'),
  /** This person has shown Interest in this role. */
  interest: (personId, roleId) => {
    act.sendInterest({ viewerId: personId, acting: 'self', memberships: [], canIssue: false }, roleId, '');
  },
};

export function applyOps(ops: string[] = []) {
  ops.forEach((spec) => {
    const [name, ...args] = spec.split(':');
    const op = OPS[name];
    if (!op) throw new Error(`Unknown fixture op: ${name}`);
    op(...args);
  });
}
