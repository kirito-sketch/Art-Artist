/*
 * Film reviews. Pure rules, no store: screens and the world seed both call these.
 *   Reviews open on the release date the house set, and only for released, shared films.
 *   Stars 0.5 to 5 in half steps; text optional, at most 280 characters; one review per person per film.
 *   People credited on a film and members of the houses that made it never review it.
 *   An average is shown only once a film has MIN_RATINGS ratings.
 *   Release weeks run Friday to Thursday, India time, because films release on Fridays.
 */
import { formatDate } from './dateFormat';

export interface Review {
  id: string;
  projectId: string;
  personId: string;
  /** 0.5 to 5 in half steps. */
  stars: number;
  text?: string;
  spoiler?: boolean;
  at: number;
  edited?: boolean;
  /** People who marked it helpful. */
  helpful: string[];
}

export const MIN_RATINGS = 5;
export const MAX_TEXT = 280;
const DAY = 864e5;
const IST = 5.5 * 36e5;

/** Midnight India time on a release date given as YYYY-MM-DD. */
export const releaseAt = (iso: string) => Date.parse(`${iso}T00:00:00+05:30`);

/** YYYY-MM-DD for an instant, India time. */
export const isoDay = (t: number) => new Date(t + IST).toISOString().slice(0, 10);

/** Start of the release week that contains `now`: the most recent Friday, 00:00 India time. */
export function releaseWeekStart(now: number) {
  const d = new Date(now + IST);
  const back = (d.getUTCDay() - 5 + 7) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - back * DAY - IST;
}

/** The Friday after the current release week starts. */
export const nextFriday = (now: number) => releaseWeekStart(now) + 7 * DAY;

export interface Reviewable {
  stage: string;
  releaseDate?: string;
}

export const reviewsOpen = (w: Reviewable, now: number) => w.stage === 'Released' && !!w.releaseDate && releaseAt(w.releaseDate) <= now;

/** Has a release date still to come: the page says when reviews open. */
export const opensLater = (w: Reviewable, now: number) => !!w.releaseDate && releaseAt(w.releaseDate) > now;

export const isOutThisWeek = (w: Reviewable, now: number) => reviewsOpen(w, now) && releaseAt(w.releaseDate!) >= releaseWeekStart(now);

/** "Fri, 9 Oct" */
export const releaseLabel = (iso: string) => formatDate(releaseAt(iso), 'en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

export const validStars = (s: number) => s >= 0.5 && s <= 5 && Number.isInteger(s * 2);

/**
 * Who may review: a person acting as themselves, not credited on the film (in any state), and not a member of
 * a house that made it.
 */
export function canReview(p: { viewerId: string; acting: string; memberships: string[]; creditedIds: string[]; houseIds: string[] }) {
  if (p.acting !== 'self') return false;
  if (p.creditedIds.includes(p.viewerId)) return false;
  return !p.houseIds.some((h) => p.memberships.includes(h));
}

export function stats(list: Review[]) {
  const count = list.length;
  const dist = [5, 4, 3, 2, 1].map((n) => list.filter((r) => Math.ceil(r.stars) === n).length);
  const avg = count ? Math.round((list.reduce((a, r) => a + r.stars, 0) / count) * 10) / 10 : 0;
  return { count, avg, dist, enough: count >= MIN_RATINGS };
}

/** Text that is safe to show to someone who hasn't seen the film. */
const quotable = (r: Review) => !!r.text?.trim() && !r.spoiler;

/** The one review a film is introduced with: the most helpful quotable one, else the longest well-rated recent one. */
export function featured(list: Review[]) {
  const q = list.filter(quotable);
  if (!q.length) return undefined;
  const top = [...q].sort((a, b) => b.helpful.length - a.helpful.length || b.at - a.at)[0];
  if (top.helpful.length) return top;
  const good = q.filter((r) => r.stars >= 3.5);
  return [...(good.length ? good : q)].sort((a, b) => (b.text!.length - a.text!.length) || b.at - a.at)[0];
}

/** Reviews are sorted by what people can see: the rating, or the date. ('helpful' stays for older callers only.) */
export type ReviewSort = 'rating' | 'newest' | 'helpful';
export const sortReviews = (list: Review[], by: ReviewSort) =>
  [...list].sort((a, b) => (by === 'rating' ? b.stars - a.stars || b.at - a.at : by === 'helpful' ? b.helpful.length - a.helpful.length || b.at - a.at : b.at - a.at));

/** Films with enough ratings, best first. */
export function topRated<T extends { id: string }>(films: T[], reviewsOf: (id: string) => Review[]) {
  return films
    .map((f) => ({ f, s: stats(reviewsOf(f.id)) }))
    .filter((x) => x.s.enough)
    .sort((a, b) => b.s.avg - a.s.avg || b.s.count - a.s.count)
    .map((x) => x.f);
}

/** "4.5", "4" */
export const starsLabel = (s: number) => (Number.isInteger(s) ? String(s) : s.toFixed(1));
