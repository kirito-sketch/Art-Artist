/**
 * Which research surface this page load is. Path-based on a server (Vercel rewrites /test and
 * /research to the app); the query form (?test, ?dashboard) also works on static hosts and previews.
 *  - TEST_MODE: the participant-facing unmoderated test (/test). No console, persona switcher or QA tools.
 *  - RESEARCH_DASHBOARD: the researcher dashboard (/research). Separate from the existing ?research mode.
 */
const loc = typeof location !== 'undefined' ? location : null;
const path = loc?.pathname.replace(/\/+$/, '') ?? '';
const params = new URLSearchParams(loc?.search ?? '');
export const TEST_MODE = /\/test$/.test(path) || params.has('test');
export const RESEARCH_DASHBOARD = !TEST_MODE && (/\/research$/.test(path) || params.has('dashboard'));
/** Studio (/studio): links into the app in any state, flows, test states, tools and the archive (docs/STUDIO.md). */
export const STUDIO = !TEST_MODE && !RESEARCH_DASHBOARD && /\/studio$/.test(path);
