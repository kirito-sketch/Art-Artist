/*
 * Design-direction exploration (docs/PROFILE_GLASS_DIRECTIONS.md). `?dir=a|b|c` renders one of three proposed
 * directions for the profile heroes, the bottom navigation and the CTAs, for review only. Without the parameter the
 * app is unchanged. Read once per page load and never stored.
 */
export type Direction = 'current' | 'a' | 'b' | 'c';
const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('dir') : null;
export const DIRECTION: Direction = q === 'a' || q === 'b' || q === 'c' ? q : 'current';
