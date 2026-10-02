import { useEffect, useRef, useState } from 'react';
import { SplashMark } from './SplashMark';

/*
 * The launch splash for the installed Home Screen app (standalone only; Safari is unchanged).
 *
 * iOS often resumes a standalone web app from memory instead of reloading it, so page load and React
 * mount alone miss most launches. Launch is therefore:
 *   - a cold start (this page load), or
 *   - a return to the foreground after at least LAUNCH_RESUME_MS in the background,
 * tracked with visibilitychange, pagehide and pageshow. A short interruption returns straight to the app.
 *
 * The splash is a layer over the app, never a reset: the app stays mounted underneath (navigation,
 * sheets, persona, saved content all kept) and is inert until the splash has finished. One launch plays
 * the splash once: while it is showing, further lifecycle events are ignored.
 */

/** How long the app must be in the background before coming back counts as a new launch. */
export const LAUNCH_RESUME_MS = 45_000;
const FADE_MS = 300;

/** When the app went to the background (module level: survives re-renders, reset by a reload). */
const lifecycle: { hiddenAt: number | null } = { hiddenAt: null };

export function LaunchSplash({ enabled, onActiveChange }: { enabled: boolean; onActiveChange?: (active: boolean) => void }) {
  // Run id: 0 = no splash; each launch gets a new id so the mark replays from its first frame.
  const [run, setRun] = useState(enabled ? 1 : 0);
  const [leaving, setLeaving] = useState(false);
  const active = useRef(enabled);

  useEffect(() => {
    onActiveChange?.(run > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setLeaving(false);
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

  // After the fade, the layer goes; a fallback in case transitionend never fires (Reduce Motion).
  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => {
      active.current = false;
      setRun(0);
      setLeaving(false);
    }, FADE_MS + 100);
    return () => window.clearTimeout(t);
  }, [leaving]);

  if (!run) return null;
  return (
    <div key={run} className={`launch-splash${leaving ? ' is-leaving' : ''}`} aria-hidden={leaving || undefined}>
      <SplashMark onDone={() => setLeaving(true)} />
      <span className="sr-only" role="status">
        Opening Art and Artist
      </span>
    </div>
  );
}
