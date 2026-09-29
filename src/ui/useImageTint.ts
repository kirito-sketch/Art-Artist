import { useEffect, useState } from 'react';
import type { Media } from '../data/types';

const cache = new Map<string, string>();

/**
 * Average colour of an image, softened towards white, for Luma-style page tints.
 * Tries the intended file, then the fallback. Returns null until known.
 */
export function useImageTint(media?: Media | null): string | null {
  const key = media ? media.src + (media.fallback ?? '') : '';
  const [tint, setTint] = useState<string | null>(cache.get(key) ?? null);

  useEffect(() => {
    if (!media || cache.has(key)) {
      setTint(cache.get(key) ?? null);
      return;
    }
    let alive = true;
    const urls = [media.src, media.fallback].filter(Boolean) as string[];
    const tryLoad = (i: number) => {
      if (i >= urls.length) return;
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = 12;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 12, 12);
        const d = ctx.getImageData(0, 0, 12, 12).data;
        let r = 0, g = 0, b = 0;
        for (let p = 0; p < d.length; p += 4) {
          r += d[p];
          g += d[p + 1];
          b += d[p + 2];
        }
        const n = d.length / 4;
        const value = `${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)}`;
        cache.set(key, value);
        if (alive) setTint(value);
      };
      img.onerror = () => tryLoad(i + 1);
      img.src = urls[i];
    };
    tryLoad(0);
    return () => {
      alive = false;
    };
  }, [key, media]);

  return tint;
}
