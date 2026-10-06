/*
 * What Home's large event has been for this person on this device: how often it was shown and whether they
 * opened it (docs/REVIEW_EVENTS_PROFILE.md §2). Counted once per session per event, never while scrolling.
 * Browser storage may be unavailable; then nothing is remembered and Home still works.
 */
const KEY = (who: string) => `aa-ev-seen:${who}`;
type Seen = Record<string, { shown: number; opened?: boolean }>;
const counted = new Set<string>();

export function readSeen(who: string): Seen {
  try {
    return JSON.parse(localStorage.getItem(KEY(who)) ?? '{}') as Seen;
  } catch {
    return {};
  }
}

function write(who: string, s: Seen) {
  try {
    localStorage.setItem(KEY(who), JSON.stringify(s));
  } catch {
    /* storage blocked: nothing is remembered */
  }
}

/** The large event was shown. Once per session. */
export function markShown(who: string, id: string) {
  if (counted.has(`${who}:${id}`)) return;
  counted.add(`${who}:${id}`);
  const s = readSeen(who);
  s[id] = { ...s[id], shown: (s[id]?.shown ?? 0) + 1 };
  write(who, s);
}

export function markOpened(who: string, id: string) {
  const s = readSeen(who);
  s[id] = { shown: s[id]?.shown ?? 0, opened: true };
  write(who, s);
}
