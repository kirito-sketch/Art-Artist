import type { Interest, Opportunity, Person } from '../data/types';
import { familyMates, nearCrafts } from '../data/taxonomy';
import type { Amendment, Association, HouseProject, WorldCredit } from '../state/world';

export type HouseRole = Opportunity & { projectId: string; visibility: 'private' | 'open' };
export type HouseDecision = {
  id: string;
  projectId: string;
  title: string;
  fact: string;
  kind: 'association' | 'correction' | 'amendment' | 'closing' | 'interest';
  associationId?: string;
  roleId?: string;
  days?: number;
};

/** Only decisions the house can make. Waiting for acceptance is a project status. */
export function houseDecisions(input: {
  projects: HouseProject[];
  roles: HouseRole[];
  interests: Interest[];
  associations: Association[];
  credits: WorldCredit[];
  amendments: Amendment[];
}): HouseDecision[] {
  const ids = new Set(input.projects.map((p) => p.id));
  const associations = input.associations.filter((a) => ids.has(a.projectId) && a.status !== 'removed');
  const activeIds = new Set(associations.map((a) => a.id));
  const out: HouseDecision[] = associations
    .filter((a) => a.status === 'flagged')
    .map((a) => ({
      id: `association:${a.id}`,
      projectId: a.projectId,
      associationId: a.id,
      title: 'Check project association',
      fact: `${a.workingRole} · Says this isn't right`,
      kind: 'association',
    }));
  input.credits
    .filter((c) => ids.has(c.projectId) && activeIds.has(c.associationId) && c.status === 'correction')
    .forEach((c) =>
      out.push({
        id: `correction:${c.id}`,
        projectId: c.projectId,
        associationId: c.associationId,
        title: 'Correct a credit',
        fact: c.line,
        kind: 'correction',
      }),
    );
  input.amendments
    .filter((m) => ids.has(m.projectId) && activeIds.has(m.associationId) && m.status === 'open')
    .forEach((m) =>
      out.push({
        id: `amendment:${m.id}`,
        projectId: m.projectId,
        associationId: m.associationId,
        title: 'Review credit amendment',
        fact: m.reason,
        kind: 'amendment',
      }),
    );
  input.roles
    .filter((r) => ids.has(r.projectId) && r.visibility === 'open' && (r.closesInDays == null || r.closesInDays >= 0))
    .forEach((r) => {
      const fresh = input.interests.filter((i) => i.opportunityId === r.id && !i.withdrawn && !i.review).length;
      if (r.closesInDays != null && r.closesInDays >= 0 && r.closesInDays <= 3) {
        out.push({
          id: `closing:${r.id}`,
          projectId: r.projectId,
          roleId: r.id,
          title: r.role,
          fact: r.closesInDays === 0 ? 'Closes today' : r.closesInDays === 1 ? 'Closes tomorrow' : `Closes in ${r.closesInDays} days`,
          kind: 'closing',
          days: r.closesInDays,
        });
      } else if (fresh) {
        out.push({
          id: `interest:${r.id}`,
          projectId: r.projectId,
          roleId: r.id,
          title: r.role,
          fact: `${fresh} new ${fresh === 1 ? 'person' : 'people'} interested`,
          kind: 'interest',
        });
      }
    });
  const priority: Record<HouseDecision['kind'], number> = { association: 0, correction: 1, amendment: 2, closing: 3, interest: 4 };
  return out.sort((a, b) => priority[a.kind] - priority[b.kind] || (a.days ?? 0) - (b.days ?? 0) || a.id.localeCompare(b.id));
}

/** Exact crafts lead; taxonomy neighbours widen the pool without inventing a match score. */
export function peopleForHouseRoles(people: Person[], roles: HouseRole[], city: string, creditCounts: Record<string, number> = {}) {
  const fit = (p: Person, r: HouseRole) => {
    const crafts = [p.craft, ...(p.crafts ?? [])];
    if (r.forCrafts.some((c) => crafts.includes(c))) return 3;
    if (r.forCrafts.some((c) => familyMates(c).some((x) => crafts.includes(x)))) return 2;
    return r.forCrafts.some((c) => nearCrafts(c).some((x) => crafts.includes(x))) ? 1 : 0;
  };
  return people
    .filter((p) => p.visibility === 'public')
    .map((p) => {
      const role = roles.map((r) => ({ r, fit: fit(p, r) })).sort((a, b) => b.fit - a.fit || a.r.id.localeCompare(b.r.id))[0];
      return { person: p, role: role?.fit ? role.r : undefined, fit: role?.fit ?? 0 };
    })
    .filter((x) => !roles.length || x.fit > 0)
    .sort(
      (a, b) =>
        b.fit - a.fit ||
        Number(b.person.city === city) - Number(a.person.city === city) ||
        Number(!!b.person.availableFrom) - Number(!!a.person.availableFrom) ||
        (creditCounts[b.person.id] ?? 0) - (creditCounts[a.person.id] ?? 0) ||
        a.person.id.localeCompare(b.person.id),
    );
}
