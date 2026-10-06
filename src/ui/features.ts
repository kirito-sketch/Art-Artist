import { useSyncExternalStore } from 'react';
import { TEST_MODE } from '../research-data/surface';

/*
 * Product switches (docs/plans/2026-10-03-home-and-events.md):
 *  - home: 'district' is the product Home and Discover everywhere (tiles, shelves, Discover as chips; docs/DISTRICT.md).
 *    'current' is the Legacy Home, kept for comparison, regression and debugging; 'next' is an earlier experiment.
 *    The internal id stays 'current' so older /test sessions, which stored it, still load.
 *  - events: on by default (docs/EVENTS.md). ?events=off hides them on this device.
 * Home is never remembered: ?home=legacy (or current, next) applies to that page load only, so a visit through
 * Compare or a debug link can never decide what the next normal launch shows. Events are remembered.
 * On /test the Home comes from the participant's assigned arm and Events are always off, so the comparison
 * changes one thing only.
 */
export type HomeVariant = 'current' | 'next' | 'district';
export type Features = { home: HomeVariant; events: boolean };

export const DEFAULT_HOME: HomeVariant = 'district';

// v3 stores Events only. v2 also held a Home choice written by earlier debugging; it is read for Events and never for Home.
const KEY = 'aa-features-v3';
const OLD_KEY = 'aa-features-v2';
export function parseFeatures(query: URLSearchParams, stored: Partial<Features> | null): Features {
  const events = stored?.events !== false;
  if (query.has('next')) return { home: 'next', events: true };
  const h = query.get('home');
  const e = query.get('events');
  const home: HomeVariant = h === 'legacy' || h === 'current' ? 'current' : h === 'next' ? 'next' : h === 'district' ? 'district' : DEFAULT_HOME;
  return { home, events: e === 'on' ? true : e === 'off' ? false : events };
}

let features: Features = { home: DEFAULT_HOME, events: true };
if (typeof window !== 'undefined') {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY) ?? 'null') as Partial<Features> | null;
    features = parseFeatures(new URLSearchParams(location.search), TEST_MODE ? null : stored);
    if (TEST_MODE) features = { home: 'current', events: false };
    else localStorage.setItem(KEY, JSON.stringify({ events: features.events }));
  } catch {
    /* storage blocked: defaults */
  }
}
const subs = new Set<() => void>();
export function setFeatures(f: Partial<Features>, persist = !TEST_MODE) {
  features = { ...features, ...f };
  if (persist) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ events: features.events }));
    } catch {
      /* ignore */
    }
  }
  subs.forEach((s) => s());
}
export const getFeatures = () => features;
export const useFeatures = () => useSyncExternalStore((s) => (subs.add(s), () => subs.delete(s)), () => features, () => features);

/** Studies that compare the two Homes. Sessions of any other (older) study always see today's Home. */
export const HOME_AB_STUDIES = ['aa-individual-short-v1'];

/**
 * The Home a new /test session sees: 50/50 for a comparison study, today's Home otherwise. A researcher can
 * pin the arm for a pilot with /test?arm=next or ?arm=current. Events stay off on /test either way.
 */
export function assignHomeArm(studySlug: string, arm: string | null, rand: () => number = Math.random): HomeVariant {
  if (!HOME_AB_STUDIES.includes(studySlug)) return 'current';
  if (arm === 'next' || arm === 'current') return arm;
  return rand() < 0.5 ? 'next' : 'current';
}
