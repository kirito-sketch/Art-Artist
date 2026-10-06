import { useSyncExternalStore } from 'react';
import { isThemedSurface } from '../themeCore';

/*
 * Cinematic atmosphere is the one background, behind Home in both versions. It belongs to the normal app
 * only: never on /test, /research or the internal pages.
 */
export const useAtmosphere = () => isThemedSurface();

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
