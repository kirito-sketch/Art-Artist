import type { Media } from '../data/types';

/*
 * Media selection for every create surface (docs/ux-refinement/PLAN.md, Stage 6). Pure functions over an ordered list,
 * so the composer, onboarding, events, projects and profile all add, remove, reorder and limit media the same way.
 * Components render the result; they never re-implement these rules. Order is meaningful: the first item is the cover.
 */
export const MEDIA_LIMIT = 10;

export type MediaKind = Media['kind'];
export interface SelectionRules {
  /** Most items allowed. 1 for single-image surfaces (avatar, cover). */
  limit?: number;
  /** Only this kind is accepted (an event cover takes images only). */
  kind?: MediaKind;
}

export interface AddResult {
  selection: Media[];
  /** Items not added because the selection was full. */
  overLimit: number;
  /** Items not added because they were the wrong kind. */
  wrongKind: number;
}

const limitOf = (rules: SelectionRules) => Math.max(1, rules.limit ?? MEDIA_LIMIT);

/** Adds items in order after the current ones. Duplicates are ignored; a single-item surface replaces its item. */
export function addMedia(selection: readonly Media[], items: readonly Media[], rules: SelectionRules = {}): AddResult {
  const limit = limitOf(rules);
  const fits = items.filter((m) => !rules.kind || m.kind === rules.kind);
  const wrongKind = items.length - fits.length;
  const fresh = fits.filter((m, i) => !selection.some((x) => x.id === m.id) && fits.findIndex((x) => x.id === m.id) === i);
  if (limit === 1) return { selection: fresh.length ? [fresh[0]] : [...selection], overLimit: Math.max(0, fresh.length - 1), wrongKind };
  const room = Math.max(0, limit - selection.length);
  return { selection: [...selection, ...fresh.slice(0, room)], overLimit: Math.max(0, fresh.length - room), wrongKind };
}

export function removeMedia(selection: readonly Media[], id: string): Media[] {
  return selection.filter((m) => m.id !== id);
}

/** Moves one item to a new position (clamped). Used by drag in the tray and by Move earlier / later. */
export function moveMedia(selection: readonly Media[], id: string, to: number): Media[] {
  const from = selection.findIndex((m) => m.id === id);
  if (from < 0) return [...selection];
  const next = selection.filter((m) => m.id !== id);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, selection[from]);
  return next;
}

export function moveBy(selection: readonly Media[], id: string, by: -1 | 1): Media[] {
  return moveMedia(selection, id, selection.findIndex((m) => m.id === id) + by);
}

/** What the tray says: "3 of 10", and whether more can be added. */
export function selectionStatus(selection: readonly Media[], rules: SelectionRules = {}) {
  const limit = limitOf(rules);
  return { count: selection.length, limit, full: selection.length >= limit, label: `${selection.length} of ${limit}` };
}

/** A device file read in this browser tab only (D6): a blob: or data: URL, never a stored upload. */
export function isSessionMedia(m: Media): boolean {
  return m.src.startsWith('blob:') || m.src.startsWith('data:');
}

/**
 * Which items "Also add photos to Selected work" would add. Portfolio holds images only, so videos stay in the post;
 * the composer says so instead of dropping them silently. It never creates or implies a credit.
 */
export function portfolioSplit(selection: readonly Media[]) {
  return { images: selection.filter((m) => m.kind === 'image'), videos: selection.filter((m) => m.kind === 'video').length };
}

/** Plain-language reason for items that couldn't be added, or null. */
export function addMessage(r: Pick<AddResult, 'overLimit' | 'wrongKind'>, rules: SelectionRules = {}): string | null {
  const parts: string[] = [];
  if (r.overLimit) parts.push(limitOf(rules) === 1 ? 'Only one item is used here.' : `That's the limit: ${limitOf(rules)} at a time. ${r.overLimit} not added.`);
  if (r.wrongKind) parts.push(rules.kind === 'image' ? 'Only photos can be used here.' : 'Only video can be used here.');
  return parts.length ? parts.join(' ') : null;
}
