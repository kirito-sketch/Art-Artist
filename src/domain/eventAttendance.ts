import type { IndustryEvent } from '../data/types';

export type AttendanceStatus = 'pending' | 'confirmed' | 'withdrawn' | 'not-accommodated';
export interface EventRequest {
  id: string;
  eventId: string;
  personId: string;
  /** Private event contact; never a public profile field. */
  email: string;
  note?: string;
  status: AttendanceStatus;
  requestedAt: number;
}
export interface EventActor {
  viewerId: string;
  acting: string;
  memberships: string[];
}
export const canManageEvent = (e: IndustryEvent, a: EventActor) =>
  a.acting === 'self' ? e.hostId === a.viewerId : e.hostId === a.acting && a.memberships.includes(a.acting);
export const confirmedCount = (e: IndustryEvent, rs: EventRequest[]) =>
  rs.filter((r) => r.eventId === e.id && r.status === 'confirmed').length;
export function eventEndsAt(e: IndustryEvent) {
  if (e.end) return e.end;
  const day = new Date(e.start + 5.5 * 36e5).toISOString().slice(0, 10);
  return new Date(`${day}T23:59:59.999+05:30`).getTime();
}
export function eventState(e: IndustryEvent, rs: EventRequest[], now: number): string {
  if (e.status === 'cancelled') return 'Cancelled';
  if (e.status === 'draft' || e.status === 'under_review') return 'Draft';
  if (eventEndsAt(e) < now) return 'Ended';
  if (e.status === 'closed') return 'Closed';
  if (e.capacity !== undefined && confirmedCount(e, rs) >= e.capacity) return 'Full';
  const day = (ms: number) => new Date(ms + 5.5 * 36e5).toISOString().slice(0, 10);
  return day(now) === day(e.start) ? 'Today' : 'Upcoming';
}
export const requestsOpen = (e: IndustryEvent, rs: EventRequest[], now: number) =>
  e.status === 'scheduled' && e.price.kind === 'free' && now < e.start && (e.capacity === undefined || confirmedCount(e, rs) < e.capacity);
export function requestPlace(
  e: IndustryEvent,
  rs: EventRequest[],
  personId: string,
  email: string,
  note: string,
  now: number,
): string | EventRequest {
  if (!requestsOpen(e, rs, now)) return 'This event is not accepting requests.';
  const old = rs.find((r) => r.eventId === e.id && r.personId === personId);
  if (old && old.status !== 'withdrawn') return 'You have already requested a place.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254) return 'Enter a valid email address.';
  if (note.trim().length > 300) return 'Keep your note within 300 characters.';
  if (old) {
    Object.assign(old, {
      email: email.trim(),
      note: note.trim() || undefined,
      status: 'pending',
      requestedAt: now,
    });
    return old;
  }
  const request: EventRequest = {
    id: `er-${personId}-${e.id}`,
    eventId: e.id,
    personId,
    email: email.trim(),
    note: note.trim() || undefined,
    status: 'pending',
    requestedAt: now,
  };
  rs.push(request);
  return request;
}
export function acceptRequest(
  e: IndustryEvent,
  rs: EventRequest[],
  requestId: string,
  actor: EventActor,
  now: number,
): string | EventRequest {
  if (!canManageEvent(e, actor)) return 'Only the organiser can accept requests.';
  if (!requestsOpen(e, rs, now)) return 'This event is not accepting places.';
  const request = rs.find((r) => r.id === requestId && r.eventId === e.id);
  if (!request || request.status !== 'pending') return 'This request is no longer pending.';
  request.status = 'confirmed';
  return request;
}
export function withdrawRequest(e: IndustryEvent, rs: EventRequest[], personId: string, now: number): boolean {
  const request = rs.find((r) => r.eventId === e.id && r.personId === personId);
  if (!request || !['pending', 'confirmed'].includes(request.status) || e.start <= now) return false;
  request.status = 'withdrawn';
  return true;
}
/** Full preserves pending people for a possible vacant place. Close/start resolves them once. */
export function resolvePending(e: IndustryEvent, rs: EventRequest[], now: number): EventRequest[] {
  if (e.status !== 'closed' && e.start > now) return [];
  if (e.status === 'cancelled') return [];
  const pending = rs.filter((r) => r.eventId === e.id && r.status === 'pending');
  pending.forEach((r) => {
    r.status = 'not-accommodated';
  });
  return pending;
}
export const requestsForOrganiser = (e: IndustryEvent, rs: EventRequest[], a: EventActor) =>
  canManageEvent(e, a) ? rs.filter((r) => r.eventId === e.id && r.status !== 'withdrawn') : [];

/** Public event selectors never reveal joining details before a personal place is confirmed. */
export function eventForActor(e: IndustryEvent, rs: EventRequest[], actor: EventActor): IndustryEvent {
  if (
    canManageEvent(e, actor) ||
    (rs.some((r) => r.eventId === e.id && r.personId === actor.viewerId && r.status === 'confirmed') && e.status !== 'cancelled')
  )
    return { ...e };
  const { joiningUrl: _privateJoiningUrl, ...publicEvent } = e;
  return publicEvent;
}
