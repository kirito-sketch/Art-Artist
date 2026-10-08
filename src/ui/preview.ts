import { DIRECTION } from './designDirection';

/*
 * Approved refinements under review (docs/NAV_AND_POST_NOTCH.md). Each has its own URL flag, separate from the
 * profile-direction selector (?dir=), so one approval never implies the other. Read once per page load, never stored.
 *   ?nav=glass      Direction B's floating glass bottom navigation with the selected lens (also on with ?dir=b).
 *   ?actions=notch  Option A post actions: the corner notch, the quiet feed video and the expanded viewer.
 *   ?samples        With ?actions=notch: opens a stream of review samples (ratios, video states, failure).
 */
const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const NAV_GLASS = q.get('nav') === 'glass' || DIRECTION === 'b';
/** Direction A keeps its own solid lens; Direction B and ?nav=glass use the glass lens. */
export const NAV_LENS = NAV_GLASS || DIRECTION === 'a';
export const POST_NOTCH = q.get('actions') === 'notch';
export const POST_SAMPLES = POST_NOTCH && q.has('samples');
