import { useSyncExternalStore } from 'react';
import { TEST_MODE } from '../research-data/surface';

/*
 * Product defaults and explicit internal comparison overrides:
 *  - home: 'district' is the product default for normal launches and research sessions.
 *    'current' is Legacy Home; 'next' is an archived experiment. Both require an explicit URL override.
 *  - events: on by default (docs/EVENTS.md). ?events=off hides them on this device.
 * Home choices never persist across normal launches. Events remain a device preference.
 * /test uses District and Events unless a researcher explicitly pins a Home arm in its URL.
 */
export type HomeVariant = 'current' | 'next' | 'district';
export type Features = { home: HomeVariant; events: boolean };
export const DEFAULT_HOME: HomeVariant = 'district';

// v2: Events became the default; a new key so an old stored "off" (written before anyone chose it) is not kept.
const KEY = 'aa-features-v3';
const OLD_KEY = 'aa-features-v2';
export function parseFeatures(query: URLSearchParams, stored: Partial<Features> | null): Features {
  // Home choices are URL-scoped debug overrides, never a device preference.
  const base: Features = { home: DEFAULT_HOME, events: stored?.events !== false };
  if (query.has('next')) return { home: 'next', events: true };
  const h = query.get('home');
  const e = query.get('events');
  return { home: h === 'legacy' ? 'current' : h === 'next' || h === 'current' || h === 'district' ? h : base.home, events: e === 'on' ? true : e === 'off' ? false : base.events };
}

let features: Features = { home: 'district', events: true };
if (typeof window !== 'undefined') {
  let stored: Partial<Features> | null = null;
  try {
    stored = JSON.parse(localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY) ?? 'null') as Partial<Features> | null;
  } catch {
    /* storage blocked: defaults */
  }
  features = parseFeatures(new URLSearchParams(location.search), TEST_MODE ? null : stored);
  if (!TEST_MODE) {
    try { localStorage.setItem(KEY, JSON.stringify({ events: features.events })); } catch { /* optional device preference */ }
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

/** Historical study identifiers, retained for old research records. No automatic arm assignment. */
export const HOME_AB_STUDIES = ['aa-individual-short-v1'];

/**
 * Normal and resumed /test sessions use the product default; historical saved arms do not override it.
 * Explicit ?arm=current|next|district remains available for internal pilots.
 */
export function assignHomeArm(_studySlug: string, arm: string | null, _rand?: () => number): HomeVariant {
  return arm === 'next' || arm === 'current' || arm === 'district' ? arm : 'district';
}
