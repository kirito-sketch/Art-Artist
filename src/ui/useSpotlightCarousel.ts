import { useLayoutEffect, useRef, useState } from 'react';

/** Three identical runs let native swiping cross either boundary without a visible rewind. */
export function useSpotlightCarousel(keys: string, count: number, initial: number, lowPower: boolean, onSelect: (index: number) => void) {
  const track = useRef<HTMLDivElement>(null);
  const [physical, setPhysical] = useState(count > 1 ? count + initial : 0);
  const [canAnimate, setCanAnimate] = useState(false);
  const latest = useRef({ initial, lowPower, onSelect });
  latest.current = { initial, lowPower, onSelect };
  const controls = useRef({ select: (_index: number) => {}, sync: () => {} });

  useLayoutEffect(() => {
    const el = track.current;
    if (!el || !count) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    let current = count > 1 ? count + Math.min(latest.current.initial, count - 1) : 0;
    let timer = 0, settleTimer = 0, frame = 0;
    let stepping = false, touching = false, visible = false, focused = document.hasFocus();
    const normal = (index: number) => ((index % count) + count) % count;
    const animated = () => !reduced.matches && !connection?.saveData && !latest.current.lowPower;
    const allowed = () => count > 1 && animated() && visible && focused &&
      document.visibilityState === 'visible' && !el.closest('[inert]') && !touching && !el.parentElement?.contains(document.activeElement);
    const position = (index: number) => {
      const card = el.children[index] as HTMLElement;
      return card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
    };
    // Scale follows position continuously, including a finger-driven swipe. Layout widths stay fixed.
    const paint = () => {
      for (let index = 0; index < el.children.length; index++) {
        const card = el.children[index] as HTMLElement;
        const distance = Math.min(1, Math.abs(el.scrollLeft - position(index)) / (card.offsetWidth + 10));
        card.style.setProperty('--spot-scale', String(1 - distance * 0.12));
      }
    };
    const clearTimer = () => { window.clearTimeout(timer); timer = 0; };
    const schedule = () => {
      clearTimer();
      setCanAnimate(animated());
      if (allowed() && !stepping) timer = window.setTimeout(() => move(current + 1), 6000);
    };
    const commit = (index: number) => {
      const logical = normal(index);
      current = count > 1 ? count + logical : 0;
      // Same neighbours, same pixels. Only the invisible physical run changes.
      el.scrollLeft = position(current);
      paint();
      setPhysical(current);
      latest.current.onSelect(logical);
      schedule();
    };
    const cancelMotion = () => {
      cancelAnimationFrame(frame);
      frame = 0; stepping = false;
      el.classList.remove('is-stepping');
    };
    const move = (target: number) => {
      clearTimer(); window.clearTimeout(settleTimer); cancelMotion();
      const from = el.scrollLeft, to = position(target);
      if (!animated() || Math.abs(from - to) < 1) { commit(target); return; }
      stepping = true; el.classList.add('is-stepping');
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 600);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        el.scrollLeft = from + (to - from) * eased;
        paint();
        if (t < 1) frame = requestAnimationFrame(tick);
        else { cancelMotion(); commit(target); }
      };
      frame = requestAnimationFrame(tick);
    };
    const nearest = () => {
      const first = el.children[0] as HTMLElement;
      const second = el.children[1] as HTMLElement | undefined;
      const step = second ? second.offsetLeft - first.offsetLeft : 1;
      return Math.max(0, Math.min(el.children.length - 1, Math.round((el.scrollLeft - position(0)) / step)));
    };
    const settle = () => { if (!touching && !stepping) commit(nearest()); };
    const scroll = () => {
      paint();
      if (stepping) return;
      clearTimer(); window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 140);
    };
    const touch = () => { touching = true; clearTimer(); cancelMotion(); };
    const release = () => { if (!touching) return; touching = false; scroll(); };
    const wheel = () => { clearTimer(); cancelMotion(); scroll(); };
    const sync = () => {
      if (!allowed() && stepping) { cancelMotion(); commit(nearest()); }
      schedule();
    };
    const focus = () => { focused = true; sync(); };
    const blur = () => { focused = false; sync(); };
    const focusOut = () => queueMicrotask(sync);
    const key = (event: KeyboardEvent) => {
      if (count > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault(); el.focus({ preventScroll: true }); move(current + (event.key === 'ArrowRight' ? 1 : -1));
      }
    };
    const resize = () => {
      cancelMotion();
      const width = Math.min(300, Math.max(1, el.clientWidth * 0.7));
      el.style.setProperty('--spot-width', `${width}px`);
      el.style.paddingInline = `${(el.clientWidth - width) / 2}px`;
      commit(current);
    };
    controls.current = {
      select(index) {
        const delta = normal(index) - normal(current);
        const shortest = delta > count / 2 ? delta - count : delta < -count / 2 ? delta + count : delta;
        move(current + shortest);
      }, sync,
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && entry.intersectionRatio >= 0.55; sync(); }, { threshold: [0, 0.55] });
    io.observe(el);
    const mo = new MutationObserver(sync);
    for (let ancestor = el.parentElement; ancestor; ancestor = ancestor.parentElement) mo.observe(ancestor, { attributes: true, attributeFilter: ['inert', 'hidden'] });
    el.addEventListener('scroll', scroll, { passive: true });
    el.addEventListener('pointerdown', touch, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    el.addEventListener('wheel', wheel, { passive: true });
    el.addEventListener('keydown', key);
    el.parentElement?.addEventListener('focusin', sync); el.parentElement?.addEventListener('focusout', focusOut);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', focus); window.addEventListener('blur', blur);
    reduced.addEventListener('change', sync); connection?.addEventListener('change', sync);
    return () => {
      clearTimer(); window.clearTimeout(settleTimer); cancelMotion();
      ro.disconnect(); io.disconnect(); mo.disconnect();
      el.removeEventListener('scroll', scroll); el.removeEventListener('pointerdown', touch);
      window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release);
      el.removeEventListener('wheel', wheel); el.removeEventListener('keydown', key);
      el.parentElement?.removeEventListener('focusin', sync); el.parentElement?.removeEventListener('focusout', focusOut);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', focus); window.removeEventListener('blur', blur);
      reduced.removeEventListener('change', sync); connection?.removeEventListener('change', sync);
    };
  }, [keys, count]);
  useLayoutEffect(() => { controls.current.sync(); }, [lowPower]);
  return { track, physical, canAnimate, select: (index: number) => controls.current.select(index) };
}
