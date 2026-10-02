/*
 * Accessibility plumbing shared by the app shell, sheets and cards (docs/ACCESSIBILITY_AUDIT.md).
 * Layers that are not on top are `inert` (out of the tab order and the accessibility tree), focus moves
 * into whatever opens and returns to whatever opened it.
 */
import { createContext, useContext, type KeyboardEvent as ReactKeyboardEvent } from 'react';

/** `inert` as a DOM attribute. React 18 only passes it through as a string. */
export const inertProps = (on: boolean): object => (on ? { inert: '' } : {});

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const usable = (e: HTMLElement) => !e.closest('[inert]') && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';

export const focusables = (root: Element) => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(usable);

const isUsable = (e: Element | null): e is HTMLElement => !!e && e.isConnected && e instanceof HTMLElement && usable(e);

/** Focus without scrolling the page under the user (the element is already where they left it). */
export function focusEl(e: HTMLElement | null | undefined) {
  if (!e) return false;
  e.focus({ preventScroll: true });
  return document.activeElement === e;
}

/**
 * Move focus into a screen or surface: an explicit `[data-autofocus]`, otherwise its first heading
 * (made programmatically focusable, so a screen reader announces where the user now is), otherwise
 * its first control.
 */
export function focusInto(root: Element | null | undefined) {
  if (!root) return false;
  const auto = root.querySelector<HTMLElement>('[data-autofocus]');
  if (isUsable(auto) && focusEl(auto)) return true;
  const heading = [...root.querySelectorAll<HTMLElement>('h1, h2')].find(usable);
  if (heading) {
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    if (focusEl(heading)) return true;
  }
  return focusEl(focusables(root)[0]);
}

/** Return focus to the control that opened something; if it is gone, into the screen now showing. */
export function restoreFocus(opener: Element | null | undefined, fallback: () => Element | null | undefined) {
  // The layer that held the opener stops being inert a commit or two later: wait for it (bounded).
  let tries = 0;
  const attempt = () => {
    const active = document.activeElement;
    // Something else already took focus deliberately (a new screen, a field): leave it.
    if (active && active !== document.body && isUsable(active) && !active.closest('.sheet-layer, .create-layer')) return;
    if (isUsable(opener ?? null) && focusEl(opener as HTMLElement)) return;
    if (++tries < 30 && opener?.isConnected) return void requestAnimationFrame(attempt);
    focusInto(fallback());
  };
  requestAnimationFrame(attempt);
}

/** Keep Tab inside a surface (a dialog). `extra` are controls outside it that belong to it. */
export function trapTab(e: ReactKeyboardEvent | KeyboardEvent, root: Element, extra: HTMLElement[] = []) {
  if (e.key !== 'Tab') return;
  const list = [...focusables(root), ...extra.filter(usable)];
  if (!list.length) return;
  // Move explicitly through the list (it may include controls outside the surface, like the +).
  e.preventDefault();
  const i = list.indexOf(document.activeElement as HTMLElement);
  const next = i < 0 ? (e.shiftKey ? list.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + list.length) % list.length;
  focusEl(list[next]);
}

/**
 * Arrow keys for a group of radios or tabs (roving focus): moves to the next/previous option and
 * selects it, as native radio groups do.
 */
export function rovingKeys(e: ReactKeyboardEvent<HTMLElement>, selector = '[role="radio"], [role="tab"]') {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(e.key)) return;
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>(selector)].filter((x) => !(x as HTMLButtonElement).disabled);
  const i = items.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  const n = items.length;
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n;
  items[next].focus();
  items[next].click();
}

/** Tab stop for an option in a roving group: the selected one, or the first when none is. */
export const rovingIndex = (selected: boolean, index: number, anySelected: boolean) => (selected || (!anySelected && index === 0) ? 0 : -1);

/* ------------------------------------------------------------ modal layer */

export interface ModalLayer {
  /** Where sheets render, above every screen, so the screens can be made inert while one is open. */
  root: HTMLElement | null;
  /** A sheet is open: everything else becomes inert until the returned function is called. */
  register: () => () => void;
}

export const ModalContext = createContext<ModalLayer | null>(null);
export const useModalLayer = () => useContext(ModalContext);

/** The screen the user is looking at now (top route, or the active tab). */
export function currentScreen(): Element | null {
  const live = (sel: string) => [...document.querySelectorAll(sel)].filter((e) => !e.closest('[inert]'));
  const routes = live('.phone .route-layer');
  if (routes.length) return routes[routes.length - 1];
  return live('.phone .entry')[0] ?? live('.phone .policy-update')[0] ?? live('.phone .tab-layer')[0] ?? null;
}

/**
 * A short name for a piece of work: its caption when it has one, otherwise what it is and where it is
 * from ("Still 2 of 6 from Neela Akasham"). Never a description essay.
 */
export function mediaName(m: { kind: string; caption?: string }, i: number, n: number, what: string, from: string) {
  const kind = m.kind === 'video' ? 'Video' : what;
  return `${kind} ${i + 1} of ${n} ${from}${m.caption ? `: ${m.caption}` : ''}`;
}

/** The control the user last activated (tracked by the app shell): what focus returns to. */
export const activation: { el: HTMLElement | null } = { el: null };

/**
 * Input modality on <html data-input="keyboard|pointer">. Art and Artist is a touch app: focus rings
 * are drawn only while someone is actually navigating with a keyboard, never after a tap.
 */
export function trackInputModality() {
  const root = document.documentElement;
  if (root.dataset.input) return () => {};
  root.dataset.input = 'pointer';
  const keys = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']);
  const onKey = (e: KeyboardEvent) => {
    if (keys.has(e.key)) root.dataset.input = 'keyboard';
  };
  const onPointer = () => {
    root.dataset.input = 'pointer';
  };
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('pointerdown', onPointer, true);
  window.addEventListener('touchstart', onPointer, { capture: true, passive: true });
  return () => {
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('pointerdown', onPointer, true);
    window.removeEventListener('touchstart', onPointer, true);
    delete root.dataset.input;
  };
}

/**
 * iOS text size (Dynamic Type) for the type tokens: the system body size over the 17px design size,
 * kept between 1 and 1.6 so the layout grows with the user's setting but never shrinks below design.
 */
export function applySystemTextSize() {
  if (!CSS.supports?.('font', '-apple-system-body')) return;
  const probe = document.createElement('span');
  probe.style.font = '-apple-system-body';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  document.body.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).fontSize) || 17;
  probe.remove();
  const scale = Math.min(1.6, Math.max(1, px / 17));
  document.documentElement.style.setProperty('--type-scale', String(Math.round(scale * 100) / 100));
}
