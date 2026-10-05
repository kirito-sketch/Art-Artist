import { useSyncExternalStore } from 'react';
import { TEST_MODE } from '../research-data/surface';

/*
 * Product switches for work that is built but not yet the default (docs/plans/2026-10-03-home-and-events.md):
 *  - home: 'current' (today's Home, the default) or 'next' (fixed frame + composed middle, docs/HOME.md);
 *  - events: on by default (docs/EVENTS.md). ?events=off hides them on this device.
 * Set with ?home=next, ?events=on|off, or ?next (both). Stored on this device. On /test the Home comes from the
 * participant's assigned arm and Events are always off, so the comparison changes one thing only.
 */
export type HomeVariant = 'current' | 'next';
export type Features = { home: HomeVariant; events: boolean };

// v2: Events became the default; a new key so an old stored "off" (written before anyone chose it) is not kept.
const KEY = 'aa-features-v2';
export function parseFeatures(query: URLSearchParams, stored: Partial<Features> | null): Features {
  const base: Features = { home: stored?.home === 'next' ? 'next' : 'current', events: stored?.events !== false };
  if (query.has('next')) return { home: 'next', events: true };
  const h = query.get('home');
  const e = query.get('events');
  return { home: h === 'next' || h === 'current' ? h : base.home, events: e === 'on' ? true : e === 'off' ? false : base.events };
}

let features: Features = { home: 'current', events: true };
if (typeof window !== 'undefined') {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<Features> | null;
    features = parseFeatures(new URLSearchParams(location.search), TEST_MODE ? null : stored);
    if (TEST_MODE) features = { home: 'current', events: false };
    else localStorage.setItem(KEY, JSON.stringify(features));
  } catch {
    /* storage blocked: defaults */
  }
}
const subs = new Set<() => void>();
export function setFeatures(f: Partial<Features>, persist = !TEST_MODE) {
  features = { ...features, ...f };
  if (persist) {
    try {
      localStorage.setItem(KEY, JSON.stringify(features));
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
