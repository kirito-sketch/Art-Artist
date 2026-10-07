import { ProfileHeroMedia } from './ProfileHeroMedia';
import { useEffect, useRef, useState } from 'react';
import type { Media } from '../../data/types';
import { eligibleFeaturedProjects } from '../../domain/featuredWork';
import { resolveProfileCover } from '../../domain/profileCover';
import type { ProfileCover, Reel } from '../../state/profile';
import { publicName } from '../../state/world';
import { Photo } from '../../ui/primitives';
import { person } from '../../state/selectors';
import { mediaType } from '../../domain/mediaLayout';

export function ProfileCoverPicker({ personId, value, onChange, images, reel }: { personId: string; value?: ProfileCover; onChange: (value: ProfileCover) => void; images: Media[]; reel?: Reel }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState('393 / 852');
  useEffect(() => {
    const phone = previewRef.current?.closest<HTMLElement>('.phone');
    if (!phone) return;
    const observer = new ResizeObserver(() => { if (phone.clientWidth && phone.clientHeight) setAspectRatio(`${phone.clientWidth} / ${phone.clientHeight}`); });
    observer.observe(phone);
    return () => observer.disconnect();
  }, []);
  const projects = eligibleFeaturedProjects(personId).filter((p) => p.artwork);
  const profile = person(personId);
  const photo = profile.photo;
  const portrait: Media | undefined = photo ? { id: `portrait-${personId}`, kind: 'image', src: photo, contentType: 'portrait', width: 480, height: 600 } : undefined;
  const options: { value: ProfileCover; label: string; media?: Media }[] = [
    { value: { kind: 'auto' }, label: 'Automatic · portrait or selected work' },
    ...(portrait ? [{ value: { kind: 'portrait' } as ProfileCover, label: 'Profile portrait', media: portrait }] : []),
    ...(reel && (reel.source?.kind !== 'native' || reel.source.status === 'ready') ? [{ value: { kind: 'showreel' } as ProfileCover, label: 'Showreel poster', media: reel.cover }] : []),
    ...images.filter((m) => m.kind === 'image').map((m, i) => ({ value: { kind: 'portfolio', mediaId: m.id } as ProfileCover, label: `Portfolio image ${i + 1}`, media: m })),
    ...projects.map((p) => ({ value: { kind: 'project', projectId: p.id } as ProfileCover, label: publicName(p), media: p.artwork })),
  ];
  const preview = resolveProfileCover(value, images, projects, reel, portrait);
  const selectionKey = (v: ProfileCover) => JSON.stringify({ ...v, focal: undefined, framing: undefined, identityRegion: undefined });
  const focal = value?.focal ?? preview.media?.focal ?? { x: 50, y: preview.media && mediaType(preview.media) === 'portrait' ? 25 : 50 };
  const changeFocus = (axis: 'x' | 'y', n: number) => onChange({ ...(value ?? { kind: 'auto' }), focal: { ...focal, [axis]: n } });
  return <section className="ana-work-section profile-cover-picker">
    <h2>Profile cover</h2>
    <p className="meta">Choose the image that introduces you. Mark the subject with the focus controls. The crop keeps it toward the clear upper image where possible. Check the preview before saving. Showreels use a still poster.</p>
    <div ref={previewRef} style={{ aspectRatio }} className={`profile-cover-preview profile-framing-preview profile-framing-preview--${value?.identityRegion === 'centre-lower' ? 'centre-lower' : 'lower'}`}>
      {preview.media ? <ProfileHeroMedia key={preview.media.src} media={preview.media} focal={value?.focal ?? preview.media.focal} /> : <span>Made of stories.<br />Defined by your work.</span>}
      <div className="framing-nav" aria-hidden>← <span>↗ ···</span></div>
      <div className="framing-identity" aria-hidden><strong>{profile.name}</strong><span>{profile.role}</span><small>{profile.city} · {profile.languages?.join(', ')}</small><span className="framing-cta">Edit profile</span></div>
      <small className="framing-scroll" aria-hidden>Explore work ↓</small>
    </div>
    <div className="profile-cover-focus"><label>Identity placement<select aria-label="Identity placement" value={value?.identityRegion === 'centre-lower' ? 'centre-lower' : 'lower'} onChange={e => onChange({ ...(value ?? { kind: 'auto' }), framing: 'immersive', identityRegion: e.target.value as 'lower' | 'centre-lower' })}><option value="lower">Lower-middle (recommended)</option><option value="centre-lower">Slightly higher</option></select></label></div>
    {preview.media && <div className="profile-cover-focus"><label>Horizontal focus<input type="range" min="0" max="100" value={focal.x} onChange={(e) => changeFocus('x', Number(e.target.value))} /></label><label>Vertical focus<input type="range" min="0" max="100" value={focal.y} onChange={(e) => changeFocus('y', Number(e.target.value))} /></label></div>}
    <fieldset><legend className="sr-only">Choose profile cover</legend>{options.map((o) => <label key={JSON.stringify(o.value)}>
      <input type="radio" name="profile-cover" checked={selectionKey(value ?? { kind: 'auto' }) === selectionKey(o.value)} onChange={() => onChange({ ...o.value, framing: 'immersive', identityRegion: value?.identityRegion === 'centre-lower' ? 'centre-lower' : 'lower' })} />
      {o.media && <Photo media={o.media} showPlay={false} />}<span>{o.label}</span>
    </label>)}</fieldset>
  </section>;
}
