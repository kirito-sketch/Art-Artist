import type { CSSProperties } from 'react';
import type { Media } from '../../data/types';
import { eligibleFeaturedProjects } from '../../domain/featuredWork';
import { profileCoverPosition, resolveProfileCover } from '../../domain/profileCover';
import type { ProfileCover, Reel } from '../../state/profile';
import { publicName } from '../../state/world';
import { Photo } from '../../ui/primitives';
import { person } from '../../state/selectors';

export function ProfileCoverPicker({ personId, value, onChange, images, reel }: { personId: string; value?: ProfileCover; onChange: (value: ProfileCover) => void; images: Media[]; reel?: Reel }) {
  const projects = eligibleFeaturedProjects(personId).filter((p) => p.artwork);
  const photo = person(personId).photo;
  const portrait: Media | undefined = photo ? { id: `portrait-${personId}`, kind: 'image', src: photo } : undefined;
  const options: { value: ProfileCover; label: string; media?: Media }[] = [
    { value: { kind: 'auto' }, label: 'Automatic · portrait or selected work' },
    ...(portrait ? [{ value: { kind: 'portrait' } as ProfileCover, label: 'Profile portrait', media: portrait }] : []),
    ...(reel && (reel.source?.kind !== 'native' || reel.source.status === 'ready') ? [{ value: { kind: 'showreel' } as ProfileCover, label: 'Showreel poster', media: reel.cover }] : []),
    ...images.filter((m) => m.kind === 'image').map((m, i) => ({ value: { kind: 'portfolio', mediaId: m.id } as ProfileCover, label: `Portfolio image ${i + 1}`, media: m })),
    ...projects.map((p) => ({ value: { kind: 'project', projectId: p.id } as ProfileCover, label: publicName(p), media: p.artwork })),
  ];
  const preview = resolveProfileCover(value, images, projects, reel, portrait);
  const selectionKey = (v: ProfileCover) => JSON.stringify({ ...v, focal: undefined });
  const focal = value?.focal ?? { x: 50, y: value?.kind === 'portrait' || !value || value.kind === 'auto' ? 35 : 50 };
  const changeFocus = (axis: 'x' | 'y', n: number) => onChange({ ...(value ?? { kind: 'auto' }), focal: { ...focal, [axis]: n } });
  return <section className="ana-work-section profile-cover-picker">
    <h2>Profile cover</h2>
    <p className="meta">Choose the image that introduces you. Reposition the crop to keep faces or important work in view. Showreels use a still poster.</p>
    <div className="profile-cover-preview" style={{ '--profile-position': profileCoverPosition(value) } as CSSProperties}>{preview.media ? <Photo key={preview.media.src} media={preview.media} showPlay={false} /> : <span>Made of stories.<br />Defined by your work.</span>}</div>
    {preview.media && <div className="profile-cover-focus"><label>Horizontal focus<input type="range" min="0" max="100" value={focal.x} onChange={(e) => changeFocus('x', Number(e.target.value))} /></label><label>Vertical focus<input type="range" min="0" max="100" value={focal.y} onChange={(e) => changeFocus('y', Number(e.target.value))} /></label></div>}
    <fieldset><legend className="sr-only">Choose profile cover</legend>{options.map((o) => <label key={JSON.stringify(o.value)}>
      <input type="radio" name="profile-cover" checked={selectionKey(value ?? { kind: 'auto' }) === selectionKey(o.value)} onChange={() => onChange(o.value)} />
      {o.media && <Photo media={o.media} showPlay={false} />}<span>{o.label}</span>
    </label>)}</fieldset>
  </section>;
}
