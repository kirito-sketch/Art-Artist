import { useSyncExternalStore } from 'react';

/*
 * Settings toggles and choices (search visibility, notification types, who can message you...). Settings
 * is now several pages, so these live here rather than in one page's local state: a choice made on
 * Notifications is still there when you come back to it. In memory, like the rest of the prototype's
 * account data (Appearance is the one setting stored on the device: src/ui/theme.ts).
 */
type Value = boolean | string;
const values = new Map<string, Value>();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

export function usePref<T extends Value>(key: string, initial: T): [T, (v: T) => void] {
  const v = useSyncExternalStore(subscribe, () => (values.has(key) ? (values.get(key) as T) : initial), () => initial);
  const set = (next: T) => {
    values.set(key, next);
    listeners.forEach((l) => l());
  };
  return [v, set];
}
