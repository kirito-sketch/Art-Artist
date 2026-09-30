import * as seed from '../data/seed';
import { world } from '../state/world';

/*
 * The canonical demo data, captured once right after seeding. Automated checks restore it before
 * and after every check, so no check can leak into another, and none can change what the normal
 * prototype or Research Mode start from. (Those start from a fresh page load, which re-seeds anyway.)
 */

type WorldData = Omit<typeof world, never>;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const base = {
  world: clone(world) as WorldData,
  people: seed.people.map((p) => [p, clone(p)] as const),
  orgs: seed.orgs.map((o) => [o, clone(o)] as const),
  opportunities: [...seed.opportunities],
  parties: Object.keys(seed.parties),
};

export function restoreCanonical() {
  const w = clone(base.world);
  world.projects = w.projects;
  world.roles = w.roles;
  world.associations = w.associations;
  world.credits = w.credits;
  world.interests = w.interests;
  world.notifications = w.notifications;
  world.threads = w.threads;
  world.blocks = w.blocks;
  world.roleEdits = w.roleEdits;
  world.amendments = w.amendments;
  for (const k of Object.keys(world.roleStatus)) delete world.roleStatus[k];
  Object.assign(world.roleStatus, w.roleStatus);
  seed.people.length = 0;
  base.people.forEach(([ref, data]) => {
    for (const k of Object.keys(ref)) delete (ref as unknown as Record<string, unknown>)[k];
    Object.assign(ref, clone(data));
    seed.people.push(ref);
  });
  seed.orgs.length = 0;
  base.orgs.forEach(([ref, data]) => {
    for (const k of Object.keys(ref)) delete (ref as unknown as Record<string, unknown>)[k];
    Object.assign(ref, clone(data));
    seed.orgs.push(ref);
  });
  seed.opportunities.length = 0;
  seed.opportunities.push(...base.opportunities);
  for (const k of Object.keys(seed.parties)) if (!base.parties.includes(k)) delete seed.parties[k];
}
