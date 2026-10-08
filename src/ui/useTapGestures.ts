import { useEffect, useRef, type MouseEvent } from 'react';

/*
 * Single and double tap on media (docs/ux-refinement/PLAN.md, Stage 1). A double tap Likes; a single tap does the
 * surface's own thing (pause or resume a video), confirmed only after the double-tap window has passed so a double tap
 * never also toggles playback twice. Taps on real controls (buttons, links, the scrubber, carousel dots) are never
 * gestures. Keyboard activation (a click with detail 0) is a single tap at once. Touch-first: no hover anywhere.
 */
export const DOUBLE_TAP_MS = 280;
const SLOP = 32;
const CONTROL = 'button, a, input, select, textarea, label, [role="slider"], [role="button"], [role="link"], [role="tab"], [data-no-gesture]';

export function isControl(target: EventTarget | null, surface: Element) {
  const el = target instanceof Element ? target.closest(CONTROL) : null;
  return !!el && el !== surface && surface.contains(el) && !el.hasAttribute('data-tap-surface');
}

export function useTapGestures({ onSingle, onDouble }: { onSingle?: () => void; onDouble?: (at: { x: number; y: number }) => void }) {
  const last = useRef<{ t: number; x: number; y: number } | null>(null);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (e: MouseEvent<HTMLElement>) => {
    if (isControl(e.target, e.currentTarget)) return;
    // Keyboard and assistive tech: a click without a pointer is a deliberate single action.
    if (e.detail === 0) {
      onSingle?.();
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const p = { t: performance.now(), x: e.clientX - r.left, y: e.clientY - r.top };
    const prev = last.current;
    if (prev && p.t - prev.t < DOUBLE_TAP_MS && Math.hypot(p.x - prev.x, p.y - prev.y) < SLOP) {
      window.clearTimeout(timer.current);
      last.current = null;
      onDouble?.({ x: p.x, y: p.y });
      return;
    }
    last.current = p;
    window.clearTimeout(timer.current);
    if (onSingle) timer.current = window.setTimeout(() => (last.current = null, onSingle()), onDouble ? DOUBLE_TAP_MS : 0);
  };
}
