/*
 * How the normal app is presented (not part of Art and Artist itself):
 *   auto:      the default. A viewport that has room for a phone (a laptop, a desktop window, a tablet) shows the app
 *              inside an iPhone frame scaled to fit; a phone-sized viewport shows the app itself, full screen, on the
 *              device's own status bar and safe areas. Decided by viewport size, re-evaluated on resize, never by
 *              user agent.
 *   prototype: auto, plus the development notice and view switch (?view=prototype).
 *   app:       never the frame (?view=app; the installed Home Screen app is always this).
 *
 * Choice order: installed Home Screen app → app; ?view=app|prototype (that launch only); otherwise auto.
 * /test and /research never read this.
 */
import { Eye, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ViewMode = 'prototype' | 'app' | 'auto';
type Explicit = Exclude<ViewMode, 'auto'>;
const KEY = 'aa_view_mode';

export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

const valid = (v: unknown): v is Explicit => v === 'prototype' || v === 'app';

export function saveViewMode(m: ViewMode) {
  try {
    localStorage.setItem(KEY, m);
  } catch {
    /* private mode: the choice lasts for this visit only */
  }
}

export function initialViewMode(): ViewMode {
  if (isStandalone()) return 'app';
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('view');
  if (valid(fromUrl)) {
    saveViewMode(fromUrl);
    params.delete('view');
    const q = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + window.location.hash);
    return fromUrl;
  }
  return 'auto';
}

/** A viewport with room for the frame: wider than any phone held upright, taller than any phone held sideways. */
export const FRAME_QUERY = '(min-width: 600px) and (min-height: 480px)';
/** The frame's outer size: 393 × 852 screen plus a 12 px bezel. */
export const FRAME = { width: 417, height: 876, margin: 24 };

const frameFits = () => typeof window !== 'undefined' && !!window.matchMedia?.(FRAME_QUERY).matches;

/** Whether the app is shown in the device frame, live: resizing a desktop window switches presentations. */
export function useDeviceFrame(mode: ViewMode) {
  const [fits, setFits] = useState(frameFits);
  useEffect(() => {
    if (mode === 'app' || !window.matchMedia) return;
    const mq = window.matchMedia(FRAME_QUERY);
    const on = () => setFits(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [mode]);
  return mode !== 'app' && fits;
}

/** The frame's scale: 1 when the window has room, smaller on short or narrow windows so it never clips. */
export function useFrameScale(framed: boolean) {
  const measure = () => (typeof window === 'undefined' ? 1 : Math.min(1, (window.innerHeight - FRAME.margin * 2) / FRAME.height, (window.innerWidth - FRAME.margin * 2) / (FRAME.width + 8)));
  const [scale, setScale] = useState(measure);
  useEffect(() => {
    if (!framed) return;
    const on = () => setScale(Math.max(0.4, Math.round(measure() * 1000) / 1000));
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [framed]);
  return scale;
}

/** Add to Home Screen support, only for the normal app (never on /test or /research). */
export function installAppHead() {
  const head = document.head;
  const add = (tag: string, attrs: Record<string, string>) => {
    const sel = `${tag}${Object.entries(attrs)
      .filter(([k]) => k === 'rel' || k === 'name')
      .map(([k, v]) => `[${k}="${v}"]`)
      .join('')}`;
    if (head.querySelector(sel)) return;
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    head.appendChild(el);
  };
  add('link', { rel: 'manifest', href: '/manifest.webmanifest' });
  add('link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' });
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-title', content: 'Art and Artist' });
  // "default": a light system status bar above the app, so the clock stays legible on the paper ground.
  add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f3f3f5');
}

/** The two-option switch, as used inside the prototype console. */
export function ViewSwitch({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="vm-switch" role="radiogroup" aria-label="Prototype view">
      {(['prototype', 'app'] as const).map((m) => (
        <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? 'is-on' : ''} onClick={() => onChange(m)}>
          {m === 'prototype' ? 'Prototype' : 'App'}
        </button>
      ))}
    </div>
  );
}

/**
 * Development-only floating control for when the console is not on screen (App mode, or the
 * prototype on a phone). Collapsed to a small tab on the left edge, in the page gutter: clear of the
 * product's Back and header actions (top) and its bottom navigation.
 */
export function FloatingViewSwitch({ mode, onChange, className = '' }: { mode: ViewMode; onChange: (m: ViewMode) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`vm-float ${open ? 'is-open' : ''} ${className}`} data-dev-control>
      {open ? (
        <div className="vm-float-panel" role="group" aria-label="Prototype view (development control)">
          <span className="vm-float-label">View</span>
          <ViewSwitch
            mode={mode}
            onChange={(m) => {
              setOpen(false);
              onChange(m);
            }}
          />
          <button type="button" className="vm-float-close" aria-label="Hide view control" onClick={() => setOpen(false)}>
            <X size={14} aria-hidden />
          </button>
        </div>
      ) : (
        <button type="button" className="vm-float-chip" aria-label="Prototype view (development control)" onClick={() => setOpen(true)}>
          <Eye size={13} aria-hidden /> View
        </button>
      )}
    </div>
  );
}
