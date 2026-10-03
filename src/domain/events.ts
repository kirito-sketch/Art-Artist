import type { EventType, IndustryEvent } from '../data/types';

/*
 * Event rules (docs/EVENTS.md). Pure functions, unit-tested, shared by listing and creation.
 * Stakeholder principles applied here:
 *  - no paid access to opportunities: auditions and casting are roles, never events, and a paid event can
 *    never promise a role;
 *  - children: events are for adults; nothing may target under-18 participants or name a child host;
 *  - only verified hosts (houses, or verified adult individuals) can list events.
 */
export const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: 'screening', label: 'Screening or premiere' },
  { id: 'workshop', label: 'Workshop or masterclass' },
  { id: 'meetup', label: 'Industry meetup' },
  { id: 'festival', label: 'Festival or market' },
];
export const typeLabel = (t: EventType) => EVENT_TYPES.find((x) => x.id === t)?.label ?? t;

const AUDITION = /\b(auditions?|casting calls?|open casting|screen tests?)\b/i;
const CHILDREN = /\b(kids?|children|child actors?|under[- ]?18|minors?|teen(s|agers)?|ages? \d{1,2} ?(to|-) ?1[0-7])\b/i;
const PROMISE = /\b(guarantee[ds]?|get|win|land|chance (at|of)|shot at) (a |an |your )?(role|part|break|casting|selection)\b|\bselected for\b|\bcast in\b/i;

export interface HostFacts {
  verified: boolean;
  kind: 'person' | 'org';
  minor?: boolean;
}

/** May this event be shown to anyone? */
export function listable(e: IndustryEvent, host: HostFacts | undefined, now: number): boolean {
  if (e.status !== 'scheduled') return false;
  if ((e.end ?? e.start) < now) return false;
  if (!host || !host.verified || host.minor) return false;
  const text = `${e.title} ${e.summary}`;
  if (AUDITION.test(text) && !e.reviewed) return false;
  if (CHILDREN.test(text)) return false;
  if (e.price.kind === 'paid' && PROMISE.test(text)) return false;
  return true;
}

export const priceLabel = (e: Pick<IndustryEvent, 'price'>) => (e.price.kind === 'free' ? 'Free' : e.price.amount);

export interface EventDraft {
  type?: EventType;
  title: string;
  summary: string;
  city: string;
  venue: string;
  start?: number;
  price?: IndustryEvent['price'];
  link?: string;
  projectId?: string;
}
export type DraftErrors = Partial<Record<'host' | 'type' | 'title' | 'summary' | 'city' | 'venue' | 'start' | 'price' | 'link', string>>;

export const AUDITION_MESSAGE = 'Auditions and casting are roles, not events. Open a role instead.';
export const CHILDREN_MESSAGE = 'Events on Art and Artist are for adults (18 and over). Work involving children goes through a role, where the guardian responds.';
export const PROMISE_MESSAGE = "Paid events can't promise roles, auditions or selection.";

/** Checks a draft before it can be published. Every message says what to do next. */
export function validateDraft(d: EventDraft, host: HostFacts | undefined, now: number): { ok: boolean; errors: DraftErrors; review: 'live' | 'under_review' } {
  const errors: DraftErrors = {};
  if (!host?.verified || host.minor) errors.host = 'Verify your identity to host events.';
  if (!d.type) errors.type = 'Choose what kind of event this is.';
  if (!d.title.trim()) errors.title = 'Give your event a title.';
  else if (d.title.trim().length > 80) errors.title = 'Keep the title under 80 characters.';
  const text = `${d.title} ${d.summary}`;
  if (AUDITION.test(text)) errors.title = AUDITION_MESSAGE;
  else if (CHILDREN.test(text)) errors.title = CHILDREN_MESSAGE;
  if (!d.summary.trim()) errors.summary = 'Say in a sentence or two what happens.';
  if (!d.city.trim()) errors.city = 'Add the city.';
  if (!d.venue.trim()) errors.venue = 'Add the venue.';
  if (!d.start) errors.start = 'Choose a date and time.';
  else if (d.start < now) errors.start = 'Choose a date and time in the future.';
  if (!d.price) errors.price = 'Say whether it is free or paid.';
  else if (d.price.kind === 'paid' && !d.price.amount.trim()) errors.price = 'Add the price, for example ₹500.';
  else if (d.price.kind === 'paid' && PROMISE.test(text)) errors.summary = PROMISE_MESSAGE;
  if (d.link && !/^https:\/\/[^\s]+\.[^\s]+/.test(d.link.trim())) errors.link = 'Use a full web address starting with https://';
  const review = d.price?.kind === 'paid' && host?.kind === 'person' ? 'under_review' : 'live';
  return { ok: Object.keys(errors).length === 0, errors, review };
}

/** "Sat 11 Oct · 6:30 pm" in Indian time. */
export function whenLabel(ms: number): string {
  const d = new Date(ms);
  const day = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).replace(/\s?(am|pm)/i, (x) => ` ${x.trim().toLowerCase()}`);
  return `${day} · ${time}`;
}
export function stubLabel(ms: number): { day: string; month: string } {
  const d = new Date(ms);
  return { day: d.toLocaleDateString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' }), month: d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }).toUpperCase() };
}
