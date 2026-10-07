import * as seed from '../data/seed';
import type { Media, Person } from '../data/types';
import { craftProfile, FIELDS, setsFor, skillCategoriesFor, type Experience, type Visibility } from '../data/profileSchema';
import { world } from './world';
import { TEST_MODE } from '../research-data/surface';
import type { VideoSource } from '../domain/showreel';
import type { Intent } from '../domain/relevance';

/*
 * The richer half of a person's profile (docs/REVIEW_EVENTS_PROFILE.md). One record per person, written by
 * onboarding, completion prompts and Edit Profile alike: there is no separate onboarding copy. `Person` keeps
 * the identity fields every screen already reads (name, craft, city, languages, photo...).
 */

export interface Reel {
  id?: string;
  source?: VideoSource;
  /** Legacy external URL or a device-only draft URL. Native ready assets require the production pipeline. */
  url: string;
  title: string;
  cover?: Media;
  duration?: string;
}

export type FeaturedWork = { id: string; kind: 'project'; projectId: string } | { id: string; kind: 'external'; title: string; url: string };
export type ProfileCover = ({ kind: 'auto' } | { kind: 'portrait' } | { kind: 'portfolio'; mediaId: string } | { kind: 'project'; projectId: string } | { kind: 'showreel' }) & { focal?: { x: number; y: number }; framing?: 'safe' | 'immersive'; identityRegion?: 'lower' | 'centre-lower' | 'glass' };

export interface WorkLink {
  id: string;
  label: string;
  url: string;
}

export interface ProfileSkill {
  id: string;
  level?: string;
  cert?: string;
}

export type DetailValue = string | string[] | number | [number, number];

export interface ProfileExtra {
  /** Private onboarding goals, kept as IDs for future Home and Discover personalisation. */
  onboardingIntents?: Intent[];
  /** For identity and matching only. Never shown, never shared automatically. */
  phone?: { number: string; verified: boolean };
  skills: ProfileSkill[];
  /** Skills the person added that aren't in the list yet: on their profile, not a filter until approved. */
  suggestedSkills: string[];
  details: Record<string, DetailValue>;
  /** Per field, when the person chose something other than the field's default. */
  visibility: Record<string, Visibility>;
  workTypes: string[];
  experience?: Experience;
  /** IMDb, Instagram, a website. */
  links: WorkLink[];
  /** The work section: one reel (first on the profile), then portfolio images (seed.portfolio, in order), then these. */
  reel?: Reel;
  /** Private device preview, never published or sent to research storage. */
  reelDraft?: Reel;
  featuredWork?: FeaturedWork[];
  /** Reference to professional work; never grants access or creates a credit. */
  profileCover?: ProfileCover;
  workLinks: WorkLink[];
}

const empty = (): ProfileExtra => ({ skills: [], suggestedSkills: [], details: {}, visibility: {}, workTypes: [], links: [], workLinks: [] });

const media = (id: string, src: string, fallback: string): Media => ({ id, kind: 'image', src: `images/${src}.jpg`, fallback: `images/${fallback}.jpg` });

export const profiles: Record<string, ProfileExtra> = {
  kiran: {
    ...empty(),
    phone: { number: '9876543210', verified: true },
    skills: [{ id: 'gimbal' }, { id: 'drone', cert: 'DGCA remote pilot' }, { id: 'steadicam' }],
    details: { cameras: ['ARRI Alexa Mini LF', 'Sony Venice 2', 'RED V-Raptor'], formats: ['Anamorphic', 'Large format'], dopSpecial: ['Night exteriors', 'Available light', 'Handheld'], ownsKit: 'Some' },
    workTypes: ['Feature', 'Series', 'Ad film'],
    experience: '10+',
    links: [{ id: 'l1', label: 'IMDb', url: 'https://www.imdb.com/' }],
    reel: { url: 'https://vimeo.com/', title: 'Showreel 2026', cover: media('reel-kiran', 'stills/reel-kiran', 'covers/neela'), duration: '2:41' },
    workLinks: [{ id: 'w1', label: 'Kaaval · camera tests', url: 'https://vimeo.com/' }],
  },
  tara: {
    ...empty(),
    skills: [{ id: 'kathak', level: 'Trained' }, { id: 'swimming', level: 'Confident' }, { id: 'two-wheeler', level: 'Confident' }, { id: 'stage-combat', level: 'Basic' }],
    details: { playingAge: [24, 32], height: 165, build: 'Slim', hair: 'Black', eyes: 'Dark brown', accents: ['Bambaiya', 'Malabar'] },
    workTypes: ['Series', 'Feature', 'Theatre'],
    experience: '2-5',
    reel: { url: 'https://vimeo.com/', title: 'Acting reel', cover: media('reel-tara', 'stills/reel-tara', 'covers/paper-boats'), duration: '1:52' },
    workLinks: [],
  },
};

export const profileOf = (id: string): ProfileExtra => (profiles[id] ??= empty());

/* Reels used to sit in the portfolio as video items; they are now the profile's reel. */
Object.keys(seed.portfolio).forEach((id) => {
  seed.portfolio[id] = seed.portfolio[id].filter((m) => m.kind !== 'video');
});

/* ------------------------------------------------------------ visibility */

export const visibilityOf = (x: ProfileExtra, fieldId: string): Visibility => x.visibility[fieldId] ?? FIELDS[fieldId]?.visibility ?? 'public';

/** Who is looking: the person themself, someone acting for a verified production house, or anyone else. */
export type Viewer = 'self' | 'production' | 'member';
export const canSee = (v: Visibility, who: Viewer) => who === 'self' || v === 'public' || (v === 'productions' && who === 'production');

/* ------------------------------------------------------------ phone */

export const normalisePhone = (s: string) => s.replace(/\D/g, '').slice(-10);
export const validPhone = (s: string) => normalisePhone(s).length === 10;
export const maskedPhone = (s: string) => {
  const n = normalisePhone(s);
  return n.length === 10 ? `+91 ${n.slice(0, 2)}••• ••${n.slice(7)}` : s;
};

/**
 * Project records a production created against this number, still waiting for their person
 * (docs/CONSOLIDATION.md §7). Only offered once the number is verified, and only ever confirmed by the person.
 */
export function pendingForPhone(number: string) {
  const n = normalisePhone(number);
  return world.associations.filter((a) => a.pending && !a.personId && !a.pending.notMe && a.status !== 'removed' && normalisePhone(a.pending.phone) === n);
}

/** Verified elsewhere already? One number belongs to one person (EC-AUTH-015). */
export const phoneTaken = (number: string, personId: string) => Object.entries(profiles).some(([id, x]) => id !== personId && x.phone?.verified && normalisePhone(x.phone.number) === normalisePhone(number));

/* ------------------------------------------------------------ completion */

export type Step = 'phone' | 'photo' | 'work' | 'languages' | 'availability' | 'details' | 'skills';

export interface CompletionFacts {
  person: Person;
  extra: ProfileExtra;
  images: number;
  availabilityOpen: boolean;
  wantsWork: boolean;
}

const filled = (v: DetailValue | undefined) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);

/** What's still open, in the approved order. Sensitive physical fields never count as missing. */
export function openSteps(f: CompletionFacts): Step[] {
  const crafts = [f.person.craft, ...(f.person.crafts ?? [])];
  const sets = setsFor(crafts);
  const work = craftProfile(f.person.craft).work;
  const steps: Step[] = [];
  if (!f.extra.phone?.verified) steps.push('phone');
  if (!f.person.photo) steps.push('photo');
  if (!f.extra.reel && f.images === 0 && (f.extra.featuredWork?.length ?? f.extra.workLinks.length) === 0 && (work.reel || work.images || work.links)) steps.push('work');
  if (!(f.person.languages ?? []).length) steps.push('languages');
  if (f.wantsWork && !f.availabilityOpen) steps.push('availability');
  if (sets.length && !sets.some((s) => s.fields.some((fd) => !fd.sensitive && filled(f.extra.details[fd.id])))) steps.push('details');
  if (skillCategoriesFor(crafts).length && f.extra.skills.length + f.extra.suggestedSkills.length === 0) steps.push('skills');
  return steps;
}

/** Prompt pacing: one at a time, once per session; Later snoozes for 14 days; three Laters in a row, 30 days quiet. */
export interface Pacing {
  snoozed: Partial<Record<Step, number>>;
  laterStreak: number;
  quietUntil: number;
}
const DAY = 864e5;
export const emptyPacing = (): Pacing => ({ snoozed: {}, laterStreak: 0, quietUntil: 0 });

export function nextPrompt(steps: Step[], p: Pacing, now: number): Step | undefined {
  if (now < p.quietUntil) return undefined;
  return steps.find((s) => (p.snoozed[s] ?? 0) <= now);
}

export function later(p: Pacing, step: Step, now: number): Pacing {
  const streak = p.laterStreak + 1;
  return { snoozed: { ...p.snoozed, [step]: now + 14 * DAY }, laterStreak: streak >= 3 ? 0 : streak, quietUntil: streak >= 3 ? now + 30 * DAY : p.quietUntil };
}

/** Doing a step resets the streak: the person is engaging, not dismissing. */
export const engaged = (p: Pacing): Pacing => ({ ...p, laterStreak: 0 });

const PACE_KEY = (who: string) => `aa-pacing:${who}`;
// On /test every participant is new, so nothing is stored (as with learned lessons).
const memPacing: Record<string, Pacing> = {};
export function readPacing(who: string): Pacing {
  if (TEST_MODE) return memPacing[who] ?? emptyPacing();
  try {
    return { ...emptyPacing(), ...JSON.parse(localStorage.getItem(PACE_KEY(who)) ?? '{}') };
  } catch {
    return emptyPacing();
  }
}
export function writePacing(who: string, p: Pacing) {
  if (TEST_MODE) return void (memPacing[who] = p);
  try {
    localStorage.setItem(PACE_KEY(who), JSON.stringify(p));
  } catch {
    /* storage blocked: pacing lasts this session */
  }
}
