/**
 * The haptics map (docs/MOTION_MICROINTERACTION_SYSTEM.md §9). One vocabulary for every moment that is felt.
 * On the web only Android Chrome vibrates; iOS Safari has no vibration API, so this is silent there. The
 * native app maps each name to the platform engine (UIImpactFeedbackGenerator / HapticFeedbackConstants),
 * listed beside each entry. Haptics confirm what the user did; they never announce what the app did.
 */
export const HAPTICS = {
  /** A toggle took: Save, Follow, Like. iOS impact light · Android CONFIRM-lite (KEYBOARD_TAP). */
  toggle: 8,
  /** A selection moved: tab, chip, segmented control. iOS selectionChanged · Android CLOCK_TICK. */
  select: 5,
  /** An object snapped to a new place: sheet dismissed past threshold, reorder drop. iOS impact medium · Android GESTURE_END. */
  snap: 12,
  /** A lasting, important thing happened: credit accepted, interest sent. iOS notification success · Android CONFIRM. */
  success: [10, 60, 18],
  /** Something was refused: failed send, blocked action. iOS notification error · Android REJECT. */
  error: [18, 50, 18, 50, 18],
  /** A long press lifted an object (reorder). iOS impact rigid · Android LONG_PRESS. */
  lift: 14,
} as const;

export type Haptic = keyof typeof HAPTICS;

let enabled = true;
/** Settings can turn haptics off; reduced motion does not (they are not motion). */
export const setHaptics = (on: boolean) => {
  enabled = on;
};

export function haptic(kind: Haptic) {
  if (!enabled) return;
  try {
    navigator.vibrate?.(HAPTICS[kind] as number | number[]);
  } catch {
    /* not supported, or blocked until the first user gesture */
  }
}
