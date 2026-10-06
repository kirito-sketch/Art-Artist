import * as seed from '../data/seed';
import type { IndustryEvent, Person } from '../data/types';
import { listable, type HostFacts } from '../domain/events';
import { eventEndsAt } from '../domain/eventAttendance';
import { creditedOn, workedWith } from '../domain/home/graph';
import type { Candidate, Significance } from '../domain/home/types';

/*
 * Event selectors (docs/EVENTS.md). What anyone may see is decided by the rules in src/domain/events.ts;
 * a host additionally sees their own events while they are under review or after cancelling them.
 */
export function hostFacts(id: string): HostFacts | undefined {
  const p = seed.parties[id];
  if (!p) return undefined;
  if (p.kind === 'org') return { verified: !!(p as { verified?: boolean }).verified, kind: 'org' };
  return { verified: !!(p as Person).identityVerified, kind: 'person', minor: !!(p as Person & { minor?: boolean }).minor };
}

export const isHost = (e: IndustryEvent, viewerId: string, acting: string) => e.hostId === viewerId || e.hostId === acting;

/** Everything this person may see, soonest first. Hosts also see their own under review or cancelled. */
export function visibleEvents(events: IndustryEvent[], now: number, viewerId = '', acting = 'self'): IndustryEvent[] {
  return events
    .filter((e) => listable(e, hostFacts(e.hostId), now) || (isHost(e, viewerId, acting) && eventEndsAt(e) >= now))
    .sort((a, b) => a.start - b.start);
}

export const eventsOfProject = (events: IndustryEvent[], projectId: string, now: number, viewerId?: string, acting?: string) => visibleEvents(events, now, viewerId, acting).filter((e) => e.projectId === projectId);
export const eventsOfHost = (events: IndustryEvent[], hostId: string, now: number, viewerId?: string, acting?: string) => visibleEvents(events, now, viewerId, acting).filter((e) => e.hostId === hostId);
export const speakingAt = (events: IndustryEvent[], personId: string, now: number) => visibleEvents(events, now).filter((e) => e.speakerIds?.includes(personId) && e.hostId !== personId);

/** Why this event matters to you, in one line (or nothing). */
export function eventReason(e: IndustryEvent, me: Person, following: string[]): { reason?: string; significance: Significance; relationship: number } {
  if (e.projectId && creditedOn(e.projectId).includes(me.id)) return { reason: "You're credited on this film", significance: 'high', relationship: 1 };
  const known = workedWith(me.id);
  const people = [...(e.speakerIds ?? []), e.hostId].filter((id) => id !== me.id && (known.has(id) || following.includes(id)));
  if (people.length) {
    const first = seed.parties[people[0]]?.name.split(' ')[0];
    return { reason: people.length === 1 ? `${first} is ${e.speakerIds?.includes(people[0]) ? 'speaking' : 'hosting'}` : `${first} and ${people.length - 1} more you know are part of it`, significance: 'medium', relationship: known.has(people[0]) ? 0.7 : 0.5 };
  }
  if (e.city === me.city) return { reason: `In ${me.city}`, significance: 'medium', relationship: 0 };
  return { significance: 'low', relationship: 0 };
}

/** Home candidates: upcoming events in the next 14 days, cap 1 (the composer enforces it). */
export function eventHomeCandidates(events: IndustryEvent[], me: Person, following: string[], now: number): Candidate[] {
  return visibleEvents(events, now)
    .filter((e) => e.start - now <= 14 * 864e5 && e.status === 'scheduled')
    .map((e) => {
      const r = eventReason(e, me, following);
      return {
        id: `event:${e.id}`,
        type: 'event' as const,
        objectId: e.id,
        version: `${e.start}-${e.venue}`,
        significance: r.significance,
        relationship: r.relationship,
        professional: 0.3,
        place: e.city === me.city ? 1 : 0,
        at: now,
        quality: 0.8,
        reason: r.reason,
        // A screening of your own film can be the lead; it uses the project's artwork.
        leadable: r.significance === 'high' && !!e.projectId,
        data: { eventId: e.id, projectId: e.projectId },
      };
    });
}
