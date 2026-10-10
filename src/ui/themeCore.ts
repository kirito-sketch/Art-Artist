/*
 * Appearance: System, Light or Dark (src/ui/theme.ts). This file is shared by the runtime and by the inline
 * <head> script vite.config.ts writes into index.html, so the very first paint already has the right theme
 * (no light flash on a dark phone).
 *
 * The theme belongs to the normal Art and Artist app only. /test, /research, research sessions, the
 * moderation console and the internal QA pages never receive it: they stay exactly as they are.
 */
export const APPEARANCE_KEY = 'aa-appearance';

/** The page's own <meta name="theme-color"> per theme (iOS/Android browser chrome). */
export const THEME_COLOR = { light: '#f3f3f5', dark: '#06141b' } as const;

/** Is this page the normal app (the only surface that follows the appearance setting)? */
export function isThemedSurface(): boolean {
  if (typeof location === 'undefined') return false;
  const q = new URLSearchParams(location.search);
  const p = location.pathname.replace(/\/+$/, '');
  if (/\/research$/.test(p)) return false;
  if (['dashboard', 'research', 'admin', 'lab', 'scenario', 'specimen', 'motion'].some((k) => q.has(k))) return false;
  try {
    if (sessionStorage.getItem('ana-research') === '1' || sessionStorage.getItem('ana-admin') === '1') return false;
  } catch {
    /* storage blocked: the URL checks above still apply */
  }
  return true;
}

/** Inline <head> script: resolve the stored choice (or the device) and mark <html> before the first paint. */
export function themeBootScript(): string {
  return `(function(){try{var s=${isThemedSurface.toString()};if(!s())return;var a=null;try{a=localStorage.getItem('${APPEARANCE_KEY}')}catch(e){}var d=a==='dark'||(a!=='light'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.setAttribute('data-theme',d?'dark':'light');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'${THEME_COLOR.dark}':'${THEME_COLOR.light}')}catch(e){}})();`;
}
