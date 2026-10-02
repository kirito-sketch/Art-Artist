import { useEffect, useRef, useState } from 'react';
import { SplashMark } from './SplashMark';

/*
 * The launch splash for the installed Home Screen app (standalone only; Safari is unchanged).
 *
 * iOS often resumes a standalone web app from memory instead of reloading it, so page load and React
 * mount alone miss most launches. Launch is therefore:
 *   - a cold start: index.html already shows and plays the splash from the first paint (see
 *     src/ui/splashCore.ts, bootScript); this component adopts it, or
 *   - a return to the foreground after at least LAUNCH_RESUME_MS in the background, tracked with
 *     visibilitychange, pagehide and pageshow. A short interruption returns straight to the app.
 *
 * The mark and the app are two separate states, joined at the end: the app renders underneath (inert)
 * while the mark plays; the splash leaves only when the mark has finished AND the screen underneath has
 * painted its fonts and on-screen images; it is removed only after its fade has finished. The splash is
 * a layer, never a reset: navigation, sheets, persona and saved content are kept. One launch plays it once.
 */

/** How long the app must be in the background before coming back counts as a new launch. */
export const LAUNCH_RESUME_MS = 45_000;
/** Longest the splash waits for the screen underneath after it starts (slow network: reveal anyway). */
const READY_CAP_MS = 4000;
/** Safety net if transitionend never arrives (a hidden page, Reduce Motion): longer than the 300ms fade. */
const FADE_SAFETY_MS = 700;

/** When the app went to the background (module level: survives re-renders, reset by a reload). */
const lifecycle: { hiddenAt: number | null } = { hiddenAt: null };
/** The splash index.html painted on a cold start, if the boot script showed it. */
const bootEl = typeof document !== 'undefined' ? document.getElementById('aa-boot') : null;

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
  // The index.html splash being handed over (cold start), and the run id of an in-app splash (resume):
  // each resume gets a new id so its mark plays from the first frame.
  const [boot, setBoot] = useState<HTMLElement | null>(() => (enabled ? bootEl : null));
  const [run, setRun] = useState(() => (enabled && !bootEl ? 1 : 0));
  const showing = !!boot || run > 0;
  const active = useRef(showing);
  active.current = showing;
  const el = useRef<HTMLDivElement>(null);
  const markDone = useRef<() => void>(() => undefined);

  const [revealing, setRevealing] = useState(false);
  useEffect(() => {
    onPhase?.(!showing ? 'off' : revealing ? 'revealing' : 'covered');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showing, revealing]);

  // Not the installed app (or a page the boot script should have skipped): the boot splash never stays.
  useEffect(() => {
    if (!enabled) bootEl?.remove();
  }, [enabled]);

  // Cold start: hand over the splash index.html is already playing.
  useEffect(() => {
    if (!boot) return;
    const done = new Promise<void>((r) => (boot.dataset.done ? r() : boot.addEventListener('aa-boot-done', () => r(), { once: true })));
    // The app has rendered and the main thread is free: start the mark now (see bootScript).
    (window as unknown as { __aaBootPlay?: () => void }).__aaBootPlay?.();
    return revealApp(boot, done, () => setRevealing(true), () => {
      boot.remove();
      setBoot(null);
      setRevealing(false);
    });
  }, [boot]);

  // Resume: the in-app splash.
  useEffect(() => {
    if (!run || !el.current) return;
    const done = new Promise<void>((r) => (markDone.current = r));
    return revealApp(el.current, done, () => setRevealing(true), () => {
      setRun(0);
      setRevealing(false);
    });
  }, [run]);

  useEffect(() => {
    if (!enabled) return;
    const wentAway = () => {
      if (lifecycle.hiddenAt === null) lifecycle.hiddenAt = Date.now();
    };
    const cameBack = () => {
      if (document.visibilityState !== 'visible') return;
      const at = lifecycle.hiddenAt;
      lifecycle.hiddenAt = null;
      // Not a return from the background, or a launch is already showing: nothing to do.
      if (at === null || active.current) return;
      if (Date.now() - at < LAUNCH_RESUME_MS) return;
      active.current = true;
      setRun((r) => r + 1);
    };
    const onVisibility = () => (document.visibilityState === 'hidden' ? wentAway() : cameBack());
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', wentAway);
    window.addEventListener('pageshow', cameBack);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', wentAway);
      window.removeEventListener('pageshow', cameBack);
    };
  }, [enabled]);

  if (!run) return null;
  return (
    <div key={run} ref={el} className="launch-splash">
      <SplashMark onDone={() => markDone.current()} />
      <span className="sr-only" role="status">
        Opening Art and Artist
      </span>
    </div>
  );
}
