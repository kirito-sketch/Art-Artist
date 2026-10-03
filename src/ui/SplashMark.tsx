import { useEffect, useRef, useState } from 'react';
import { playSplashMark, splashSvg } from './splashCore';

let clipIds = 0;

/**
 * The splash mark inside the app (the entry flow, and the launch splash of a page served without the one in index.html). The markup is built once per
 * mount and handed to the DOM as static SVG, so React re-renders never touch it and never restart the
 * animation; playback and completion come from playSplashMark (src/ui/splashCore.ts).
 */
export function SplashMark({ onDone }: { onDone?: () => void }) {
  const host = useRef<HTMLSpanElement>(null);
  const [html] = useState(() => splashSvg(`splash-clip-${++clipIds}`));
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const svg = host.current?.firstElementChild;
    if (!svg) return;
    return playSplashMark(svg, () => done.current?.());
  }, []);
  return <span ref={host} className="splash-mark-host" dangerouslySetInnerHTML={{ __html: html }} />;
}
