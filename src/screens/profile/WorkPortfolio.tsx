import { MediaFramingEditor } from '../../ui/MediaFraming';
import { ArrowDown, ArrowUp, Check, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import { craftProfile } from '../../data/profileSchema';
import type { Media } from '../../data/types';
import { eligibleFeaturedProjects, featuredWorkOf, safeWorkUrl } from '../../domain/featuredWork';
import { publicName, project } from '../../state/world';
import { profileOf, type FeaturedWork, type ProfileCover, type Reel } from '../../state/profile';
import { ProfileCoverPicker } from './ProfileCoverPicker';
import { person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { Button, IconButton, Photo, Row, SectionHeader } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { MediaPicker } from '../../ui/MediaPicker';
import { ShowreelManager } from './Showreel';

const move = <T,>(items: T[], index: number, change: number) => {
  const next = [...items]; const [item] = next.splice(index, 1); next.splice(Math.max(0, Math.min(next.length, index + change)), 0, item); return next;
};

export function FeaturedWorkSection({ personId, links = [] }: { personId: string; links?: { id: string; label?: string; url: string }[] }) {
  const { push } = useStore();
  const items = featuredWorkOf(personId);
  if (!items.length && !links.length) return null;
  // One section for outside work and links (docs/ux-refinement/PLAN.md, Stage 2 order).
  const title = items.length ? (links.length ? 'Featured work and links' : 'Featured work') : 'Links';
  return <section className="section section--flush"><SectionHeader title={title} />{items.length > 0 && <div className="ana-featured-work">
    {items.map((item) => item.kind === 'project' ? <button key={item.id} className="ana-featured-item" onClick={() => push({ name: 'work', id: item.projectId })}>
      {project(item.projectId)?.artwork && <Photo surface="portfolio-thumbnail" media={project(item.projectId)!.artwork!} showPlay={false} />}<span><span className="item-title">{publicName(project(item.projectId)!)}</span><span className="meta">Ana project</span></span>
    </button> : <a key={item.id} className="ana-featured-item" href={item.url} target="_blank" rel="noopener noreferrer"><span><span className="item-title">{item.title || 'Selected work'}</span><span className="meta">External work <ExternalLink size={12} /></span></span></a>)}
  </div>}
    {links.length > 0 && <div className="pf-links profile-links">{links.map((l) => <a key={l.id} className="pf-reel-link" href={l.url} target="_blank" rel="noopener noreferrer">{l.label || l.url.replace(/^https?:\/\//, '')} <ExternalLink size={13} aria-hidden /></a>)}</div>}
  </section>;
}

/** District work editor: media and selected work are separate optional parts. */
export function WorkPortfolioPage() {
  const { viewer, pop, saveProfile, showToast } = useStore();
  const me = person(viewer.id); const x = profileOf(viewer.id); const words = craftProfile(me.craft).work;
  const [reel, setReel] = useState<Reel | undefined>(x.reel);
  const [profileCover, setProfileCover] = useState<ProfileCover | undefined>(x.profileCover);
  const [draft, setDraft] = useState<Reel | undefined>(x.reelDraft);
  const [images, setImages] = useState<Media[]>([...(seed.portfolio[viewer.id] ?? [])]);
  const [featured, setFeatured] = useState<FeaturedWork[]>(featuredWorkOf(viewer.id));
  const [imagePicker, setImagePicker] = useState(false);
  const [framingImage, setFramingImage] = useState<number | null>(null);
  const [imageMenu, setImageMenu] = useState<number | null>(null);
  const [workPicker, setWorkPicker] = useState(false);
  const [external, setExternal] = useState<{ id: string; title: string; url: string } | null>(null);
  const [discard, setDiscard] = useState(false);
  const initialFeatured = featuredWorkOf(viewer.id);
  const dirty = JSON.stringify([reel, draft, images, featured, profileCover]) !== JSON.stringify([x.reel, x.reelDraft, (seed.portfolio[viewer.id] ?? []), initialFeatured, x.profileCover]);
  const eligible = eligibleFeaturedProjects(viewer.id);
  const featuredSection = <section className="ana-work-section"><h2>Featured work</h2><p className="meta">Selected projects, credits or external work. Featuring a project never creates a credit.</p>
    <div className="ana-featured-work">{featured.map((item, index) => {
      const title = item.kind === 'project' ? publicName(project(item.projectId)!) : item.title || 'Selected work';
      return <div key={item.id} className="ana-work-edit-row"><span className="ana-work-edit-title"><b>{title}</b><span className="meta">{item.kind === 'project' ? 'Ana project' : 'External work'}</span></span><div className="ana-work-row-actions">
        {item.kind === 'external' && <Button size="s" variant="plain" onClick={() => setExternal(item)}>Edit</Button>}
        <IconButton label={`Move ${title} earlier`} disabled={index === 0} onClick={() => setFeatured((f) => move(f, index, -1))}><ArrowUp size={16} /></IconButton>
        <IconButton label={`Move ${title} later`} disabled={index === featured.length - 1} onClick={() => setFeatured((f) => move(f, index, 1))}><ArrowDown size={16} /></IconButton>
        <IconButton label={`Remove ${title}`} onClick={() => setFeatured((f) => f.filter((_, i) => i !== index))}><Trash2 size={16} /></IconButton>
      </div></div>;
    })}</div>
    <Button size="s" variant="secondary" onClick={() => setWorkPicker(true)}><Plus size={16} /> Add featured work</Button>
  </section>;
  return <div className="composer ana-work-editor">
    <header className="composer-bar"><button className="link link--muted" onClick={() => dirty ? setDiscard(true) : pop()}>Cancel</button><p className="composer-title">{words.reel ? 'Portfolio & showreel' : 'Your work'}</p><Button size="s" disabled={!dirty} onClick={() => {
      if (x.reelDraft?.url?.startsWith('blob:') && x.reelDraft.url !== draft?.url) URL.revokeObjectURL(x.reelDraft.url);
      seed.portfolio[viewer.id] = images;
      const ids = new Set(eligible.map((p) => p.id));
      saveProfile({}, { reel, reelDraft: draft, profileCover, featuredWork: featured.filter((f) => f.kind === 'project' ? ids.has(f.projectId) : !!safeWorkUrl(f.url)) });
      pop(); showToast({ text: 'Work saved' });
    }}>Save</Button></header>
    <div className="composer-body ep-page">
      <ProfileCoverPicker personId={viewer.id} value={profileCover} onChange={setProfileCover} images={images} reel={reel} />
      {!words.reel && !words.images && featuredSection}
      {words.reel ? <section className="ana-work-section"><h2>Showreel</h2><p className="meta">One primary professional video. Optional.</p><ShowreelManager value={reel} draft={draft} onChange={setReel} onDraftChange={setDraft} /></section> : <details className="ana-optional-reel"><summary>Showreel (optional)</summary><ShowreelManager value={reel} draft={draft} onChange={setReel} onDraftChange={setDraft} /></details>}
      {words.images && <section className="ana-work-section"><h2>Portfolio</h2><p className="meta">{words.images === 'Portfolio' ? 'Images and visual work' : words.images} · first image is the cover</p><div className="ep-images">{images.map((image, index) => <span key={image.id} className="ep-img"><Photo surface="portfolio-thumbnail" media={image} showPlay={false} />{index === 0 && <span className="ep-img-cover">Cover</span>}<button className="ep-img-btn" aria-label={`Portfolio image ${index + 1}. Options`} onClick={() => setImageMenu(index)} /></span>)}<button className="ep-add-tile" aria-label="Add portfolio images" onClick={() => setImagePicker(true)}><Plus size={20} /></button></div></section>}
      {(words.reel || words.images) && featuredSection}
    </div>
    <Sheet className="ana-work-sheet" open={imagePicker} onClose={() => setImagePicker(false)} title="Add portfolio images" size="tall"><MediaPicker kind="image" selected={[]} onDone={(ms) => { setImages((old) => [...old, ...ms.filter((m) => m.kind === 'image' && !old.some((o) => o.id === m.id))]); setImagePicker(false); }} /></Sheet>
    <Sheet className="ana-work-sheet" open={framingImage !== null} onClose={() => setFramingImage(null)} title="Reposition" size="tall">{framingImage !== null && images[framingImage] && <MediaFramingEditor media={images[framingImage]} surface="portfolio-thumbnail" onChange={next => setImages(old => old.map((m,i) => i === framingImage ? next : m))} />}<Button block onClick={() => setFramingImage(null)}>Done</Button></Sheet>
    <Sheet className="ana-work-sheet" open={imageMenu !== null} onClose={() => setImageMenu(null)} title="Portfolio image"><Button variant="secondary" onClick={() => { setFramingImage(imageMenu); setImageMenu(null); }}>Reposition</Button>
      {imageMenu !== null && <div className="group">{imageMenu > 0 && <><Row icon={<Check size={18} />} label="Make cover" onPress={() => { setImages((old) => move(old, imageMenu, -imageMenu)); setImageMenu(null); }} /><Row icon={<ArrowUp size={18} />} label="Move earlier" onPress={() => { setImages((old) => move(old, imageMenu, -1)); setImageMenu(null); }} /></>}{imageMenu < images.length - 1 && <Row icon={<ArrowDown size={18} />} label="Move later" onPress={() => { setImages((old) => move(old, imageMenu, 1)); setImageMenu(null); }} />}<Row icon={<Trash2 size={18} />} label="Remove image" onPress={() => { setImages((old) => old.filter((_, i) => i !== imageMenu)); setImageMenu(null); }} /></div>}
    </Sheet>
    <Sheet className="ana-work-sheet" open={workPicker} onClose={() => setWorkPicker(false)} title="Add featured work" size="tall"><div className="stack"><Button variant="secondary" onClick={() => { setWorkPicker(false); setExternal({ id: crypto.randomUUID(), title: '', url: '' }); }}>Add external work link</Button><p className="field-label">Your public projects and accepted credits</p><div className="group">{eligible.filter((p) => !featured.some((f) => f.kind === 'project' && f.projectId === p.id)).map((p) => <Row key={p.id} label={publicName(p)} onPress={() => { setFeatured((old) => [...old, { id: crypto.randomUUID(), kind: 'project', projectId: p.id }]); setWorkPicker(false); }} />)}</div>{!eligible.length && <p className="meta">Shared independent projects and credits accepted on public projects appear here.</p>}</div></Sheet>
    <Sheet className="ana-work-sheet" open={!!external} onClose={() => setExternal(null)} title="External work"><div className="stack">{external && <><label className="ob-field"><span className="field-label">Work title</span><input className="field" value={external.title} onChange={(e) => setExternal({ ...external, title: e.target.value })} /></label><label className="ob-field"><span className="field-label">Work link</span><input className="field" type="url" value={external.url} onChange={(e) => setExternal({ ...external, url: e.target.value })} /></label><Button block disabled={!external.title.trim() || !safeWorkUrl(external.url)} onClick={() => { const item: FeaturedWork = { ...external, kind: 'external', title: external.title.trim(), url: safeWorkUrl(external.url)! }; setFeatured((old) => old.some((f) => f.id === item.id) ? old.map((f) => f.id === item.id ? item : f) : [...old, item]); setExternal(null); }}>Done</Button></>}</div></Sheet>
    <Sheet className="ana-work-sheet" open={discard} onClose={() => setDiscard(false)} title="Discard changes?" close={false}><div className="stack"><Button variant="danger" block onClick={pop}>Discard</Button><Button variant="secondary" block onClick={() => setDiscard(false)}>Keep editing</Button></div></Sheet>
  </div>;
}
