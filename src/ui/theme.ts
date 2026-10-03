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

function apply(animate: boolean) {
  if (!enabled) return;
  const root = document.documentElement;
  const next = resolveTheme();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[next]);
  if (root.dataset.theme === next) return;
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

export function setAppearance(a: Appearance) {
  appearance = a;
  try {
    localStorage.setItem(APPEARANCE_KEY, a);
  } catch {
    /* storage blocked: the choice still applies for this session */
  }
  apply(true);
  emit();
}

const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));
export const useAppearance = () => useSyncExternalStore(subscribe, () => appearance, () => 'system' as Appearance);
export const useTheme = () => useSyncExternalStore(subscribe, () => resolveTheme(), () => 'light' as Theme);
