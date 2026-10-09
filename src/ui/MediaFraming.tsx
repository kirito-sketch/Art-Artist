import { useRef, useState, type KeyboardEvent } from 'react';
import type { Media, MediaSurface } from '../data/types';
import { mediaPresentation, presentationRatio, withFraming } from '../domain/mediaPresentation';
import { mediaRatio } from '../domain/mediaLayout';
import { Photo } from './primitives';

/*
 * Reposition (docs/ux-refinement/PLAN.md, Stage 6). Where a surface has a fixed frame that must crop (a round
 * profile photo, an event or project banner), this is the one control: drag the picture, or use the arrow keys on
 * it, to choose what stays in frame, and Reset to centre it. It writes the same nondestructive metadata as before
 * (`media.presentations[surface].focal`); the original file is never changed. Surfaces that show the whole image
 * (Fit) have nothing to reposition, so they get the preview only. Fit/Fill, focus sliders and the content select
 * were removed from the UI; saved values on existing media still render.
 */
const STEP = 5;
const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function MediaFramingEditor({ media, surface, onChange, ratio = presentationRatio(media, surface), title = 'Reposition' }: { media: Media; surface: MediaSurface; onChange: (media: Media) => void; ratio?: number; title?: string }) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>();
  const resolved = dimensions ? { ...media, ...dimensions } : media;
  const policy = mediaPresentation(resolved, surface, ratio);
  const focal = policy.focal ?? { x: 50, y: 50 };
  const drag = useRef<{ x: number; y: number; focal: typeof focal }>();
  const frame = useRef<HTMLDivElement>(null);
  const fill = policy.fit === 'cover';
  // How far the picture overflows the frame on each axis, in px; zero means that axis can't move.
  const overflow = () => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const r = mediaRatio(resolved);
    return { x: Math.max(0, Math.max(rect.width, rect.height * r) - rect.width), y: Math.max(0, Math.max(rect.height, rect.width / r) - rect.height) };
  };
  const set = (next: { x: number; y: number }) => onChange(withFraming(resolved, surface, { fit: 'cover', focal: { x: clamp(next.x), y: clamp(next.y) } }));
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const by = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] }[e.key];
    if (!by) return;
    e.preventDefault();
    const o = overflow();
    set({ x: o.x > 1 ? focal.x + by[0] : focal.x, y: o.y > 1 ? focal.y + by[1] : focal.y });
  };
  const moved = Math.abs(focal.x - 50) > 0.5 || Math.abs(focal.y - 50) > 0.5;

  return (
    <section className="media-framing">
      <h3 className="media-framing-title">{title}</h3>
      <div
        ref={frame}
        className={`media-framing-preview ${fill ? 'is-fill' : ''}`}
        style={{ aspectRatio: ratio, width: `min(100%, 340px, ${55 * ratio}dvh)` }}
        tabIndex={fill ? 0 : undefined}
        role={fill ? 'group' : undefined}
        aria-label={fill ? `${title}. Drag, or use the arrow keys, to choose what stays in frame.` : undefined}
        onKeyDown={fill ? onKeyDown : undefined}
        onPointerDown={(e) => {
          if (!fill) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, focal };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const o = overflow();
          const d = drag.current;
          set({ x: o.x > 1 ? d.focal.x - ((e.clientX - d.x) / o.x) * 100 : focal.x, y: o.y > 1 ? d.focal.y - ((e.clientY - d.y) / o.y) * 100 : focal.y });
        }}
        onPointerUp={() => (drag.current = undefined)}
        onPointerCancel={() => (drag.current = undefined)}
      >
        <Photo
          media={media}
          surface={surface}
          frameRatio={ratio}
          showPlay={false}
          alt={media.alt ?? 'Preview'}
          priority
          onImageLoad={(image) => {
            if (image.src === new URL(media.src, document.baseURI).href && image.naturalWidth && image.naturalHeight) setDimensions((old) => (old?.width === image.naturalWidth && old?.height === image.naturalHeight ? old : { width: image.naturalWidth, height: image.naturalHeight }));
          }}
        />
      </div>
      <p className="meta media-framing-hint">
        {fill ? 'Drag to choose what stays in frame. Your original isn’t changed.' : 'The whole image is shown.'}
        {fill && moved && (
          <>
            {' '}
            <button type="button" className="link" onClick={() => set({ x: 50, y: 50 })}>
              Reset
            </button>
          </>
        )}
      </p>
    </section>
  );
}
