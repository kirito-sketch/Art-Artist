/*
 * The Art and Artist splash mark: geometry, markup and playback, with no React and no dependency, so the
 * same code runs inside the app (src/ui/SplashMark.tsx) and inlined into index.html for the installed
 * app's first paint (vite.config.ts, launchSplashHtml). Styles: src/styles/splash.css (inlined too).
 *
 * The mark is drawn the way it was painted: a brush follows the stroke from the inner tip, over the apex,
 * down and across the crossbar to the tail; the red drop lands; the mark settles. About 1.35s.
 *
 * Paths are traced from design/logo-original.png (80 x 81, the proportions of images/brand/logo.png).
 * The finished frame is exactly the traced logo: the brush is clipped to the logo's outline (a static
 * clip; nothing animates inside a mask or clip, which WebKit does not always repaint), the true fill
 * then fades in over it and the brush is removed, so no doubled edge remains.
 */

/** When the intro completes, measured from when it starts playing (Reduce Motion: 600ms). */
export const SPLASH_MARK_MS = 1350;

const STROKE = 'M54.57 80.49C53.99 80.15 53.96 79.27 54.49 78.16C54.70 77.72 54.95 77.03 55.04 76.65C55.14 76.27 55.36 75.65 55.55 75.29C55.74 74.93 55.94 74.41 56.01 74.14C56.07 73.87 56.32 73.25 56.55 72.75C56.79 72.25 57.04 71.60 57.10 71.30C57.17 71.00 57.37 70.48 57.56 70.15C57.74 69.82 57.94 69.33 58.01 69.05C58.08 68.78 58.27 68.26 58.45 67.90C58.63 67.54 58.83 67.00 58.90 66.70C58.96 66.40 59.22 65.74 59.46 65.24C59.70 64.74 59.97 63.99 60.06 63.57C60.14 63.14 60.37 62.46 60.56 62.05C60.75 61.64 60.97 60.97 61.06 60.55C61.15 60.13 61.36 59.47 61.55 59.07C61.73 58.67 61.95 58.03 62.04 57.63C62.13 57.24 62.33 56.56 62.49 56.12C62.65 55.68 62.86 54.88 62.95 54.34C63.04 53.79 63.27 52.75 63.46 52.02C63.91 50.29 64.04 48.96 63.97 46.80C63.91 44.82 63.84 44.54 63.16 43.51C62.59 42.67 62.17 42.34 61.10 41.92C59.59 41.31 58.58 41.16 56.95 41.29C56.18 41.34 55.20 41.49 54.77 41.60C54.34 41.71 53.41 41.89 52.69 42.00C51.78 42.14 51.17 42.29 50.69 42.50C50.31 42.67 49.58 42.90 49.07 43.01C48.56 43.12 47.84 43.36 47.45 43.55C47.06 43.73 46.46 43.96 46.10 44.05C45.74 44.14 45.22 44.34 44.94 44.50C44.65 44.66 44.14 44.86 43.79 44.95C43.44 45.04 42.86 45.29 42.50 45.50C42.14 45.71 41.67 45.93 41.45 46.00C41.23 46.07 40.81 46.26 40.52 46.42C40.24 46.58 39.72 46.82 39.39 46.95C39.05 47.09 38.57 47.33 38.31 47.49C38.06 47.65 37.65 47.86 37.40 47.96C37.15 48.06 36.76 48.26 36.53 48.42C36.30 48.58 35.81 48.84 35.44 49.00C35.08 49.17 34.66 49.39 34.51 49.49C34.36 49.60 33.90 49.86 33.49 50.08C32.51 50.59 31.65 51.11 31.10 51.53C30.85 51.72 30.43 51.99 30.15 52.13C29.88 52.27 29.27 52.66 28.80 52.99C28.33 53.32 27.70 53.76 27.40 53.96C26.63 54.48 24.30 56.22 23.99 56.51C23.42 57.05 22.42 57.91 21.90 58.31C21.60 58.55 20.72 59.35 19.95 60.10C19.18 60.84 18.10 61.83 17.56 62.30C17.01 62.77 16.14 63.53 15.61 64.00C13.01 66.31 12.37 66.72 9.95 67.61C9.62 67.73 9.17 67.79 8.64 67.80C7.86 67.80 7.79 67.78 6.82 67.29C5.72 66.74 4.63 65.74 4.21 64.91C3.63 63.79 3.80 60.39 4.55 58.10C4.68 57.69 4.86 56.90 4.96 56.35C5.05 55.80 5.28 54.93 5.47 54.41C5.66 53.89 5.90 53.06 6.00 52.56C6.11 52.06 6.31 51.36 6.45 51.01C6.60 50.66 6.82 49.88 6.95 49.29C7.09 48.69 7.33 47.88 7.50 47.50C7.67 47.11 7.89 46.40 8.00 45.92C8.10 45.44 8.34 44.66 8.53 44.20C8.72 43.73 8.96 42.99 9.05 42.55C9.15 42.11 9.37 41.46 9.55 41.10C9.73 40.74 9.93 40.20 10.00 39.90C10.07 39.60 10.28 39.05 10.46 38.68C10.64 38.32 10.87 37.71 10.96 37.33C11.05 36.96 11.29 36.29 11.50 35.84C11.70 35.39 11.93 34.79 12.00 34.49C12.07 34.19 12.25 33.70 12.41 33.39C12.56 33.08 12.79 32.52 12.91 32.14C13.03 31.76 13.27 31.18 13.45 30.85C13.63 30.52 13.86 29.96 13.95 29.60C14.04 29.24 14.29 28.64 14.50 28.25C14.71 27.86 14.95 27.30 15.04 27.00C15.21 26.42 15.66 25.42 16.42 23.94C16.68 23.43 16.96 22.75 17.04 22.43C17.13 22.11 18.40 19.45 19.88 16.50C22.86 10.57 23.62 9.16 24.47 7.95C24.62 7.73 25.05 7.08 25.42 6.50C25.80 5.92 26.29 5.22 26.53 4.95C26.76 4.67 27.09 4.25 27.25 4.01C28.07 2.80 30.26 1.37 31.30 1.37C31.97 1.37 33.27 1.91 33.72 2.37C34.23 2.92 34.85 3.88 35.04 4.44C35.13 4.70 35.36 5.22 35.55 5.58C35.74 5.95 35.96 6.57 36.05 6.95C36.14 7.33 36.34 8.02 36.50 8.47C36.66 8.92 36.89 9.75 37.00 10.32C37.11 10.88 37.36 11.82 37.54 12.40C37.73 12.98 37.93 13.81 38.00 14.25C38.18 15.54 38.30 16.09 38.60 17.06C38.76 17.56 38.92 18.21 38.95 18.51C39.05 19.35 39.20 20.08 39.47 21.00C39.60 21.47 39.80 22.43 39.91 23.15C40.02 23.87 40.26 25.00 40.45 25.67C40.64 26.34 40.84 27.19 40.90 27.57C41.22 29.72 41.32 30.23 41.56 31.05C41.75 31.68 41.84 32.25 41.87 32.95C41.93 34.21 41.75 34.61 40.81 35.33C40.06 35.90 39.74 35.93 39.09 35.51C38.38 35.04 38.25 34.89 37.78 34.10C37.12 33.01 37.11 32.98 36.94 32.13C36.85 31.70 36.65 31.05 36.49 30.68C36.33 30.31 36.11 29.55 35.99 28.99C35.88 28.42 35.72 27.81 35.64 27.61C35.44 27.14 35.16 25.96 34.95 24.75C34.85 24.20 34.64 23.39 34.48 22.95C34.32 22.51 34.12 21.70 34.04 21.15C33.96 20.60 33.81 19.88 33.70 19.55C33.37 18.50 33.12 17.48 32.96 16.55C32.77 15.42 32.02 13.57 31.60 13.17C31.36 12.96 31.20 12.90 30.83 12.90C30.39 12.90 30.32 12.94 29.84 13.44C29.56 13.74 29.04 14.45 28.69 15.01C28.34 15.56 27.90 16.25 27.71 16.54C27.22 17.27 25.12 21.45 24.95 22.04C24.87 22.31 24.67 22.74 24.50 23.00C24.34 23.26 24.11 23.73 24.00 24.06C23.90 24.38 23.41 25.44 22.92 26.40C22.43 27.36 21.98 28.38 21.91 28.65C21.81 29.09 21.23 30.38 20.55 31.70C20.42 31.95 20.20 32.51 20.05 32.95C19.90 33.39 19.63 34.00 19.45 34.30C19.27 34.60 19.04 35.14 18.95 35.50C18.86 35.86 18.57 36.60 18.31 37.15C17.37 39.09 17.12 39.65 17.01 40.14C16.94 40.40 16.74 40.93 16.55 41.30C16.36 41.68 16.13 42.29 16.04 42.67C15.95 43.04 15.72 43.68 15.53 44.09C15.35 44.50 15.11 45.19 15.00 45.62C14.89 46.05 14.67 46.72 14.50 47.10C14.33 47.49 14.10 48.21 14.00 48.72C13.89 49.22 13.69 49.87 13.56 50.15C13.23 50.88 13.16 51.26 13.30 51.60C13.56 52.24 14.32 52.20 15.50 51.50C15.86 51.29 16.27 51.07 16.41 51.01C16.55 50.96 17.01 50.70 17.43 50.43C17.84 50.17 18.51 49.77 18.91 49.55C19.31 49.33 19.93 48.95 20.29 48.72C20.65 48.48 21.12 48.19 21.33 48.09C21.53 47.98 22.04 47.68 22.45 47.42C23.15 46.98 23.62 46.69 25.05 45.82C25.38 45.63 26.05 45.26 26.55 45.00C27.53 44.50 28.23 44.09 29.13 43.48C29.45 43.26 29.89 43.02 30.12 42.94C30.35 42.86 30.75 42.66 31.00 42.50C31.25 42.34 31.70 42.12 32.00 42.00C32.30 41.88 32.75 41.66 33.00 41.50C33.25 41.34 33.70 41.12 34.00 41.00C34.30 40.88 34.75 40.66 35.00 40.50C35.25 40.34 35.70 40.12 36.00 40.00C36.30 39.88 36.75 39.66 37.00 39.50C37.25 39.34 37.70 39.12 38.00 39.00C38.30 38.88 38.79 38.63 39.10 38.45C39.40 38.26 39.96 38.01 40.35 37.89C40.73 37.77 41.23 37.58 41.45 37.45C41.67 37.32 42.14 37.12 42.50 37.00C42.86 36.87 43.32 36.69 43.53 36.58C43.74 36.48 44.40 36.21 45.00 36.00C45.60 35.79 46.27 35.52 46.50 35.40C46.72 35.29 47.34 35.08 47.86 34.95C48.38 34.81 49.04 34.58 49.32 34.44C49.59 34.30 50.21 34.10 50.70 34.00C51.18 33.89 51.78 33.71 52.04 33.61C52.68 33.33 53.04 33.24 54.70 32.96C55.50 32.82 56.42 32.61 56.75 32.50C57.68 32.18 58.09 32.11 59.99 31.93C63.29 31.64 64.74 31.65 67.95 32.00C68.85 32.10 69.06 32.16 69.98 32.63C70.55 32.92 71.38 33.44 71.83 33.80C72.61 34.42 72.68 34.51 73.17 35.50C73.88 36.94 73.94 37.28 73.87 39.51C73.81 41.14 73.77 41.48 73.55 42.16C73.41 42.60 73.20 43.47 73.09 44.12C72.90 45.30 72.79 45.68 72.41 46.51C72.30 46.76 72.14 47.29 72.05 47.69C71.97 48.08 71.75 48.70 71.57 49.07C71.38 49.45 71.15 50.06 71.06 50.45C70.96 50.84 70.69 51.59 70.44 52.12C70.20 52.66 70.00 53.15 70.00 53.23C70.00 53.30 69.82 53.73 69.60 54.18C69.39 54.63 69.16 55.19 69.10 55.42C69.03 55.66 68.79 56.21 68.55 56.65C68.31 57.09 68.05 57.69 67.96 57.99C67.87 58.29 67.67 58.74 67.50 59.00C67.33 59.26 67.13 59.69 67.05 59.96C66.97 60.23 66.07 62.11 65.06 64.14C64.04 66.17 63.13 68.06 63.04 68.34C62.95 68.62 62.71 69.14 62.50 69.50C62.29 69.86 62.07 70.33 62.00 70.55C61.94 70.77 60.91 72.90 59.72 75.29C57.29 80.17 57.48 79.91 56.03 80.36C55.19 80.62 54.85 80.65 54.57 80.49Z';
const DROP = 'M47.44 75.30C47.18 75.20 47.04 74.78 46.96 73.90C46.93 73.54 46.73 72.64 46.51 71.89C46.30 71.14 46.07 70.20 46.00 69.79C45.93 69.38 45.70 68.56 45.49 67.96C45.27 67.37 45.03 66.57 44.96 66.20C44.88 65.83 44.68 65.26 44.52 64.93C44.35 64.61 44.14 64.07 44.05 63.74C43.95 63.42 43.73 62.88 43.54 62.55C43.36 62.22 43.12 61.62 43.01 61.22C42.90 60.82 42.67 60.26 42.50 59.98C42.33 59.71 42.10 59.26 42.00 59.00C41.90 58.74 41.67 58.29 41.50 58.02C41.33 57.74 41.10 57.18 40.99 56.78C40.88 56.38 40.63 55.77 40.44 55.43C40.03 54.69 39.50 53.04 39.50 52.49C39.50 52.28 39.64 51.73 39.80 51.28C40.06 50.58 40.20 50.35 40.73 49.82C43.05 47.47 46.61 46.32 49.27 47.06C49.89 47.23 51.10 48.15 51.53 48.77C51.94 49.36 52.55 50.83 52.74 51.70C53.30 54.14 53.13 60.61 52.45 62.65C52.31 63.09 52.12 63.92 52.04 64.50C51.95 65.08 51.75 65.93 51.59 66.40C51.17 67.58 51.00 68.20 51.00 68.55C51.00 68.83 50.90 69.13 50.32 70.70C50.21 71.00 50.07 71.43 50.01 71.65C49.95 71.87 49.73 72.35 49.50 72.72C49.28 73.08 49.01 73.64 48.89 73.95C48.69 74.48 47.96 75.41 47.74 75.39C47.69 75.39 47.55 75.35 47.44 75.30Z';
/**
 * The brush's centreline, in painting order: a narrow lead-in from the inner tip to the apex (narrow so it
 * does not uncover the crossbar just below the tip), then the main stroke.
 */
const LEAD = 'M39.9 33.4 L36 18 L32.5 6.5 L30.5 3.2';
const GESTURE = 'M30.5 3.2 L28 5 L18 30 L8.5 56 L7 63 L13 60 L27 51 L40 43.5 L54 37 L66 33.5 L70.5 35.5 L71 41 L63 60 L55 80.5';

const BRUSH = 'pathLength="1" fill="none" stroke="#29313a" stroke-linecap="round" stroke-linejoin="round"';

/** The mark as static SVG markup. Built once per mount, never per frame. */
export function splashSvg(clipId: string): string {
  return (
    `<svg class="splash-mark" viewBox="0 0 80 81" width="72" height="73" preserveAspectRatio="xMidYMid meet" overflow="visible" aria-hidden="true" focusable="false">` +
    `<defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><path d="${STROKE}"/></clipPath></defs>` +
    `<g class="splash-mark-brush" clip-path="url(#${clipId})">` +
    `<path class="splash-mark-draw splash-mark-lead" d="${LEAD}" stroke-width="8" ${BRUSH}/>` +
    `<path class="splash-mark-draw" d="${GESTURE}" stroke-width="13" ${BRUSH}/>` +
    `</g>` +
    `<path class="splash-mark-fill" d="${STROKE}" fill="#29313a"/>` +
    `<path class="splash-mark-drop" d="${DROP}" fill="#b44534"/>` +
    `</svg>`
  );
}

/**
 * Plays a mark: starts only once the page is visible and the main thread is free (so the first frames are
 * never skipped, behind the iOS launch screen or under the app's start-up work), pauses while the page
 * is hidden, and calls
 * onDone when the final animation actually ends (not on a timer, which drifts from the animation when
 * the first frames are slow). Self-contained: index.html inlines its source. Returns a cleanup.
 */
export function playSplashMark(svg: Element, onDone?: () => void): () => void {
  let done = false;
  let playing = false;
  let raf = 0;
  const finish = () => {
    if (done) return;
    done = true;
    if (onDone) onDone();
  };
  const onEnd = (e: Event) => {
    const name = (e as AnimationEvent).animationName;
    if (e.target === svg && (name === 'splash-settle' || name === 'splash-reduced')) finish();
  };
  const begin = () => {
    raf = 0;
    playing = true;
    svg.classList.add('is-playing');
    // Animations unavailable in this browser: the mark is already in its finished state.
    if (typeof svg.getAnimations === 'function' && svg.getAnimations().length === 0) finish();
  };
  // Start on the first two consecutive smooth frames (the main thread is free, so the brush, which draws
  // on the main thread, will not stall), or after 800ms of busy frames on a slow device.
  const start = () => {
    if (playing || raf || document.visibilityState !== 'visible') return;
    let last = 0;
    let calm = 0;
    let waited = 0;
    const step = (t: number) => {
      if (last) {
        const d = t - last;
        waited += d;
        calm = d < 25 ? calm + 1 : 0;
      }
      last = t;
      if (calm >= 2 || waited > 800) begin();
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  const onVisibility = () => {
    const hidden = document.visibilityState !== 'visible';
    svg.classList.toggle('is-paused', hidden);
    if (hidden && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    start();
  };
  svg.addEventListener('animationend', onEnd);
  document.addEventListener('visibilitychange', onVisibility);
  onVisibility();
  return () => {
    cancelAnimationFrame(raf);
    svg.removeEventListener('animationend', onEnd);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

/**
 * Inline boot script for index.html. On a Home Screen (standalone) launch of the normal app, shows the
 * splash that index.html already contains, so its ground is the very first thing painted. The mark starts
 * when the app has finished its first render (window.__aaBootPlay, called by LaunchSplash), because the
 * brush draw runs on the main thread and would freeze while the app's JavaScript is still evaluating;
 * if the app never calls it, the page load event starts it. Every other page (Safari, /test, /research,
 * internal tools) removes the splash before the first paint.
 */
export function bootScript(): string {
  return `(function(){var d=document,b=d.getElementById('aa-boot');if(!b)return;var q=new URLSearchParams(location.search),p=location.pathname.replace(/\\/+$/,'');var sa=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;var app=!/\\/(test|research)$/.test(p)&&!['test','dashboard','research','admin','lab','scenario','specimen','motion'].some(function(k){return q.has(k)});if(!sa||!app){b.parentNode.removeChild(b);return}d.documentElement.classList.add('aa-launch');var play=${playSplashMark.toString()};var go=function(){if(go.on)return;go.on=1;play(b.querySelector('svg'),function(){b.setAttribute('data-done','1');b.dispatchEvent(new Event('aa-boot-done'))})};window.__aaBootPlay=go;addEventListener('load',go)})();`;
}

/** The boot splash markup for index.html (hidden unless the boot script shows it). */
export function bootSplashHtml(): string {
  return `<div id="aa-boot" class="launch-splash">${splashSvg('aa-boot-clip')}<span class="sr-only" role="status">Opening Art and Artist</span></div>`;
}
