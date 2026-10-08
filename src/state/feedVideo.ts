import { useSyncExternalStore } from 'react';

/*
 * Feed video, shared across every post (Instagram-style, docs/ux-refinement/PLAN.md D2): one sound setting for the
 * whole feed (muted until someone turns sound on), and only one video playing at a time.
 */
let muted = true;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
export const useFeedMuted = () =>
  useSyncExternalStore(
    (l) => (listeners.add(l), () => void listeners.delete(l)),
    () => muted,
    () => true,
  );
export const setFeedMuted = (m: boolean) => {
  muted = m;
  emit();
};

let playing: HTMLVideoElement | null = null;
/** Call when a feed video starts; the one before it pauses. */
export function claimPlayback(v: HTMLVideoElement) {
  if (playing && playing !== v) playing.pause();
  playing = v;
}

/** Autoplay only when it's welcome: not with Reduced Motion, not when the device asks to save data. */
export function autoplayAllowed() {
  if (typeof window === 'undefined') return false;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const save = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return !reduce && !save;
}
