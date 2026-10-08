import { DIRECTION } from './designDirection';

/*
 * Approved refinements (docs/NAV_AND_POST_NOTCH.md), now the default everywhere. Each keeps a URL escape for comparison,
 * read once per page load and never stored:
 *   ?nav=off        the previous solid bottom navigation (no glass, no lens).
 *   ?actions=pill   the previous frosted action pill and native video controls.
 *   ?samples        opens a stream of review samples (ratios, video states, failure).
 * The profile-direction review (?dir=a|c) keeps its own navigation treatment.
 */
const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const NAV_GLASS = q.get('nav') !== 'off' && DIRECTION !== 'a' && DIRECTION !== 'c';
/** Direction A keeps its own solid lens; everything else uses the glass lens. */
export const NAV_LENS = NAV_GLASS || DIRECTION === 'a';
export const POST_NOTCH = q.get('actions') !== 'pill';
export const POST_SAMPLES = POST_NOTCH && q.has('samples');
/**
 * The Home audit's new order with Spotlight Direction A, "This week" (docs/HOME_SPOTLIGHT.md). The default since
 * October 2026; ?home-previous shows the earlier Home (big Spotlight, five tiles) for comparison.
 */
export const HOME_PREVIEW = !q.has('home-previous');
/** Review aid: ?week=1 or ?week=2 limits This week to that many cards; ?week=noimg drops the images. */
export const WEEK_TEST = HOME_PREVIEW ? q.get('week') : null;
