import type { Candidate, Composition } from './types';

/** seenKey -> when it was shown. A key includes the version, so a material change makes an item new again. */
export type Seen = Record<string, number>;
const SEEN_DAYS = 3;

export const seenKey = (x: Candidate) => `${x.id}@${x.version}`;
export const keysOf = (comp: Composition) => [comp.lead, ...comp.middle].filter((x): x is Candidate => !!x).map(seenKey);
export const withoutSeen = (cs: Candidate[], seen: Seen) => cs.filter((x) => !(seenKey(x) in seen));

/** Forget what was shown more than three days ago; keep the list small. */
export function pruneSeen(seen: Seen, now: number): Seen {
  const keep = Object.entries(seen)
    .filter(([, at]) => now - at <= SEEN_DAYS * 864e5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200);
  return Object.fromEntries(keep);
}
