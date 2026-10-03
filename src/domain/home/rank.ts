import type { Candidate } from './types';

/** Ranking answers "what matters most?". Composition decides how the page feels, separately. */
export const SIG = { high: 2, medium: 1, low: 0 } as const;
/** 0.05 bands: a tiny edge on one key never decides; the next key does. */
const band = (x: number) => Math.round(x / 0.05);

export function rank(cs: Candidate[]): Candidate[] {
  return [...cs].sort(
    (a, b) =>
      band(b.relationship) - band(a.relationship) ||
      SIG[b.significance] - SIG[a.significance] ||
      band(b.professional) - band(a.professional) ||
      band(b.place) - band(a.place) ||
      b.at - a.at ||
      a.id.localeCompare(b.id),
  );
}
