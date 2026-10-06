import { useSyncExternalStore } from 'react';
import { APPEARANCE_KEY, THEME_COLOR, isThemedSurface } from './themeCore';

/*
 * Appearance (Settings › Appearance): System (default), Light or Dark.
 *  - The choice is stored on this device (localStorage) and applies immediately, with no Save.
 *  - System follows the device, live: a change of the phone's appearance while the app is open updates it.
 *  - The resolved theme is <html data-theme="light|dark">; colours come from semantic tokens
 *    (src/styles/tokens.css, src/styles/theme-dark.css), so every screen follows, not only Settings.
 *  - The change is a short colour crossfade (no animation with Reduce Motion).
 */
export type Appearance = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const read = (): Appearance => {
  try {
    const v = localStorage.getItem(APPEARANCE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
};

let appearance: Appearance = typeof window === 'undefined' ? 'system' : read();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const dark = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const reduced = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
let enabled = false;
let fadeTimer = 0;

export const resolveTheme = (a: Appearance = appearance): Theme => (a === 'system' ? (dark?.matches ? 'dark' : 'light') : a);

/** Where the change was asked for (the control's centre, in page pixels): the new theme grows out of it. */
export type Origin = { x: number; y: number };
type VT = { ready: Promise<void>; finished: Promise<void> };

function apply(animate: boolean, origin?: Origin) {
  if (!enabled) return;
  const root = document.documentElement;
  const next = resolveTheme();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[next]);
  if (root.dataset.theme === next) return;
  const start = (document as unknown as { startViewTransition?: (cb: () => void) => VT }).startViewTransition;
  if (animate && origin && start && !reduced?.matches) {
    // A circle of the new theme opens from the control and covers the screen (like District's switch).
    root.classList.add('theme-reveal');
    const t = start.call(document, () => {
      root.dataset.theme = next;
    });
    const r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
    t.ready
      .then(() =>
        root.animate(
          { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${r}px at ${origin.x}px ${origin.y}px)`] },
          { duration: 620, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' } as KeyframeAnimationOptions,
        ),
      )
      .catch(() => undefined);
    t.finished.finally(() => root.classList.remove('theme-reveal'));
    return;
  }
  if (animate && !reduced?.matches) {
    root.classList.add('theme-fade');
    window.clearTimeout(fadeTimer);
    fadeTimer = window.setTimeout(() => root.classList.remove('theme-fade'), 320);
  }
  root.dataset.theme = next;
}

/** Called once by the normal app. Every other surface keeps its own (light) presentation. */
export function enableTheme() {
  if (enabled || !isThemedSurface()) return;
  enabled = true;
  apply(false);
  dark?.addEventListener?.('change', () => {
    if (appearance === 'system') apply(true);
    emit();
  });
}

export function setAppearance(a: Appearance, origin?: Origin) {
  appearance = a;
  try {
    localStorage.setItem(APPEARANCE_KEY, a);
  } catch {
    /* storage blocked: the choice still applies for this session */
  }
  apply(true, origin);
  emit();
}

/** The centre of the control that was used, for the reveal. */
export const originOf = (el: Element): Origin => {
  const b = el.getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
};

const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));
export const useAppearance = () => useSyncExternalStore(subscribe, () => appearance, () => 'system' as Appearance);
export const useTheme = () => useSyncExternalStore(subscribe, () => resolveTheme(), () => 'light' as Theme);
