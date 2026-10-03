import type { Person } from '../../data/types';
import type { Candidate } from '../../domain/home/types';

/** Events on Home (docs/EVENTS.md). Filled in by the Events work; nothing until then. */
export function eventCandidates(_me: Person, _loadedAt: number): Candidate[] {
  return [];
}

export function EventRow(_: { c: Candidate; position: number; lead?: boolean }) {
  return null;
}
