import { useCallback, useSyncExternalStore } from 'react';
import { TEST_MODE } from '../research-data/surface';

/*
 * Explain once, then show state (docs/TEXT_LOAD.md). A rule the app explains (how interest works, where
 * credits come from) is shown in full the first time a person meets it, and as one line plus 'How it works'
 * after that. What each person has already learned is kept per account on this device, so it does not come
 * back after a relaunch. Dismissed next steps ('Later') are kept the same way.
 *
 * On /test every participant is new, so nothing is stored: each session starts with nothing learned.
 */
export type Lesson = 'interest' | 'credits' | `later:${string}`;

const KEY = 'aa-learned-v1';
type Learned = Record<string, string[]>;

let learned: Learned = {};
if (typeof window !== 'undefined' && !TEST_MODE) {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}') as unknown;
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) learned = stored as Learned;
  } catch {
    /* storage blocked: nothing learned yet */
  }
}

const subs = new Set<() => void>();

export const hasLearned = (account: string, lesson: Lesson) => learned[account]?.includes(lesson) ?? false;

export function markLearned(account: string, lesson: Lesson) {
  if (hasLearned(account, lesson)) return;
  learned = { ...learned, [account]: [...(learned[account] ?? []), lesson] };
  if (!TEST_MODE) {
    try {
      localStorage.setItem(KEY, JSON.stringify(learned));
    } catch {
      /* ignore */
    }
  }
  subs.forEach((s) => s());
}

/** For tests and the prototype's 'start over'. */
export function resetLearned() {
  learned = {};
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  subs.forEach((s) => s());
}

export function useLearned(account: string, lesson: Lesson): [boolean, () => void] {
  const known = useSyncExternalStore(
    (s) => (subs.add(s), () => subs.delete(s)),
    () => hasLearned(account, lesson),
    () => false,
  );
  const mark = useCallback(() => markLearned(account, lesson), [account, lesson]);
  return [known, mark];
}
