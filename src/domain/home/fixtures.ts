import type { Candidate, MiddleType } from './types';

/** Test factory: a medium-significance post, fresh, of good quality. Override what a test is about. */
let n = 0;
export const NOW = Date.UTC(2026, 9, 3, 9);
export const c = (p: Partial<Candidate> & { type?: MiddleType } = {}): Candidate => {
  n += 1;
  const type = p.type ?? 'post';
  const objectId = p.objectId ?? `${type}${n}`;
  return { id: `${type}:${objectId}`, type, objectId, version: '1', significance: 'medium', relationship: 0, professional: 0, place: 0, at: NOW - 864e5, quality: 0.8, leadable: false, ...p };
};
export const types = (cs: { type: string }[]) => cs.map((x) => x.type);
