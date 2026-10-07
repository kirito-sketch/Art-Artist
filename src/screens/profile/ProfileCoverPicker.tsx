import type { Media } from '../../data/types';
import { eligibleFeaturedProjects } from '../../domain/featuredWork';
import { resolveProfileCover } from '../../domain/profileCover';
import type { ProfileCover, Reel } from '../../state/profile';
import { publicName } from '../../state/world';
import { Photo } from '../../ui/primitives';

export function ProfileCoverPicker({ personId, value, onChange, images, reel }: { personId: string; value?: ProfileCover; onChange: (value: ProfileCover) => void; images: Media[]; reel?: Reel }) {
  const projects = eligibleFeaturedProjects(personId).filter((p) => p.artwork);
  const options: { value: ProfileCover; label: string; media?: Media }[] = [
    { value: { kind: 'auto' }, label: 'Automatic · selected professional work' },
    ...(reel && (reel.source?.kind !== 'native' || reel.source.status === 'ready') ? [{ value: { kind: 'showreel' } as ProfileCover, label: 'Showreel poster', media: reel.cover }] : []),
    ...images.filter((m) => m.kind === 'image').map((m, i) => ({ value: { kind: 'portfolio', mediaId: m.id } as ProfileCover, label: `Portfolio image ${i + 1}`, media: m })),
    ...projects.map((p) => ({ value: { kind: 'project', projectId: p.id } as ProfileCover, label: publicName(p), media: p.artwork })),
  ];
  const preview = resolveProfileCover(value, images, projects, reel);
  return <section className="ana-work-section profile-cover-picker">
    <h2>Profile cover</h2>
    <p className="meta">Introduce yourself through your work. Showreels use a still poster and play only when tapped. This does not add a credit.</p>
    <div className="profile-cover-preview">{preview.media ? <Photo media={preview.media} showPlay={false} /> : <span>Made of stories.<br />Defined by your work.</span>}</div>
    <fieldset><legend className="sr-only">Choose profile cover</legend>{options.map((o) => <label key={JSON.stringify(o.value)}>
      <input type="radio" name="profile-cover" checked={JSON.stringify(value ?? { kind: 'auto' }) === JSON.stringify(o.value)} onChange={() => onChange(o.value)} />
      {o.media && <Photo media={o.media} showPlay={false} />}<span>{o.label}</span>
    </label>)}</fieldset>
  </section>;
}
