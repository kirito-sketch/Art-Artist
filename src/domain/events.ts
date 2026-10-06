import { eventEndsAt } from './eventAttendance';
import type { EventType, IndustryEvent } from '../data/types';

/*
 * Event rules (docs/EVENTS.md). Pure functions, unit-tested, shared by listing and creation.
 * Stakeholder principles applied here:
 *  - no paid access to opportunities: auditions and casting are roles, never events, and a paid event can
 *    never promise a role;
 *  - children: events are for adults; nothing may target under-18 participants or name a child host;
 *  - only verified hosts (houses, or verified adult individuals) can list events.
 */
/**
 * What events can do in V1 (docs/EVENTS.md). Free events only, published at once. Paid events (price, tickets,
 * eligibility, the review states and the internal review screen) are designed and kept for later behind this
 * switch; it stays off in the app, and nothing in the product turns it on.
 */
export interface EventCapabilities {
  paidEvents: boolean;
}
export const EVENT_CAPABILITIES: EventCapabilities = { paidEvents: false };

export const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: 'screening', label: 'Screening or premiere' },
  { id: 'workshop', label: 'Workshop or masterclass' },
  { id: 'meetup', label: 'Meetup or networking' },
  { id: 'festival', label: 'Festival or market' },
  { id: 'talk', label: 'Panel or talk' },
  { id: 'exhibition', label: 'Exhibition' },
  { id: 'other', label: 'Other' },
];
export const typeLabel = (t: EventType) => EVENT_TYPES.find((x) => x.id === t)?.label ?? t;

const AUDITION = /\b(auditions?|casting calls?|open casting|screen tests?)\b/i;
const CHILDREN = /\b(kids?|children|child actors?|under[- ]?18|minors?|teen(s|agers)?|ages? \d{1,2} ?(to|-) ?1[0-7])\b/i;
const PROMISE =
  /\b(guarantee[ds]?|get|win|land|chance (at|of)|shot at) (a |an |your )?(role|part|break|casting|selection)\b|\bselected for\b|\bcast in\b/i;

export interface HostFacts {
  verified: boolean;
  kind: 'person' | 'org';
  minor?: boolean;
}

/** May this event be shown to anyone? */
export function listable(
  e: IndustryEvent,
  host: HostFacts | undefined,
  now: number,
  caps: EventCapabilities = EVENT_CAPABILITIES,
): boolean {
  if (e.status !== 'scheduled' && e.status !== 'closed') return false;
  // V1: free events only. A paid record (future capability) is never shown while paid events are off.
  if (!caps.paidEvents && e.price.kind === 'paid') return false;
  if (eventEndsAt(e) < now) return false;
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
  /** Pricing type and amount. V1 only allows free; left out, a V1 draft is free. */
  price?: IndustryEvent['price'];
  /** Secondary information link. Attendance is handled inside Ana. */
  link?: string;
  projectId?: string;
  end?: number;
  capacity?: number;
  location?: 'physical' | 'online';
  joiningUrl?: string;
}
export type DraftErrors = Partial<
  Record<'host' | 'type' | 'title' | 'summary' | 'city' | 'venue' | 'start' | 'price' | 'link' | 'end' | 'capacity' | 'joiningUrl', string>
>;

export const AUDITION_MESSAGE = 'Auditions and casting are roles, not events. Open a role instead.';
export const CHILDREN_MESSAGE =
  'Events on Art and Artist are for adults (18 and over). Work involving children goes through a role, where the guardian responds.';
export const PROMISE_MESSAGE = "Paid events can't promise roles, auditions or selection.";

/**
 * Checks a draft before it can be published. Every message says what to do next. V1 publishes at once
 * ('live'); 'under_review' only exists for the future paid flow.
 */
export function validateDraft(
  raw: EventDraft,
  host: HostFacts | undefined,
  now: number,
  caps: EventCapabilities = EVENT_CAPABILITIES,
): { ok: boolean; errors: DraftErrors; review: 'live' | 'under_review' } {
  const errors: DraftErrors = {};
  const d: EventDraft = {
    ...raw,
    price: raw.price ?? (caps.paidEvents ? undefined : { kind: 'free' }),
  };
  if (!host?.verified || host.minor) errors.host = 'Verify your identity to host events.';
  if (!d.type || !EVENT_TYPES.some((t) => t.id === d.type)) errors.type = 'Choose what kind of event this is.';
  if (!d.title.trim()) errors.title = 'Give your event a title.';
  else if (d.title.trim().length > 80) errors.title = 'Keep the title under 80 characters.';
  const text = `${d.title} ${d.summary}`;
  if (AUDITION.test(text)) errors.title = AUDITION_MESSAGE;
  else if (CHILDREN.test(text)) errors.title = CHILDREN_MESSAGE;
  if (!d.summary.trim()) errors.summary = 'Say in a sentence or two what happens.';
  if (d.location !== 'online' && !d.city.trim()) errors.city = 'Add the city.';
  if (d.location !== 'online' && !d.venue.trim()) errors.venue = 'Add the venue.';
  if (!d.start || !Number.isFinite(d.start)) errors.start = 'Choose a date and time.';
  else if (d.start <= now) errors.start = 'Choose a date and time in the future.';
  if (!d.price) errors.price = 'Say whether it is free or paid.';
  else if (d.price.kind === 'paid' && !caps.paidEvents) errors.price = 'Paid events are coming later.';
  else if (d.price.kind === 'paid' && !d.price.amount.trim()) errors.price = 'Add the price, for example ₹500.';
  else if (d.price.kind === 'paid' && PROMISE.test(text)) errors.summary = PROMISE_MESSAGE;
  if (d.end !== undefined && (!Number.isFinite(d.end) || !d.start || d.end <= d.start)) errors.end = 'End time must be after the start.';
  if (d.capacity !== undefined && (!Number.isInteger(d.capacity) || d.capacity < 1))
    errors.capacity = 'Enter a whole number of places, at least 1.';
  if (d.joiningUrl && !/^https:\/\/[^\s]+\.[^\s]+/.test(d.joiningUrl.trim())) errors.joiningUrl = 'Use a full https:// meeting link.';
  if (d.link && !/^https:\/\/[^\s]+\.[^\s]+/.test(d.link.trim())) errors.link = 'Use a full web address starting with https://';
  // Future (paid events on): a paid event from an individual waits for review. V1: always live.
  const review = caps.paidEvents && d.price?.kind === 'paid' && host?.kind === 'person' ? 'under_review' : 'live';
  return { ok: Object.keys(errors).length === 0, errors, review };
}

/** "Sat 11 Oct · 6:30 pm" in Indian time. */
export function whenLabel(ms: number): string {
  const d = new Date(ms);
  const day = d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
  const time = d
    .toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
    })
    .replace(/\s?(am|pm)/i, (x) => ` ${x.trim().toLowerCase()}`);
  return `${day} · ${time}`;
}
export function stubLabel(ms: number): { day: string; month: string } {
  const d = new Date(ms);
  return {
    day: d.toLocaleDateString('en-IN', {
      day: 'numeric',
      timeZone: 'Asia/Kolkata',
    }),
    month: d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }).toUpperCase(),
  };
}
