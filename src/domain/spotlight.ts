import type { Craft } from '../data/types';
import { familyMates } from '../data/taxonomy';

/*
 * The District Home Spotlight (docs/DISTRICT_FIXES.md): the few most relevant or time-sensitive things this
 * week, of mixed kinds. Never people. Pure: the caller turns roles, projects, posts, events and releases into
 * SpotItems, supplies who the person is, and caches the answer for the session.
 */

export type SpotType = 'role' | 'project' | 'post' | 'event' | 'release';

export interface SpotItem {
  /** Unique across kinds, e.g. "role:o3". */
  key: string;
  type: SpotType;
  /** The underlying record's id. */
  ref: string;
  title: string;
  /** Who it comes from: the house, the author, the host. One card per organiser. */
  organiser: string;
  city?: string;
  /** Crafts it is for (a role), by (a post's author) or about (an event's audience, a project's open roles). */
  crafts?: Craft[];
  languages?: string[];
  /** Days since it was posted, published or changed stage. */
  ageDays?: number;
  /** Days until it closes, starts or releases. */
  inDays?: number;
  /** People on it: author, host, credited crew. Used for the relationship signal. */
  people?: string[];
  /** How many others saved or marked it. Capped. */
  interest?: number;
  /** A project that changed stage in the last three days. */
  stageChanged?: boolean;
  /** A project with open roles. */
  crewing?: boolean;
  /** For the label: the role ("DoP"), the new stage ("Shooting"), the author ("Vikram Sen"), the day ("Sat"), the score. */
  need?: string;
  stage?: string;
  by?: string;
  day?: string;
  rating?: number;
  /** An event's kind (screening, festival, meetup...). */
  eventType?: string;
  /** The person is part of it: speaking at the event, credited on the film or project. */
  mine?: boolean;
}

export interface SpotContext {
  city: string;
  crafts: Craft[];
  languages: string[];
  /** People you worked with. */
  network: string[];
  following: string[];
  blocked: string[];
  /** One item the team pins nationally, never per craft. */
  pin?: string;
}

export const SPOT_MAX = 5;
const PER_TYPE = 2;

const fit = (it: SpotItem, c: SpotContext): 'direct' | 'related' | 'none' => {
  const cs = it.crafts ?? [];
  if (cs.some((x) => c.crafts.includes(x))) return 'direct';
  const related = c.crafts.flatMap(familyMates);
  return cs.some((x) => related.includes(x)) ? 'related' : 'none';
};
const knows = (it: SpotItem, c: SpotContext) => (it.people ?? []).concat(it.organiser).some((p) => c.network.includes(p) || c.following.includes(p));
const recent = (it: SpotItem, days: number) => it.ageDays !== undefined && it.ageDays <= days;
const soon = (it: SpotItem, days: number) => it.inDays !== undefined && it.inDays >= 0 && it.inDays <= days;

/** Only what is time-sensitive for this person can be in the Spotlight. */
export function eligible(it: SpotItem, c: SpotContext): boolean {
  if (c.blocked.includes(it.organiser) || (it.people ?? []).some((p) => c.blocked.includes(p))) return false;
  switch (it.type) {
    case 'role':
      return fit(it, c) !== 'none' && (soon(it, 7) || recent(it, 3));
    case 'project':
      return (!!it.stageChanged && recent(it, 3)) || (!!it.crewing && it.city === c.city);
    case 'post':
      return recent(it, 3) && knows(it, c);
    case 'event':
      return soon(it, 7);
    case 'release':
      return true;
  }
}

/*
 * "This week" (Spotlight Direction A, docs/HOME_SPOTLIGHT.md): only notable, time-bound things that have no other
 * place on Home. Ordinary roles and posts never qualify (For you and your network carry them); a role qualifies only
 * when it is exceptional: your craft, from someone you know, closing within three days.
 */
const NOTABLE_EVENTS = ['screening', 'festival'];
export function notable(it: SpotItem, c: SpotContext): boolean {
  if (c.blocked.includes(it.organiser) || (it.people ?? []).some((p) => c.blocked.includes(p))) return false;
  switch (it.type) {
    case 'event':
      return soon(it, 7) && (!!it.mine || NOTABLE_EVENTS.includes(it.eventType ?? '') || knows(it, c) || (it.interest ?? 0) >= 50);
    case 'project':
      return (!!it.stageChanged && recent(it, 3)) || (!!it.crewing && it.city === c.city && knows(it, c));
    case 'release':
      return it.rating !== undefined;
    case 'role':
      return fit(it, c) === 'direct' && knows(it, c) && soon(it, 3);
    case 'post':
      return false;
  }
}

/** Urgency and freshness, 0 to 2: what makes it a "this week" thing. */
const timing = (it: SpotItem) => Math.max(it.inDays !== undefined && it.inDays >= 0 ? ((7 - Math.min(7, it.inDays)) / 7) * 2 : 0, it.ageDays !== undefined ? ((3 - Math.min(3, it.ageDays)) / 3) * 1.5 : 0);
const interest = (it: SpotItem) => Math.min(1, (it.interest ?? 0) / 50);

export function spotScore(it: SpotItem, c: SpotContext): number {
  let s = 0;
  if (knows(it, c)) s += 4;
  const f = fit(it, c);
  s += f === 'direct' ? 3 : f === 'related' ? 1.5 : 0;
  if (it.city && it.city === c.city) s += 2;
  if ((it.languages ?? []).some((l) => c.languages.includes(l))) s += 1;
  return s + timing(it) + interest(it);
}

/** The card everyone in the city sees: nothing about you in it, only place, timing and interest. */
const universalScore = (it: SpotItem) => timing(it) + interest(it) + (it.type === 'release' ? 0.5 : 0);
const universalPool = (items: SpotItem[], c: SpotContext) =>
  items.filter((it) => !c.blocked.includes(it.organiser) && ((it.type === 'event' && soon(it, 7) && it.city === c.city) || (it.type === 'project' && it.crewing && it.city === c.city) || it.type === 'release'));

const byScore = (score: (it: SpotItem) => number) => (a: SpotItem, b: SpotItem) => score(b) - score(a) || a.key.localeCompare(b.key);

export interface Spotlit extends SpotItem {
  /** Why a project is here for this person: crewing in their city, or a stage change. */
  because?: 'crewing' | 'stage';
  universal?: boolean;
  pinned?: boolean;
}

/**
 * At most five; at most two of a kind; one per organiser; at least two kinds in the first three; one card the same
 * for everyone in the city; an optional national pin first.
 */
export function pickSpotlight(items: SpotItem[], c: SpotContext, rules: 'spotlight' | 'week' = 'spotlight'): Spotlit[] {
  const ok = rules === 'week' ? notable : eligible;
  const out: Spotlit[] = [];
  const fits = (it: SpotItem) => out.length < SPOT_MAX && !out.some((x) => x.key === it.key || x.organiser === it.organiser) && out.filter((x) => x.type === it.type).length < PER_TYPE;
  const because = (it: SpotItem): Partial<Spotlit> => (it.type !== 'project' ? {} : { because: it.crewing && it.city === c.city ? 'crewing' : 'stage' });
  const add = (it: SpotItem | undefined, extra: Partial<Spotlit> = {}) => it && fits(it) && out.push({ ...it, ...because(it), ...extra });

  const pin = c.pin ? items.find((it) => it.key === c.pin && !c.blocked.includes(it.organiser)) : undefined;
  add(pin, { pinned: true });

  const personal = items.filter((it) => ok(it, c)).sort(byScore((it) => spotScore(it, c) + (rules === 'week' && it.mine ? 10 : 0)));
  const universal = universalPool(items, c).filter((it) => rules !== 'week' || notable(it, c)).sort(byScore(universalScore)).find(fits);
  const lead = personal.find((it) => fits(it) && (!universal || it.organiser !== universal.organiser || it.key === universal.key));
  add(lead, lead && lead.key === universal?.key ? { universal: true } : {});
  if (universal && !out.some((x) => x.key === universal.key)) add(universal, { universal: true });
  personal.forEach((it) => add(it));

  // Two kinds in the first three: if the top three share a kind, bring the next other kind up to third.
  if (out.length >= 3 && new Set(out.slice(0, 3).map((x) => x.type)).size < 2) {
    const k = out.findIndex((x, i) => i >= 3 && x.type !== out[0].type);
    if (k > 0) out.splice(2, 0, ...out.splice(k, 1));
  }
  return out;
}

const article = (s: string) => (/^[aeiou]/i.test(s) && !/^(u[nr]i|eu|one)/i.test(s) ? 'an' : 'a');

/** One label per card: what it is and why it is here, in a few words. */
/** Long role names shortened for a label. */
const SHORT: Record<string, string> = { 'Director of Photography': 'DoP', 'Assistant Director': 'AD', 'First Assistant Director': '1st AD', 'Production Designer': 'production designer' };
const short = (role: string) => SHORT[role] ?? (/^[A-Z][a-z]+( [a-z]+)*$/.test(role) ? role.toLowerCase() : role);

export function kicker(it: Spotlit): string {
  switch (it.type) {
    case 'role':
      // The role itself is the card's title; the label says why now.
      return it.inDays !== undefined && it.inDays <= 3 ? `Role · closes ${it.inDays <= 0 ? 'today' : it.inDays === 1 ? 'tomorrow' : `in ${it.inDays} days`}` : `New role${it.city ? ` · ${it.city}` : ''}`;
    case 'project':
      if (it.because === 'stage' && it.stage) return `Now ${it.stage.toLowerCase()}`;
      return it.crewing && it.need ? `Crew forming · needs ${article(short(it.need))} ${short(it.need)}` : 'Crew forming';
    case 'post':
      return `New work · ${it.by}`;
    case 'event':
      return `Event · ${[it.day, it.city].filter(Boolean).join(', ')}`;
    case 'release':
      return it.rating ? `Out this week · ★ ${it.rating.toFixed(1)}` : 'Out this week';
  }
}

/** "2d", "5h", "1w", "Yesterday 18:40" → days, for seed data written as relative times. */
export function agoDays(s: string | undefined): number | undefined {
  if (!s) return undefined;
  if (/^yesterday/i.test(s)) return 1;
  const m = /^(\d+)\s*(m|h|d|w|mo)$/.exec(s.trim());
  if (!m) return undefined;
  const n = Number(m[1]);
  return { m: n / 1440, h: n / 24, d: n, w: n * 7, mo: n * 30 }[m[2] as 'm' | 'h' | 'd' | 'w' | 'mo'];
}
