import { useRef, useState } from 'react';
import type { Media, MediaSurface, PostPresentation } from '../data/types';
import { mediaPresentation, postFrame, presentationRatio, withFraming } from '../domain/mediaPresentation';
import { mediaRatio } from '../domain/mediaLayout';
import { Photo } from './primitives';

/** Metadata-only editor: dragging has equivalent labelled keyboard controls. */
export function MediaFramingEditor({ media, surface, onChange, ratio = presentationRatio(media, surface), title = 'Adjust framing' }: { media: Media; surface: MediaSurface; onChange: (media: Media) => void; ratio?: number; title?: string }) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>();
  const resolved = dimensions ? { ...media, ...dimensions } : media;
  const policy = mediaPresentation(resolved, surface, ratio);
  const focal = policy.focal ?? { x: 50, y: 50 };
  const drag = useRef<{ x: number; y: number; focal: typeof focal }>();
  const change = (fit = policy.fit, focus = focal) => onChange(withFraming(resolved, surface, { fit, focal: focus }));
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  return <section className="media-framing"><h3>{title}</h3>
    <div className={`media-framing-preview ${policy.fit === 'cover' ? 'is-fill' : ''}`} style={{ aspectRatio: ratio, width: `min(100%, 340px, ${55 * ratio}dvh)` }} onPointerDown={e => {
      if (policy.fit !== 'cover') return;
      e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, focal };
    }} onPointerMove={e => {
      if (!drag.current) return;
      const rect = e.currentTarget.getBoundingClientRect(); const r = mediaRatio(resolved);
      const width = Math.max(rect.width, rect.height * r), height = Math.max(rect.height, rect.width / r);
      change('cover', { x: width - rect.width > 1 ? clamp(drag.current.focal.x - (e.clientX - drag.current.x) / (width - rect.width) * 100) : focal.x, y: height - rect.height > 1 ? clamp(drag.current.focal.y - (e.clientY - drag.current.y) / (height - rect.height) * 100) : focal.y });
    }} onPointerUp={() => { drag.current = undefined; }} onPointerCancel={() => { drag.current = undefined; }}>
      <Photo media={media} surface={surface} frameRatio={ratio} showPlay={false} alt={media.alt ?? 'Framing preview'} priority onImageLoad={image => {
        if (image.src === new URL(media.src, document.baseURI).href && image.naturalWidth && image.naturalHeight) setDimensions(old => old?.width === image.naturalWidth && old?.height === image.naturalHeight ? old : { width: image.naturalWidth, height: image.naturalHeight });
      }} />
    </div>
    <div className="media-framing-controls" role="group" aria-label="Image framing"><button className="chip" aria-pressed={policy.fit === 'contain'} onClick={() => change('contain')}>Fit</button><button className="chip" aria-pressed={policy.fit === 'cover'} onClick={() => change('cover')}>Fill</button></div>
    <p className="meta">{policy.fit === 'contain' ? 'The complete image stays visible.' : 'Drag to reposition, or use the focus controls. This preview crops the view; your original stays unchanged.'}</p>
    {policy.fit === 'cover' && <div className="media-framing-focus"><label>Horizontal focus<input aria-label="Horizontal focus" type="range" min="0" max="100" value={focal.x} onChange={e => change('cover', { ...focal, x: +e.target.value })} /></label><label>Vertical focus<input aria-label="Vertical focus" type="range" min="0" max="100" value={focal.y} onChange={e => change('cover', { ...focal, y: +e.target.value })} /></label></div>}
    <label className="media-content-type">Image content<select aria-label="Image content" value={media.contentType ?? 'photo'} onChange={e => onChange(e.target.value === 'artwork' ? withFraming({ ...media, contentType: 'artwork' }, surface, { fit: 'contain', focal }) : { ...media, contentType: e.target.value as Media['contentType'] })}><option value="photo">Photography / still</option><option value="portrait">Portrait</option><option value="artwork">Artwork / poster with text</option></select></label>
  </section>;
}
export function PostFramingEditor({ media, presentation, onMediaChange, onPresentationChange }: { media: Media[]; presentation: PostPresentation; onMediaChange: (media: Media[]) => void; onPresentationChange: (choice: PostPresentation) => void }) {
  const [index, setIndex] = useState(0); const active = Math.min(index, media.length - 1);
  if (!media[active]) return null;
  return <div className="stack"><div className="media-framing-controls" role="group" aria-label="Post presentation">{(['original', 'portrait', 'square', 'landscape'] as const).map(choice => <button key={choice} className="chip" aria-pressed={presentation === choice} onClick={() => onPresentationChange(choice)}>{choice[0].toUpperCase() + choice.slice(1)}</button>)}</div>
    {media.length > 1 && <><p className="meta">One frame for the set. Adjust each image separately.</p><div className="media-framing-controls" role="group" aria-label="Choose image to frame">{media.map((m,i) => <button key={m.id} className="chip" aria-pressed={i === active} onClick={() => setIndex(i)}>Image {i + 1}</button>)}</div></>}
    <MediaFramingEditor key={media[active].id} media={media[active]} surface="post" ratio={postFrame(media, presentation)} onChange={next => onMediaChange(media.map((m,i) => i === active ? next : m))} />
  </div>;
}
