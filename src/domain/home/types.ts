/*
 * Home composer types (docs/HOME.md). The composer is pure: plain data in, plain data out, so every rule
 * of the agreed Home architecture is deterministic and unit-tested.
 *
 *   candidates -> eligible (significance, quality, window) -> rank -> compose (rules) -> session snapshot
 *
 * A new kind of Home content joins by adding one entry to WEIGHT and CAP and a candidate adapter. The page
 * layout does not change.
 */
export type MiddleType = 'project' | 'people' | 'post' | 'projectUpdates' | 'opportunity' | 'house' | 'creditRelation' | 'event';
/**
 * How heavy a unit feels on the page, so the composition has rhythm:
 *  - immersive: a full-width project, media first (the lead, and at most one more lower down);
 *  - media: a piece of work, its picture or clip carrying it;
 *  - rail: a horizontal row of portraits;
 *  - compact: rows with a thumbnail (project activity, a house, a verified pair);
 *  - structured: a role's facts, smallest on purpose.
 */
export type Weight = 'immersive' | 'media' | 'rail' | 'compact' | 'structured';
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

export const WEIGHT: Record<MiddleType, Weight> = { project: 'immersive', post: 'media', people: 'rail', projectUpdates: 'compact', house: 'compact', creditRelation: 'compact', opportunity: 'structured', event: 'compact' };
export const CAP: Record<MiddleType, number> = { project: 1, people: 1, post: 2, projectUpdates: 1, opportunity: 1, house: 1, creditRelation: 1, event: 0 };
/** At most this many units of one weight (two rails would make the page a carousel). */
export const WEIGHT_CAP: Partial<Record<Weight, number>> = { rail: 2, immersive: 1 };
/**
 * Not Home content (October 2026 decision): Events are not approved as a Home type. They are never the lead,
 * never a section, and never ranked; they stay in Discover. The type exists for the Events module only.
 */
export const EXCLUDED: MiddleType[] = ['event'];
/** What may lead: a project, or a piece of visual work. Never a role, a person, a house or an event. */
export const LEAD_TYPES: MiddleType[] = ['project', 'projectUpdates', 'post'];
export const QUALITY_BAR = 0.5;
export const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** Never fewer than this many units (lead included) when genuine content exists. */
export const MIN_UNITS = 3;
/** Zero-based: an opportunity never sits above the third middle unit. */
export const OPPORTUNITY_MIN_POSITION = 2;
/** Zero-based: a second immersive project sits low on the page, well away from the lead. */
export const PROJECT_MIN_POSITION = 3;
export const MAX_MIDDLE = 8;
/** A first Home (just signed up) is shorter: there is no network yet, so fewer, better units. */
export const MAX_MIDDLE_FIRST_RUN = 5;
