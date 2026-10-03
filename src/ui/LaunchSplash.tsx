import { useEffect, useRef, useState } from 'react';
import { bootSplash, hasPlayedLaunchSplash, markLaunchSplashPlayed } from './launchSession';
import { SplashMark } from './SplashMark';

/*
 * The launch splash for the installed Home Screen app (standalone only; Safari is unchanged).
 *
 * It plays once per execution context: a new page load of the installed app is a launch, and nothing else
 * is. Whether it is still owed is an in-memory flag (src/ui/launchSession.ts), so it is never replayed by
 * visibility, focus, pageshow, a route change, a remount, or time spent in the background, and never
 * persisted, so the next genuine launch has it again. This component has no lifecycle listeners at all.
 *
 *   - index.html already shows and plays the splash from the first paint (src/ui/splashCore.ts,
 *     bootScript); this component adopts it, or, if the page was served without it, draws it here, once;
 *   - the app renders underneath (inert, and unpainted) whichever state it opens in (Home, the entry flow);
 *   - it leaves only when the mark has finished AND the screen underneath has painted its fonts and
 *     on-screen images, and is removed only after its fade.
 * The splash is a layer, never a reset: navigation, sheets, persona and saved content are not touched.
 */

/** Longest the splash waits for the screen underneath after it starts (slow network: reveal anyway). */
const READY_CAP_MS = 4000;
/** Safety net if transitionend never arrives (a hidden page, Reduce Motion): longer than the 300ms fade. */
const FADE_SAFETY_MS = 700;

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** The screen underneath has painted: fonts, and every image on screen loaded and decoded. */
async function appPainted() {
  await frame();
  try {
    await document.fonts?.ready;
  } catch {
    /* fonts unavailable: nothing to wait for */
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const settled = new Set<HTMLImageElement>();
  // Images can mount while earlier ones load (rails, carousels): look again until nothing new appears.
  for (;;) {
    const pending = [...document.querySelectorAll<HTMLImageElement>('.app-shell img')].filter((i) => {
      if (settled.has(i)) return false;
      // Only the screen showing: skip inactive tabs and covered routes (inert layers inside the shell).
      const layer = i.closest('[inert]');
      if (layer && !layer.classList.contains('app-shell')) return false;
      const r = i.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
    });
    if (!pending.length) break;
    await Promise.all(pending.map((i) => (i.decode ? i.decode().catch(() => undefined) : undefined)));
    pending.forEach((i) => settled.add(i));
    await frame();
  }
  await frame();
}

/**
 * Fade the splash off once the mark is done and the app is ready: the app is first made visible under the
 * finished (static) mark and given two frames to paint, so its first full paint never lands on a moving
 * frame; then the splash fades. Calls onGone after the fade.
 */
function revealApp(el: HTMLElement, markDone: Promise<void>, onReveal: () => void, onGone: () => void) {
  let over = false;
  let safety = 0;
  const ready = Promise.race([appPainted(), wait(READY_CAP_MS)]);
  const gone = () => {
    if (over) return;
    over = true;
    window.clearTimeout(safety);
    onGone();
  };
  const onEnd = (e: TransitionEvent) => e.target === el && e.propertyName === 'opacity' && gone();
  Promise.all([markDone, ready]).then(async () => {
    if (over) return;
    onReveal();
    await frame();
    await frame();
    if (over) return;
    el.addEventListener('transitionend', onEnd);
    el.setAttribute('aria-hidden', 'true');
    el.classList.add('is-leaving');
    safety = window.setTimeout(gone, FADE_SAFETY_MS);
  });
  return () => {
    over = true;
    window.clearTimeout(safety);
    el.removeEventListener('transitionend', onEnd);
  };
}

/**
 * What the app underneath should do: 'covered' (not painted: images still load and decode, but arriving
 * images cost no paint while the mark draws), 'revealing' (painted under the finished mark, still inert),
 * 'off' (interactive).
 */
export type LaunchPhase = 'covered' | 'revealing' | 'off';

export function LaunchSplash({ enabled, onPhase }: { enabled: boolean; onPhase?: (phase: LaunchPhase) => void }) {
  // What this execution context still owes, decided when this mounts: the splash index.html is already
  // playing (handed over), or, for a page served without it, one drawn here. After the splash has played
  // nothing is owed, so a remount of the app can never bring it back.
  const owed = enabled && !hasPlayedLaunchSplash();
  const [boot, setBoot] = useState<HTMLElement | null>(() => (owed ? bootSplash() : null));
  const [drawn, setDrawn] = useState(() => owed && !bootSplash());
  const showing = !!boot || drawn;
  const el = useRef<HTMLDivElement>(null);
  const markDone = useRef<() => void>(() => undefined);

  const [revealing, setRevealing] = useState(false);
  useEffect(() => {
    onPhase?.(!showing ? 'off' : revealing ? 'revealing' : 'covered');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showing, revealing]);

  // Not the installed app (or a page the boot script should have skipped): the boot splash never stays.
  useEffect(() => {
    if (!enabled) bootSplash()?.remove();
  }, [enabled]);

  // The splash index.html is already playing: start its mark now, then hand over.
  useEffect(() => {
    if (!boot) return;
    const done = new Promise<void>((r) => (boot.dataset.done ? r() : boot.addEventListener('aa-boot-done', () => r(), { once: true })));
    // The app has rendered and the main thread is free: start the mark now (see bootScript).
    (window as unknown as { __aaBootPlay?: () => void }).__aaBootPlay?.();
    return revealApp(boot, done, () => setRevealing(true), () => {
      boot.remove();
      markLaunchSplashPlayed();
      setBoot(null);
      setRevealing(false);
    });
  }, [boot]);

  // No splash in the page's HTML: draw it here, once.
  useEffect(() => {
    if (!drawn || !el.current) return;
    const done = new Promise<void>((r) => (markDone.current = r));
    return revealApp(el.current, done, () => setRevealing(true), () => {
      markLaunchSplashPlayed();
      setDrawn(false);
      setRevealing(false);
    });
  }, [drawn]);

  if (!drawn) return null;
  return (
    <div ref={el} className="launch-splash">
      <SplashMark onDone={() => markDone.current()} />
      <span className="sr-only" role="status">
        Opening Art and Artist
      </span>
    </div>
  );
}
