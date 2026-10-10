/**
 * Art and Artist motion vocabulary (docs/MOTION_MICROINTERACTION_SYSTEM.md). One small family: four durations,
 * two eases, six springs. Springs over durations where the thing moved is physical (a card, a
 * sheet, a control) so interrupted gestures stay continuous; durations where it is a fade.
 */

/** Durations in seconds. Micro feedback, standard UI, card/editorial, signature (never longer). */
export const dur = { micro: 0.15, ui: 0.26, editorial: 0.42, signature: 0.65 } as const;

/** Ease-out for things arriving, standard for things changing in place. */
export const ease = { out: [0.22, 1, 0.36, 1], inOut: [0.65, 0, 0.35, 1] } as const;

export const spring = {
  /** Press and release of any control or card. */
  press: { type: 'spring', stiffness: 600, damping: 32, mass: 0.6 },
  /** Indicators and small state changes: tab mark, underline, Follow → Following. */
  snappy: { type: 'spring', stiffness: 520, damping: 38 },
  /** Sheets and the Create surface. */
  sheet: { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 },
  /** Screen pushes and shared elements (card → detail, tile → post). */
  push: { type: 'spring', stiffness: 360, damping: 40, mass: 1 },
  /** Settling objects: craft objects, the record seal. Slightly soft, never bouncy. */
  settle: { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 },
  gentle: { type: 'spring', stiffness: 220, damping: 28 },
  /** A mark confirming itself (Save fill, Like heart): one small overshoot, then still. */
  mark: { type: 'spring', stiffness: 620, damping: 22, mass: 0.7 },
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

/** Shared-element ids. One owner per id at a time (see the motion doc, "Shared elements"). */
export const shared = {
  post: (id: string) => `post-media-${id}`,
  role: (id: string) => `role-media-${id}`,
  work: (id: string) => `work-media-${id}`,
  create: 'create-surface',
} as const;
