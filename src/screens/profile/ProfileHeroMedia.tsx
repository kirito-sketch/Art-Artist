import { useState } from 'react';
import type { Media } from '../../data/types';
import { mediaRatio, mediaType } from '../../domain/mediaLayout';
import { Photo } from '../../ui/primitives';

/** Shared by the real hero and framing preview; real upload dimensions replace legacy defaults. */
export function ProfileHeroMedia({ media, focal, safe, className, alt = '' }: { media: Media; focal?: Media['focal']; safe: boolean; className?: string; alt?: string }) {
  const [ratio, setRatio] = useState(media.width && media.height ? mediaRatio(media) : undefined);
  const fit = !safe ? 'cover' : mediaType(media) === 'portrait' && ratio !== undefined && ratio >= .7 ? 'cover' : 'contain';
  return <Photo media={media} focal={focal} className={className} alt={alt} showPlay={false} imageFit={fit} onImageLoad={image => {
    if (image.naturalWidth && image.naturalHeight) setRatio(image.naturalWidth / image.naturalHeight);
  }} />;
}
