/*
 * Home composer types (docs/HOME.md). The composer is pure: plain data in, plain data out, so every rule
 * of the agreed Home architecture is deterministic and unit-tested.
 *
 *   candidates -> eligible (significance, quality, window) -> rank -> compose (rules) -> session snapshot
 *
 * A new kind of Home content joins by adding one entry to SIZE and CAP and a candidate adapter. The page
 * layout does not change.
 */
export type MiddleType = 'people' | 'post' | 'projectUpdates' | 'opportunity' | 'house' | 'creditRelation' | 'event';
export type Size = 'large' | 'compact';
export type Significance = 'high' | 'medium' | 'low';

export interface Candidate {
  /** Stable identity: `${type}:${objectId}`. */
  id: string;
  type: MiddleType;
  objectId: string;
  /** Changes when something material changes (stage, crew, date), so the item may be shown again. */
  version: string;
  significance: Significance;
  /** 0..1 each. Ranking compares them in this order: relationship, significance, professional, place, freshness. */
  relationship: number;
  professional: number;
  place: number;
  /** Epoch ms of the change (freshness, and the seven-day window). */
  at: number;
  /** 0..1. Below QUALITY_BAR the candidate is never shown: no padding. */
  quality: number;
  /** One line, only when the item is not self-explanatory. */
  reason?: string;
  /** May this be the lead story? Projects and visual work only, never a role. */
  leadable: boolean;
  /** What the UI needs to draw it (ids). Opaque to the composer. */
  data?: Record<string, unknown>;
}

/** Meaningful professional news about you. One item, written as news, never a count. */
export interface PersonalNews {
  id: string;
  text: string;
  actorId: string;
  route?: { name: string; id: string };
  actionLabel?: string;
  at: number;
  /** A credit or interest from a real person or house: may enter an already composed Home. */
  urgent: boolean;
}

export interface Composition {
  lead: Candidate | null;
  personal: PersonalNews | null;
  middle: Candidate[];
  composedAt: number;
}

export const SIZE: Record<MiddleType, Size> = { people: 'large', post: 'large', projectUpdates: 'compact', opportunity: 'compact', house: 'compact', creditRelation: 'compact', event: 'compact' };
export const CAP: Record<MiddleType, number> = { people: 1, post: 2, projectUpdates: 1, opportunity: 1, house: 1, creditRelation: 1, event: 1 };
export const QUALITY_BAR = 0.5;
export const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** Never fewer than this many units (lead included) when genuine content exists. */
export const MIN_UNITS = 3;
/** Zero-based: an opportunity never sits above the third middle unit. */
export const OPPORTUNITY_MIN_POSITION = 2;
export const MAX_MIDDLE = 8;
