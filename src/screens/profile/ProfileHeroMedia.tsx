import { useEffect, useRef, useState } from 'react';
import type { Media } from '../../data/types';
import { mediaType } from '../../domain/mediaLayout';
import { profileHeroCrop } from '../../domain/profileHeroCrop';
import { Photo } from '../../ui/primitives';

/** Shared by the real hero and framing preview; real upload dimensions replace legacy defaults. */
export function ProfileHeroMedia({ media, focal, className = '', alt = '' }: { media: Media; focal?: Media['focal']; className?: string; alt?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState({ width: media.width ?? 0, height: media.height ?? 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setViewport(previous => previous.width === node.clientWidth && previous.height === node.clientHeight ? previous : { width: node.clientWidth, height: node.clientHeight }));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const focus = focal ?? media.focal ?? { x: 50, y: mediaType(media) === 'portrait' ? 25 : 50 };
  const crop = profileHeroCrop(image, viewport, focus);
  const closePortrait = mediaType(media) === 'portrait' && image.height > 0 && image.width / image.height >= .7;
  return <div ref={ref} className={`profile-hero-media ${closePortrait ? 'profile-hero-media--close' : ''} ${className}`}><Photo media={media} focal={crop} alt={alt} showPlay={false} imageFit="cover" onImageLoad={loaded => {
    if (loaded.naturalWidth && loaded.naturalHeight) setImage(previous => previous.width === loaded.naturalWidth && previous.height === loaded.naturalHeight ? previous : { width: loaded.naturalWidth, height: loaded.naturalHeight });
  }} /></div>;
}
