import { useCallback, useRef } from 'react';

/*
 * Scroll depth for a hero photo above a content sheet (the individual profile). It is a callback ref for
 * the scrolling element; inside it, [data-hero] is the hero box, [data-hero-photo] the photo layer and
 * [data-hero-dim] a dimming layer.
 *
 * While the hero scrolls away with the content (1x, the browser's own scrolling, never intercepted), the
 * photo layer is moved down by a fraction of the scroll, so it travels slower than the sheet over it, and
 * grows by 3% across the hero's height; a dim layer deepens a little as the sheet rises over it. Only
 * transform and opacity change, from one requestAnimationFrame per frame, written straight to the
 * elements: no React state, no layout. Reduced motion leaves everything where it is.
 *
 * `onOver` reports (only when it changes) whether the hero still sits behind the status bar.
 */
const SPEED = 0.3; // the photo trails the content by 30% of the scroll distance
const SCALE = 0.03; // 1 → 1.03 over the hero's height
const DIM = 0.26; // dim layer opacity once the hero has scrolled away

export function useHeroParallax(onOver: (over: boolean) => void) {
  const cleanup = useRef<(() => void) | null>(null);
  const over = useRef(onOver);
  over.current = onOver;

  return useCallback((sc: HTMLElement | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (!sc) return;
    const hero = sc.querySelector<HTMLElement>('[data-hero]');
    const photo = sc.querySelector<HTMLElement>('[data-hero-photo]');
    const dim = sc.querySelector<HTMLElement>('[data-hero-dim]');
    if (!hero || !photo) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let height = hero.offsetHeight || 1;
    let raf = 0;
    let isOver = true;

    const frame = () => {
      raf = 0;
      const y = Math.max(0, sc.scrollTop);
      if (reduced.matches) {
        photo.style.transform = '';
        if (dim) dim.style.opacity = '';
      } else {
        const t = Math.min(1, y / height);
        photo.style.transform = `translate3d(0, ${(y * SPEED).toFixed(1)}px, 0) scale(${(1 + SCALE * t).toFixed(4)})`;
        if (dim) dim.style.opacity = (DIM * t).toFixed(3);
      }
      const now = y < height * 0.75;
      if (now !== isOver) {
        isOver = now;
        over.current(now);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => ((height = hero.offsetHeight || 1), onScroll())) : null;
    ro?.observe(hero);
    sc.addEventListener('scroll', onScroll, { passive: true });
    reduced.addEventListener?.('change', onScroll);
    frame();

    cleanup.current = () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      sc.removeEventListener('scroll', onScroll);
      reduced.removeEventListener?.('change', onScroll);
      photo.style.transform = '';
      if (dim) dim.style.opacity = '';
    };
  }, []);
}
