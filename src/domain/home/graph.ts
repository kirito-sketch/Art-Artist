import * as seed from '../../data/seed';
import { publicCreditsFor } from '../discovery';
import { work } from '../../state/world';

/*
 * The verified work graph: Person -> verified Credit -> Project -> other verified People. It writes Home's
 * reason lines ("Worked with you on Monsoon Letters") and its relationship scores. Only accepted credits on
 * shared projects count, the same rule as public profiles, so nothing private ever leaks into a reason.
 */
const projectsOf = (personId: string) => new Set(publicCreditsFor(personId).map((c) => c.projectId));

export function creditedOn(projectId: string): string[] {
  return seed.people.filter((p) => projectsOf(p.id).has(projectId)).map((p) => p.id);
}

export function workedWith(personId: string): Set<string> {
  const mine = projectsOf(personId);
  return new Set(seed.people.filter((p) => p.id !== personId && [...projectsOf(p.id)].some((x) => mine.has(x))).map((p) => p.id));
}

export function sharedProject(a: string, b: string): { id: string; title: string } | null {
  const mine = projectsOf(a);
  const id = [...projectsOf(b)].find((x) => mine.has(x));
  if (!id) return null;
  return { id, title: work(id)?.title ?? id };
}

/** One line, only when it says something true about how you are connected. */
export function reasonForPerson(meId: string, personId: string): string | null {
  if (meId === personId) return null;
  const shared = sharedProject(meId, personId);
  if (shared) return `Worked with you on ${shared.title}`;
  const mine = workedWith(meId);
  const theirs = workedWith(personId);
  const both = [...theirs].filter((x) => mine.has(x));
  if (both.length === 1) {
    const via = seed.people.find((p) => p.id === both[0]);
    const on = sharedProject(personId, both[0]);
    return via && on ? `Worked with ${via.name.split(' ')[0]} on ${on.title}` : null;
  }
  if (both.length > 1) return `${both.length} people you've worked with have worked with them`;
  return null;
}

/** 0..1: how close someone is in the graph (1 worked with, 0.6 collaborator of a collaborator, else 0). */
export function closeness(meId: string, personId: string): number {
  if (workedWith(meId).has(personId)) return 1;
  const mine = workedWith(meId);
  return [...workedWith(personId)].some((x) => mine.has(x)) ? 0.6 : 0;
}
