import { compose, type ComposeOptions } from './compose';
import { rank } from './rank';
import { keysOf, pruneSeen, withoutSeen, type Seen } from './seen';
import { eligible } from './significance';
import { MIN_UNITS, type Candidate, type Composition, type PersonalNews } from './types';

/**
 * When Home changes (docs/HOME.md):
 *  - composed once per session (a fresh launch, or a refresh), then kept exactly as it is for that session,
 *    so opening a project and coming back shows the same page;
 *  - urgent personal news (a credit, interest in you) may enter the personal-news position of an already
 *    composed Home; nothing else moves;
 *  - an item shown in an earlier session is not shown again unless it materially changed, except when that
 *    would leave the page below the minimum;
 *  - below the minimum, the cold-start sources (already in sourcing order) top it up. Never weak filler.
 */
export interface HomeInput {
  candidates: Candidate[];
  personal: PersonalNews | null;
  /** Cold-start sources in order: craft + place, active projects, people, work, houses. */
  coldStart: Candidate[];
  /** How a first Home is composed (shorter). */
  options?: ComposeOptions;
}
export interface KV {
  get(k: string): string | null;
  set(k: string, v: string): void;
}
export const memoryKV = (): KV => {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v) };
};

const COMP = 'aa-home-composition';
const SEEN = 'aa-home-seen';
const read = <T,>(kv: KV, k: string): T | null => {
  try {
    return JSON.parse(kv.get(k) ?? 'null') as T | null;
  } catch {
    return null;
  }
};
const units = (c: Composition) => (c.lead ? 1 : 0) + c.middle.length;

export function getComposition(build: () => HomeInput, ctx: { now: number; sessionKey: string; kv: KV }): Composition {
  const { now, sessionKey, kv } = ctx;
  const stored = read<{ sessionKey: string; comp: Composition }>(kv, COMP);
  if (stored && stored.sessionKey === sessionKey) {
    const p = build().personal;
    const cur = stored.comp.personal;
    if (p?.urgent && p.id !== cur?.id && (!cur || p.at > cur.at)) {
      const comp = { ...stored.comp, personal: p };
      kv.set(COMP, JSON.stringify({ sessionKey, comp }));
      return comp;
    }
    return stored.comp;
  }

  let seen: Seen = pruneSeen(read<Seen>(kv, SEEN) ?? {}, now);
  if (stored) for (const k of keysOf(stored.comp)) seen[k] = stored.comp.composedAt;
  seen = pruneSeen(seen, now);

  const input = build();
  const all = eligible(input.candidates, now);
  let comp = compose(rank(withoutSeen(all, seen)), input.personal, now, input.options);
  if (units(comp) < MIN_UNITS) comp = compose(rank(all), input.personal, now, input.options);
  if (units(comp) < MIN_UNITS) {
    const ids = new Set(all.map((x) => x.id));
    comp = compose([...rank(all), ...eligible(input.coldStart, now).filter((x) => !ids.has(x.id))], input.personal, now, input.options);
  }
  comp = withGroups(comp, rank([...all, ...eligible(input.coldStart, now)]));
  kv.set(COMP, JSON.stringify({ sessionKey, comp }));
  kv.set(SEEN, JSON.stringify(seen));
  return comp;
}

/**
 * Group units show more than one item (In production: up to three updates). The composer places the best
 * one; the next best of the same type ride along in `data.more`, never a project already on the page.
 */
function withGroups(comp: Composition, ranked: Candidate[]): Composition {
  const used = new Set([comp.lead?.id, ...comp.middle.map((x) => x.id)]);
  const onPage = [comp.lead, ...comp.middle].flatMap((x) => [x?.data?.projectId, x?.data?.project]).filter(Boolean);
  const middle = comp.middle.map((u) => {
    if (u.type !== 'projectUpdates') return u;
    const seenProjects = new Set([...onPage, u.data?.projectId, u.data?.project]);
    const more: Candidate[] = [];
    for (const x of ranked) {
      if (more.length >= 2) break;
      if (x.type !== 'projectUpdates' || used.has(x.id) || seenProjects.has(x.data?.projectId) || seenProjects.has(x.data?.project)) continue;
      seenProjects.add(x.data?.projectId);
      seenProjects.add(x.data?.project);
      more.push(x);
    }
    return { ...u, data: { ...u.data, more } };
  });
  return { ...comp, middle };
}
