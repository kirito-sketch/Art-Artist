import { useEffect, useRef, type RefObject } from 'react';
import { useLowPower, type AmbientVariant } from './ambient';

/*
 * Art and Artist living background (experiment, docs/LIVING_BACKGROUND.md). A layer behind a screen's
 * content, never inside the scroller, so it costs nothing per scrolled pixel:
 *
 *  - idle motion is CSS keyframes on transform and opacity only (the compositor runs them, no JavaScript,
 *    no repaint). Each light has its own path and a duration that shares no small factor with the others
 *    (53s, 79s, 107s for A), so the combined image does not visibly repeat;
 *  - the lights are radial gradients drawn small and scaled up (they are soft, so nothing is lost), so their
 *    GPU textures stay small;
 *  - scroll response is one transform per frame on one wrapper (requestAnimationFrame, passive listener):
 *    the atmosphere moves at a small fraction of the content (12%; depth layers 4 to 16%);
 *  - large imagery on screen lowers the atmosphere (opacity), so photography always reads first;
 *  - Reduce Motion or low power: the same composition, still. The tab being inactive pauses it.
 *
 * `tint` is the hook for contextual colour later (a project's key artwork, a profile's work); not used yet.
 */
export function LivingBackground({ variant, scrollRef, tint }: { variant: Exclude<AmbientVariant, 'off'>; scrollRef: RefObject<HTMLElement | null>; tint?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const low = useLowPower();

  // Scroll depth and the image-aware quieting: transform and opacity written straight to the layers.
  useEffect(() => {
    const el = root.current;
    const sc = scrollRef.current;
    if (!el || !sc) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const layers = [...el.querySelectorAll<HTMLElement>('[data-depth]')];
    let raf = 0;
    const frame = () => {
      raf = 0;
      if (reduced.matches || low) {
        layers.forEach((l) => (l.style.transform = ''));
        return;
      }
      const y = Math.max(0, sc.scrollTop);
      layers.forEach((l) => (l.style.transform = `translate3d(0, ${(-y * Number(l.dataset.depth)).toFixed(1)}px, 0)`));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    sc.addEventListener('scroll', onScroll, { passive: true });
    frame();

    // How much of the viewport is photography: the atmosphere steps back as large images fill the screen.
    const seen = new Map<Element, number>();
    const quiet = () => {
      const area = [...seen.values()].reduce((a, b) => a + b, 0);
      const vp = sc.clientWidth * sc.clientHeight || 1;
      el.style.setProperty('--ambient-presence', area / vp > 0.35 ? '0.55' : area / vp > 0.18 ? '0.8' : '1');
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? seen.set(e.target, e.intersectionRect.width * e.intersectionRect.height) : seen.delete(e.target)));
        quiet();
      },
      { root: sc, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    const watch = () => sc.querySelectorAll('.photo, img').forEach((m) => (m.getBoundingClientRect().width > 140 ? io.observe(m) : undefined));
    watch();
    const mo = new MutationObserver(() => watch());
    mo.observe(sc, { childList: true, subtree: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      sc.removeEventListener('scroll', onScroll);
      io.disconnect();
      mo.disconnect();
    };
  }, [scrollRef, low, variant]);

  return (
    <div ref={root} className={`ambient ambient--${variant}${low ? ' is-still' : ''}`} aria-hidden style={tint ? ({ '--ambient-tint': tint } as React.CSSProperties) : undefined}>
      {variant === 'a' && (
        <div className="ambient-depth" data-depth="0.12">
          <span className="ambient-light ambient-light--1" />
          <span className="ambient-light ambient-light--2" />
          <span className="ambient-light ambient-light--3" />
        </div>
      )}
      {variant === 'b' && (
        <>
          <div className="ambient-depth" data-depth="0.1">
            <span className="ambient-light ambient-light--key" />
            <span className="ambient-light ambient-light--bounce" />
          </div>
          <span className="ambient-grain" style={{ backgroundImage: `url(${grain()})` }} />
          <span className="ambient-vignette" />
        </>
      )}
      {variant === 'c' && (
        <>
          <div className="ambient-depth" data-depth="0.04">
            <span className="ambient-plane ambient-plane--far" />
          </div>
          <div className="ambient-depth" data-depth="0.09">
            <span className="ambient-plane ambient-plane--mid" />
          </div>
          <div className="ambient-depth" data-depth="0.16">
            <span className="ambient-plane ambient-plane--near" />
          </div>
        </>
      )}
    </div>
  );
}

/** A 96 px tile of fine luminance noise, made once per page (a few KB), tiled by the grain layer. */
let grainUrl = '';
function grain() {
  if (grainUrl) return grainUrl;
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(96, 96);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grainUrl = c.toDataURL('image/png');
  return grainUrl;
}
