import { useEffect, useRef, useState } from 'react';
import { deliveredMedia, mediaPresentation } from '../../domain/mediaPresentation';
import type { Media } from '../../data/types';
import { mediaType } from '../../domain/mediaLayout';
import { profileHeroCrop, protectedHeroFrame } from '../../domain/profileHeroCrop';
import { Photo } from '../../ui/primitives';

/** Shared by the real hero and framing preview; real upload dimensions replace legacy defaults. */
export function ProfileHeroMedia({ media, focal, safeBottom, subjectHeight, showSubjectRegion = false, onProtectionChange, className = '', alt = '' }: { media: Media; focal?: Media['focal']; safeBottom?: number; subjectHeight?: number; showSubjectRegion?: boolean; onProtectionChange?: (fits: boolean) => void; className?: string; alt?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [deliveredSource, setDeliveredSource] = useState(media.src);
  const asset = deliveredMedia(media, deliveredSource);
  const [image, setImage] = useState({ width: media.width ?? 0, height: media.height ?? 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setViewport(previous => previous.width === node.clientWidth && previous.height === node.clientHeight ? previous : { width: node.clientWidth, height: node.clientHeight }));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const focus = focal ?? media.presentations?.['profile-hero']?.focal ?? media.focal ?? { x: 50, y: mediaType(asset) === 'portrait' ? 25 : 50 };
  const crop = profileHeroCrop(image, viewport, focus);
  const regionHeight = subjectHeight ?? (mediaType(asset) === 'portrait' ? 26 : 20);
  const regionWidth = mediaType(asset) === 'portrait' ? 36 : Math.min(36, regionHeight * image.height / (image.width || 1));
  const frame = protectedHeroFrame(image, viewport, focus, safeBottom ?? viewport.height * .62, regionHeight, regionWidth);
  const preserve = mediaPresentation(asset, 'profile-hero').fit === 'contain';
  useEffect(() => { if (frame) onProtectionChange?.(!preserve && frame.protected); }, [frame?.protected, preserve, onProtectionChange]);
  return <div ref={ref} className={`profile-hero-media ${frame && !preserve ? 'profile-hero-media--framed' : ''} ${className}`} data-subject-protected={preserve ? false : frame?.protected} data-composition-preserved={preserve} style={frame && !preserve ? { '--hero-image-width': `${frame.width}px`, '--hero-image-height': `${frame.height}px`, '--hero-image-x': `${frame.x}px`, '--hero-image-y': `${frame.y}px` } as import('react').CSSProperties : undefined}><Photo media={media} focal={crop} alt={alt} showPlay={false} surface="profile-hero" imageFit={preserve ? 'contain' : 'cover'} priority onImageLoad={loaded => {
    setDeliveredSource(loaded.src === new URL(media.src, document.baseURI).href ? media.src : media.fallback ?? loaded.src);
    if (loaded.naturalWidth && loaded.naturalHeight) setImage(previous => previous.width === loaded.naturalWidth && previous.height === loaded.naturalHeight ? previous : { width: loaded.naturalWidth, height: loaded.naturalHeight });
  }} />{showSubjectRegion && frame && !preserve && <span className={`profile-subject-guide ${frame.protected ? '' : 'profile-subject-guide--overlap'}`} aria-hidden style={{ left: frame.x + frame.width * (focus.x - regionWidth / 2) / 100, top: frame.y + frame.height * (focus.y - regionHeight / 2) / 100, width: frame.width * regionWidth / 100, height: frame.height * regionHeight / 100 }} />}</div>;
}
