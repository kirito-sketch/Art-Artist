/*
 * How the normal prototype is presented (not part of Art and Artist itself):
 *   prototype: the phone on a desktop canvas with the persona / QA console beside it.
 *   app:       only the product, filling the viewport (real device, safe areas, Add to Home Screen).
 *
 * Choice order: installed Home Screen app → app (always); ?view=app|prototype (applied and
 * used only for that explicit launch); otherwise app on all viewport sizes. Old stored prototype
 * choices no longer affect ordinary launches. /test and /research never read this.
 */
import { Eye, X } from 'lucide-react';
import { useState } from 'react';

export type ViewMode = 'prototype' | 'app';
const KEY = 'aa_view_mode';

export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

const valid = (v: unknown): v is ViewMode => v === 'prototype' || v === 'app';

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
  return 'app';
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
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f6f4f0');
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
