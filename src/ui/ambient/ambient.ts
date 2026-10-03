import { useSyncExternalStore } from 'react';
import { isThemedSurface } from '../themeCore';

/*
 * The living background experiment (docs/LIVING_BACKGROUND.md). Three directions, compared on Home only:
 *   a: Ambient light   b: Cinematic atmosphere   c: Depth field   d: Silk light
 * Off by default. Chosen in Settings › Appearance › Background (experiment), or with ?ambient=a|b|c|d|off,
 * and stored on this device. Never on /test, /research or the internal pages.
 */
export type AmbientVariant = 'off' | 'a' | 'b' | 'c' | 'd';
const VARIANTS: AmbientVariant[] = ['off', 'a', 'b', 'c', 'd'];
const KEY = 'aa-ambient';

const read = (): AmbientVariant => {
  try {
    const q = new URLSearchParams(location.search).get('ambient');
    if (q && VARIANTS.includes(q as AmbientVariant)) {
      localStorage.setItem(KEY, q);
      return q as AmbientVariant;
    }
    const v = localStorage.getItem(KEY);
    return VARIANTS.includes(v as AmbientVariant) ? (v as AmbientVariant) : 'off';
  } catch {
    return 'off';
  }
};

let variant: AmbientVariant = typeof window === 'undefined' ? 'off' : read();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

export function setAmbientVariant(v: AmbientVariant) {
  variant = v;
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* storage blocked: applies for this session */
  }
  listeners.forEach((l) => l());
}

/** The variant in use here: always 'off' outside the normal app. */
export const useAmbientVariant = () => useSyncExternalStore(subscribe, () => (isThemedSurface() ? variant : 'off'), () => 'off' as AmbientVariant);

/* ------------------------------------------------------------ device state */

/**
 * Low power. iOS does not tell a web page about Low Power Mode, so this uses what can be measured: the
 * Battery API where it exists (not Safari), Save-Data, and the frame rate the page actually gets (Low Power
 * Mode and weak or hot devices both throttle animation frames to about 30 a second). Below ~40 fps the
 * background stays, but holds still (the static version), so it never costs frames the content needs.
 */
let lowPower: boolean | null = null;
const lowListeners = new Set<() => void>();

function measure() {
  if (lowPower !== null || typeof window === 'undefined') return;
  lowPower = false;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return set(true);
  const battery = (navigator as unknown as { getBattery?: () => Promise<{ charging: boolean; level: number }> }).getBattery;
  battery?.call(navigator).then((b) => !b.charging && b.level <= 0.2 && set(true)).catch(() => undefined);
  // Sample the frame rate for a second, once the page has settled.
  window.setTimeout(() => {
    if (document.visibilityState !== 'visible') return;
    let frames = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      frames++;
      if (t - start < 1000) requestAnimationFrame(step);
      else if ((frames * 1000) / (t - start) < 40) set(true);
    };
    requestAnimationFrame(step);
  }, 2500);
}
function set(v: boolean) {
  lowPower = v;
  lowListeners.forEach((l) => l());
}
const subscribeLow = (l: () => void) => (measure(), lowListeners.add(l), () => lowListeners.delete(l));
export const useLowPower = () => useSyncExternalStore(subscribeLow, () => !!lowPower, () => false);
