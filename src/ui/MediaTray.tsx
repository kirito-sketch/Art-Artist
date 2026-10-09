import { motion } from 'framer-motion';
import { Play, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Media } from '../data/types';
import { moveMedia, removeMedia } from '../domain/mediaSelection';
import { Photo } from './primitives';

/*
 * Selected media as a compact grid (docs/ux-refinement/PLAN.md, Stage 6): order numbers, remove, tap to preview,
 * drag to reorder. Touch needs a short press before a drag starts, so a swipe still scrolls the page. Reordering
 * by keyboard or switch control is Move earlier / Move later in the preview, which is always available.
 * The tray only renders; selection rules live in domain/mediaSelection.ts.
 */
const PRESS_MS = 260;
const SLOP = 8;

export function MediaTray({ items, onChange, onOpen, add, showOrder = items.length > 1, label = 'Selected media' }: {
  items: Media[];
  onChange: (next: Media[]) => void;
  /** Tap a thumbnail: open the preview at that item. */
  onOpen?: (index: number) => void;
  /** The trailing "add more" tile, when there is room. */
  add?: ReactNode;
  showOrder?: boolean;
  label?: string;
}) {
  const grid = useRef<HTMLUListElement>(null);
  const gesture = useRef<{ id: string; x: number; y: number; armed: boolean; moved: boolean; timer?: number } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  // A drag ends with a click on the same button; that click must not also open the preview.
  const dragged = useRef(false);
  const latest = useRef(items);
  latest.current = items;

  // While a drag is armed the page must not scroll under the finger; only a non-passive touchmove can stop that.
  useEffect(() => {
    const el = grid.current;
    if (!el) return;
    const block = (e: TouchEvent) => {
      if (gesture.current?.armed) e.preventDefault();
    };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, []);

  const end = () => {
    if (gesture.current?.timer) window.clearTimeout(gesture.current.timer);
    gesture.current = null;
    setDragging(null);
  };

  return (
    <ul className="mtray" ref={grid} aria-label={label}>
      {items.map((m, i) => (
        <motion.li key={m.id} layout transition={{ type: 'spring', stiffness: 520, damping: 40 }} className={`mtray-item${dragging === m.id ? ' is-dragging' : ''}`} data-tray-id={m.id}>
          <button
            type="button"
            className="mtray-open"
            aria-label={`${m.kind === 'video' ? 'Video' : 'Photo'} ${i + 1} of ${items.length}${onOpen ? '. Preview' : ''}`}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              dragged.current = false;
              const g = { id: m.id, x: e.clientX, y: e.clientY, armed: e.pointerType !== 'touch', moved: false, timer: undefined as number | undefined };
              if (!g.armed)
                g.timer = window.setTimeout(() => {
                  if (gesture.current === g && !g.moved) {
                    g.armed = true;
                    setDragging(g.id);
                    navigator.vibrate?.(8);
                  }
                }, PRESS_MS);
              gesture.current = g;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const g = gesture.current;
              if (!g) return;
              const far = Math.hypot(e.clientX - g.x, e.clientY - g.y) > SLOP;
              if (!g.armed) {
                if (far) end(); // a scroll, not a drag
                return;
              }
              if (!far && !g.moved) return;
              g.moved = true;
              dragged.current = true;
              setDragging(g.id);
              const over = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el instanceof HTMLElement && el.dataset.trayId && el.dataset.trayId !== g.id) as HTMLElement | undefined;
              if (!over) return;
              const to = latest.current.findIndex((x) => x.id === over.dataset.trayId);
              if (to >= 0) onChange(moveMedia(latest.current, g.id, to));
            }}
            onPointerUp={end}
            onPointerCancel={end}
            onClick={() => {
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              onOpen?.(i);
            }}
          >
            <Photo media={m} surface="search-thumbnail" showPlay={false} alt="" />
            {showOrder && <span className="mtray-order" aria-hidden>{i + 1}</span>}
            {m.kind === 'video' && (
              <span className="mtray-video" aria-hidden>
                <Play size={10} fill="currentColor" strokeWidth={0} />
                {m.duration}
              </span>
            )}
          </button>
          <button type="button" className="mtray-remove" aria-label={`Remove ${m.kind === 'video' ? 'video' : 'photo'} ${i + 1}`} onClick={() => onChange(removeMedia(latest.current, m.id))}>
            <X size={13} strokeWidth={2.8} />
          </button>
        </motion.li>
      ))}
      {add && <li className="mtray-item mtray-item--add">{add}</li>}
    </ul>
  );
}
