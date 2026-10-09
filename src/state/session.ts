/*
 * Prototype session persistence (docs/ux-refinement/PLAN.md, Auth and onboarding repair). A refresh keeps who you
 * are signed in as (and the house you act for), keeps you signed out if you signed out, and resumes an onboarding
 * in progress. Only on a real reload: a new link or visit starts fresh, as before. Research sessions (/test,
 * /research) and edge-case boots never read or write it, so the frozen research baseline is untouched.
 * sessionStorage only: it ends with the tab and never leaves the device.
 */
const KEY = 'aa_session';
const ENTRY_KEY = 'aa_entry';

export type SavedSession = { viewer: string; acting: string } | { signedOut: true };

const isReload = () => {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return nav?.type === 'reload';
  } catch {
    return false;
  }
};
const read = <T,>(key: string): T | null => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const write = (key: string, value: unknown) => {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the session simply isn't kept */
  }
};

/** What to restore at boot, if this load is a refresh. */
export const restoredSession = (enabled: boolean): SavedSession | null => (enabled && isReload() ? read<SavedSession>(KEY) : null);
export const saveSession = (s: SavedSession) => write(KEY, s);

/** An onboarding in progress (its step, history and everything typed so far). */
export const restoredEntry = <T,>(enabled: boolean): T | null => (enabled && isReload() ? read<T>(ENTRY_KEY) : null);
export const saveEntry = (snapshot: unknown) => write(ENTRY_KEY, snapshot);
export const clearEntry = () => write(ENTRY_KEY, null);
