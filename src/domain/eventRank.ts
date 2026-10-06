import type { Craft, IndustryEvent } from '../data/types';
import { relatedCrafts } from '../data/crafts';

/*
 * Which events Home shows (docs/REVIEW_EVENTS_PROFILE.md §2). Relevance to the person, never organiser size or
 * payment. The Events destination lists every eligible event by date; Home is a short personal preview.
 *
 * Input events must already pass the listing rules (visibleEvents). This adds the Home pool rules, the score,
 * the diversity rules and the fair tie-break. Pure: the caller supplies who the person is and what they've seen.
 */

export interface RankContext {
  now: number;
  city: string;
  craft: Craft;
  crafts?: Craft[];
  openToTravel?: boolean;
  /** Films the person is credited on. */
  creditedFilms: string[];
  /** People they worked with or follow. */
  network: string[];
  /** Production houses they follow. */
  followedHouses: string[];
  /** Events they already marked Interested. */
  interested: string[];
  blocked: string[];
  /** How many times each event was this person's large event, and whether they ever opened it. */
  seen: Record<string, { shown: number; opened?: boolean }>;
}

const DAY = 864e5;
export const HOME_EVENTS = 3;
export const WINDOW_DAYS = 21;

export function eventScore(e: IndustryEvent, c: RankContext): number {
  let s = 0;
  if (e.projectId && c.creditedFilms.includes(e.projectId)) s += 5;
  s += e.venue === 'Online' ? 1.5 : e.city === c.city ? 3 : c.openToTravel ? 1 : 0;
  const mine = [c.craft, ...(c.crafts ?? [])];
  const aud = e.audience ?? 'everyone';
  if (aud === 'everyone') s += 1;
  else if (aud.some((x) => mine.includes(x))) s += 3;
  else if (aud.some((x) => mine.some((m) => relatedCrafts(m).includes(x)))) s += 1.5;
  if ([e.hostId, ...(e.speakerIds ?? [])].some((id) => c.network.includes(id))) s += 2;
  if (c.followedHouses.includes(e.hostId)) s += 1.5;
  const days = (e.start - c.now) / DAY;
  s += days <= 7 ? 2 : days <= 14 ? 1 : 0.5;
  if (e.publishedAt && c.now - e.publishedAt <= 3 * DAY) s += 1;
  s += Math.min(1, Math.log10(1 + (e.interestedCount ?? 0)) / 2);
  if (e.editorial) s += 1.5;
  return Math.round(s * 100) / 100;
}

/** The pool: soon, scheduled, not blocked, not already Interested, not ignored three times as the large event. */
export function homePool(events: IndustryEvent[], c: RankContext) {
  return events.filter(
    (e) =>
      e.status === 'scheduled' &&
      (e.end ?? e.start) >= c.now &&
      e.start - c.now <= WINDOW_DAYS * DAY &&
      !c.blocked.includes(e.hostId) &&
      !c.interested.includes(e.id) &&
      !((c.seen[e.id]?.shown ?? 0) >= 3 && !c.seen[e.id]?.opened),
  );
}

/** Up to three events: best first, one per organiser, at most two of a type, near-ties go to the least seen. */
export function rankHomeEvents(events: IndustryEvent[], c: RankContext): IndustryEvent[] {
  const scored = homePool(events, c).map((e) => ({ e, s: eventScore(e, c), seen: c.seen[e.id]?.shown ?? 0 }));
  const own = (e: IndustryEvent) => Number(!!e.projectId && c.creditedFilms.includes(e.projectId));
  // A screening of your own film always leads; everything else by score, then soonest.
  scored.sort((a, b) => own(b.e) - own(a.e) || b.s - a.s || a.e.start - b.e.start);
  // Fair tie-break: within 10% of the higher score, the one this person has seen less goes first.
  for (let i = 0; i < scored.length - 1; i++) {
    const a = scored[i];
    const b = scored[i + 1];
    if (own(a.e) === own(b.e) && a.s > 0 && (a.s - b.s) / a.s <= 0.1 && b.seen < a.seen) [scored[i], scored[i + 1]] = [b, a];
  }
  const out: IndustryEvent[] = [];
  for (const { e } of scored) {
    if (out.length === HOME_EVENTS) break;
    if (out.some((x) => x.hostId === e.hostId)) continue;
    if (out.filter((x) => x.type === e.type).length >= 2) continue;
    out.push(e);
  }
  return out;
}

/** The section title follows its content. */
export const eventsTitle = (list: IndustryEvent[], city: string) => (list[0] && list[0].city === city && list[0].venue !== 'Online' ? 'Events near you' : 'Events coming up');
