import { EXCLUDED, LEAD_TYPES, QUALITY_BAR, WINDOW_MS, type Candidate } from './types';

/**
 * What may reach Home at all: high or medium significance, inside the seven-day window, above the quality
 * bar. Low-significance activity (profile text edits, follows, tiny metadata) is never used to look busy.
 * Excluded types (Events) never get this far, so they can't take a place or change the ranking.
 */
export const eligible = (cs: Candidate[], now: number) => cs.filter((x) => !EXCLUDED.includes(x.type) && x.significance !== 'low' && now - x.at <= WINDOW_MS && x.quality >= QUALITY_BAR);

/** The lead is a project or visual work of high significance. Never a role, a person, a house or an event. */
export const canLead = (x: Candidate) => x.leadable && x.significance === 'high' && LEAD_TYPES.includes(x.type);
