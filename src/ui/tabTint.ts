import { useEffect } from 'react';

/**
 * The tab bar picks up the colour of the card in the middle of the screen, as a soft glow behind the pill (the way
 * Netflix reflects the top rail in its bottom bar). One card at a time owns it; it clears when that card leaves.
 */
const cache = new Map<string, Promise<string | null>>();

/** Average colour of the picture as "r g b", lifted slightly so dark pictures still read as a colour. */
function dominant(src: string): Promise<string | null> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = c.height = 12;
          const g = c.getContext('2d', { willReadFrequently: true })!;
          g.drawImage(img, 0, 0, 12, 12);
          const d = g.getImageData(0, 0, 12, 12).data;
          let r = 0, gg = 0, b = 0, w = 0;
          for (let i = 0; i < d.length; i += 4) {
            const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
            const weight = 1 + (mx - mn) / 64; // favour colourful pixels over grey ones
            r += d[i] * weight; gg += d[i + 1] * weight; b += d[i + 2] * weight; w += weight;
          }
          const lift = (v: number) => Math.round(Math.min(255, (v / w) * 1.12 + 6));
          resolve(`${lift(r)} ${lift(gg)} ${lift(b)}`);
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
    cache.set(src, p);
  }
  return p;
}

let owner = 0;
export function useTabTint(src: string | undefined, on: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    if (!on || !src) return;
    const me = ++owner;
    let cancelled = false;
    void dominant(src).then((rgb) => {
      if (!cancelled && rgb && owner === me) { root.style.setProperty('--tab-tint', rgb); root.dataset.tabTint = '1'; }
    });
    return () => {
      cancelled = true;
      if (owner === me) { root.style.removeProperty('--tab-tint'); delete root.dataset.tabTint; }
    };
  }, [src, on]);
}
