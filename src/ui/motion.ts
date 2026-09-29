/** Shared motion vocabulary. Springs over durations so interrupted gestures stay continuous. */
export const spring = {
  press: { type: 'spring', stiffness: 600, damping: 32, mass: 0.6 },
  snappy: { type: 'spring', stiffness: 520, damping: 38 },
  sheet: { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 },
  push: { type: 'spring', stiffness: 360, damping: 40, mass: 1 },
  gentle: { type: 'spring', stiffness: 220, damping: 28 },
} as const;

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

/** Stagger children on first reveal of a section. */
export const stagger = (i: number, base = 0.04) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 + i * base, type: 'spring', stiffness: 260, damping: 30 },
});
