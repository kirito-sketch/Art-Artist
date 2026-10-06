import { ArrowDown, ArrowUp, Camera, Check, ChevronLeft, Eye, Plus, Trash2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import * as seed from '../../data/seed';
import { CRAFTS, craftDef, headline } from '../../data/crafts';
import { categoryOf, craftProfile, EXPERIENCE, findSkills, LANGUAGES, MAX_SKILLS, setsFor, skillCategoriesFor, skillDef, VISIBILITY_LABEL, WORK_TYPES, type DetailSet, type Experience, type FieldDef, type Visibility } from '../../data/profileSchema';
import type { Craft, Media, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { availableLabel, org, person } from '../../state/selectors';
import { maskedPhone, pendingForPhone, profileOf, visibilityOf, type DetailValue, type ProfileSkill, type Reel, type WorkLink } from '../../state/profile';
import { project as wproject } from '../../state/world';
import { MobileVerify } from '../../ui/MobileVerify';
import { Avatar, Button, Chip, IconButton, Photo, Row, Toggle } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { MediaPicker } from '../create/PostComposer';

/*
 * Edit Profile (docs/REVIEW_EVENTS_PROFILE.md §6): an overview of sections, each a focused page. Onboarding,
 * completion prompts and these pages all write the same fields (Person + state/profile). Credits are not
 * editable here: productions issue them.
 */
export type EditSection = 'identity' | 'crafts' | `details:${string}` | 'skills' | 'languages' | 'portfolio' | 'work' | 'about' | 'availability' | 'contact';

const ABOUT_MAX = 400;
const list = (xs: string[], n = 3) => (xs.length ? xs.slice(0, n).join(', ') + (xs.length > n ? ` +${xs.length - n}` : '') : '');

export function EditProfile({ section }: { section?: EditSection }) {
  if (!section) return <Overview />;
  if (section === 'identity') return <IdentityPage />;
  if (section === 'crafts') return <CraftsPage />;
  if (section.startsWith('details:')) return <DetailsPage setId={section.slice(8)} />;
  if (section === 'skills') return <SkillsPage />;
  if (section === 'languages') return <LanguagesPage />;
  if (section === 'portfolio') return <PortfolioPage />;
  if (section === 'work') return <WorkPage />;
  if (section === 'about') return <AboutPage />;
  if (section === 'availability') return <AvailabilityPage />;
  return <ContactPage />;
}

/* ------------------------------------------------------------ overview */

function Overview() {
  const { viewer, pop, push, availability, profileVersion } = useStore();
  void profileVersion;
  const me = person(viewer.id);
  const x = profileOf(viewer.id);
  const crafts = [me.craft, ...(me.crafts ?? [])];
  const sets = setsFor(crafts);
  const images = (seed.portfolio[viewer.id] ?? []).length;
  const go = (section: EditSection) => push({ name: 'editProfile', section });
  const v = (text: string, empty = 'Add') => <span className={`ep-value ${text ? '' : 'is-empty'}`}>{text || empty}</span>;
  // Two lines: what the section is, then what's filled in.
  const R = ({ label, value, section }: { label: string; value: ReactNode; section: EditSection }) => (
    <Row
      label={
        <span className="ep-row">
          <span>{label}</span>
          {value}
        </span>
      }
      onPress={() => go(section)}
    />
  );
  const workCount = [x.reel ? 'Reel' : '', images ? `${images} image${images === 1 ? '' : 's'}` : '', x.workLinks.length ? `${x.workLinks.length} link${x.workLinks.length === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ');
  const skills = x.skills.map((s) => skillDef(s.id)?.label ?? s.id).concat(x.suggestedSkills);
  return (
    <div className="screen">
      <header className="topbar topbar--nav browse-top">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
        <h1 className="topbar-title">Edit profile</h1>
        <span className="icon-btn-spacer" aria-hidden />
      </header>
      <div className="ep-overview">
        <div className="group">
          <R label="Photo & name" value={v(me.name)} section={('identity')} />
          <R label="Crafts" value={v(list(crafts.map((c) => craftDef(c)?.label ?? c)))} section={('crafts')} />
          {sets.map((s) => (
            <R key={s.id} label={s.label} value={v(list(s.fields.filter((f) => !f.sensitive).flatMap((f) => fmt(f, x.details[f.id])).filter(Boolean), 2))} section={(`details:${s.id}`)} />
          ))}
          {skillCategoriesFor(crafts).length > 0 && <R label="Skills" value={v(list(skills, 2))} section={('skills')} />}
          <R label="Languages" value={v(list(me.languages ?? []))} section={('languages')} />
        </div>
        <div className="group">
          <R label={portfolioLabel(me.craft)} value={v(workCount)} section={('portfolio')} />
          <R label="Work" value={v('Credits and projects', '')} section={('work')} />
          <R label="About" value={v(seed.about[viewer.id] ? 'Bio added' : '')} section={('about')} />
        </div>
        <div className="group">
          <R label="Availability & travel" value={v(availability.open ? availableLabel(availability.from) : 'Not taking work')} section={('availability')} />
          <R label="Contact & privacy" value={v(x.phone?.verified ? 'Mobile verified' : '', 'Verify mobile')} section={('contact')} />
        </div>
      </div>
    </div>
  );
}

const portfolioLabel = (c: Craft) => {
  const w = craftProfile(c).work;
  return w.reel && w.images ? 'Portfolio & showreel' : w.images ? 'Portfolio' : 'Work samples';
};

function fmt(f: FieldDef, v: DetailValue | undefined): string[] {
  if (v === undefined || v === '') return [];
  if (f.type === 'range' && Array.isArray(v)) return [`${f.label} ${v[0]}–${v[1]}`];
  if (f.type === 'number') return [`${v} ${f.unit ?? ''}`.trim()];
  return Array.isArray(v) ? (v as string[]) : [String(v)];
}

/* ------------------------------------------------------------ the page frame */

function Page({ title, dirty, onSave, children, saveLabel = 'Save' }: { title: string; dirty: boolean; onSave: () => void; children: ReactNode; saveLabel?: string }) {
  const { pop } = useStore();
  const [discard, setDiscard] = useState(false);
  return (
    <div className="composer">
      <header className="composer-bar">
        <button className="link link--muted" onClick={() => (dirty ? setDiscard(true) : pop())}>
          Cancel
        </button>
        <p className="composer-title">{title}</p>
        <Button size="s" disabled={!dirty} onClick={onSave}>
          {saveLabel}
        </Button>
      </header>
      <div className="composer-body ep-page">{children}</div>
      <Sheet open={discard} onClose={() => setDiscard(false)} title="Discard changes?" close={false}>
        <div className="stack">
          <Button block size="l" variant="danger" onClick={pop}>
            Discard
          </Button>
          <Button block size="l" variant="secondary" onClick={() => setDiscard(false)}>
            Keep editing
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function useSave() {
  const { saveProfile, pop, showToast } = useStore();
  return (p: Partial<Person>, x?: Parameters<typeof saveProfile>[1]) => {
    saveProfile(p, x);
    pop();
    showToast({ text: 'Saved' });
  };
}

function Field({ label, children, aside }: { label: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="ep-field">
      <div className="ep-field-head">
        <span className="field-label">{label}</span>
        {aside}
      </div>
      {children}
    </div>
  );
}

function Chips({ options, value, onChange, max, label }: { options: string[]; value: string[]; onChange: (v: string[]) => void; max?: number; label: string }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <Chip key={o} active={on} onClick={() => (on ? onChange(value.filter((x) => x !== o)) : (!max || value.length < max) && onChange([...value, o]))}>
            {o}
          </Chip>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ sections */

function IdentityPage() {
  const { viewer } = useStore();
  const save = useSave();
  const me = person(viewer.id);
  const [name, setName] = useState(me.name);
  const [role, setRole] = useState(me.role);
  const [photo, setPhoto] = useState(me.photo);
  const [picker, setPicker] = useState(false);
  const dirty = name !== me.name || role !== me.role || photo !== me.photo;
  return (
    <Page title="Photo & name" dirty={dirty && !!name.trim() && !!role.trim()} onSave={() => save({ name: name.trim(), role: role.trim(), photo })}>
      <div className="edit-photo">
        <Avatar party={{ ...me, name: name || me.name, photo }} size={96} />
        <button className="link" onClick={() => setPicker(true)}>
          <Camera size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
          {photo ? 'Change photo' : 'Add photo'}
        </button>
      </div>
      <Field label="Name as credited">
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-label="Name as credited" />
      </Field>
      <Field label="Headline">
        <input className="field" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Headline" placeholder="e.g. Director of Photography" />
      </Field>
      <Sheet open={picker} onClose={() => setPicker(false)} title="Profile photo" size="tall">
        <MediaPicker single selected={[]} onDone={(ms: Media[]) => (setPhoto(ms[0]?.src ?? photo), setPicker(false))} />
      </Sheet>
    </Page>
  );
}

function CraftsPage() {
  const { viewer } = useStore();
  const save = useSave();
  const me = person(viewer.id);
  const [main, setMain] = useState<Craft>(me.craft);
  const [more, setMore] = useState<Craft[]>(me.crafts ?? []);
  const [spec, setSpec] = useState(me.specialisation ?? '');
  const dirty = main !== me.craft || more.join() !== (me.crafts ?? []).join() || spec !== (me.specialisation ?? '');
  return (
    <Page
      title="Crafts"
      dirty={dirty}
      onSave={() => save({ craft: main, crafts: more.filter((c) => c !== main), specialisation: spec.trim() || undefined, role: me.role === headline(me.craft, me.specialisation) ? headline(main, spec) : me.role })}
    >
      <Field label="Main craft">
        <div className="chips" role="radiogroup" aria-label="Main craft">
          {CRAFTS.map((c) => (
            <Chip key={c.id} active={main === c.id} onClick={() => (setMain(c.id), setMore((m) => m.filter((x) => x !== c.id)))}>
              {c.label}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Other crafts (up to 4)">
        <Chips label="Other crafts" options={CRAFTS.filter((c) => c.id !== main).map((c) => c.label)} value={more.map((c) => craftDef(c)!.label)} max={4} onChange={(ls) => setMore(ls.map((l) => CRAFTS.find((c) => c.label === l)!.id))} />
      </Field>
      <Field label="Specialisation">
        <input className="field" value={spec} onChange={(e) => setSpec(e.target.value)} maxLength={60} placeholder="e.g. Anamorphic, night exteriors" aria-label="Specialisation" />
      </Field>
    </Page>
  );
}

/** Who can see a detail, chosen as it's entered. */
function VisibilityChip({ field, value, onChange }: { field: FieldDef; value: Visibility; onChange: (v: Visibility) => void }) {
  const [open, setOpen] = useState(false);
  if (!field.choosable) return null;
  const HELP: Record<Visibility, string> = { public: 'On your public profile', productions: 'Only people acting for verified production houses', private: 'Only you. Art and Artist uses it to match roles' };
  return (
    <>
      <button className="ep-vis" onClick={() => setOpen(true)} aria-label={`${field.label}: visible to ${VISIBILITY_LABEL[value]}. Change`}>
        <Eye size={13} aria-hidden /> {VISIBILITY_LABEL[value]}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Who sees your ${field.label.toLowerCase()}`}>
        <div className="group picker" role="radiogroup" aria-label="Visibility">
          {field.choosable.map((o) => (
            <button key={o} role="radio" aria-checked={value === o} className={`picker-row ${value === o ? 'is-on' : ''}`} onClick={() => (onChange(o), setOpen(false))}>
              <span className="settings-label">
                <span>{VISIBILITY_LABEL[o]}</span>
                <span className="meta">{HELP[o]}</span>
              </span>
              {value === o && <Check size={18} aria-hidden />}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}

function DetailsPage({ setId }: { setId: string }) {
  const { viewer } = useStore();
  const save = useSave();
  const x = profileOf(viewer.id);
  const me = person(viewer.id);
  const set: DetailSet | undefined = setsFor([me.craft, ...(me.crafts ?? [])]).find((s) => s.id === setId);
  const [vals, setVals] = useState<Record<string, DetailValue>>({ ...x.details });
  const [vis, setVis] = useState<Record<string, Visibility>>({ ...x.visibility });
  if (!set) return null;
  const dirty = JSON.stringify(vals) !== JSON.stringify(x.details) || JSON.stringify(vis) !== JSON.stringify(x.visibility);
  const put = (id: string, v: DetailValue | undefined) => setVals((m) => {
    const n = { ...m };
    if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) delete n[id];
    else n[id] = v;
    return n;
  });
  return (
    <Page title={set.label} dirty={dirty} onSave={() => save({}, { details: vals, visibility: vis })}>
      {set.fields.map((f) => {
        const v = vals[f.id];
        const visibility = vis[f.id] ?? visibilityOf(x, f.id);
        const aside = <VisibilityChip field={f} value={visibility} onChange={(o) => setVis((m) => ({ ...m, [f.id]: o }))} />;
        if (f.type === 'multi') return <Field key={f.id} label={f.label} aside={aside}><Chips label={f.label} options={f.options!} value={(v as string[]) ?? []} onChange={(n) => put(f.id, n)} /></Field>;
        if (f.type === 'choice')
          return (
            <Field key={f.id} label={f.label} aside={aside}>
              <div className="chips" role="radiogroup" aria-label={f.label}>
                {f.options!.map((o) => (
                  <Chip key={o} active={v === o} onClick={() => put(f.id, v === o ? undefined : o)}>
                    {o}
                  </Chip>
                ))}
              </div>
            </Field>
          );
        if (f.type === 'number')
          return (
            <Field key={f.id} label={`${f.label} (${f.unit})`} aside={aside}>
              <input className="field" type="number" inputMode="numeric" min={f.min} max={f.max} value={(v as number) ?? ''} onChange={(e) => put(f.id, e.target.value ? Number(e.target.value) : undefined)} aria-label={f.label} />
            </Field>
          );
        const r = (v as [number, number]) ?? ['', ''];
        return (
          <Field key={f.id} label={f.label} aside={aside}>
            <div className="ep-range">
              <input className="field" type="number" inputMode="numeric" min={f.min} max={f.max} value={r[0]} onChange={(e) => put(f.id, [Number(e.target.value) || f.min!, Number(r[1]) || Number(e.target.value)])} aria-label={`${f.label} from`} />
              <span aria-hidden>to</span>
              <input className="field" type="number" inputMode="numeric" min={f.min} max={f.max} value={r[1]} onChange={(e) => put(f.id, [Number(r[0]) || Number(e.target.value), Number(e.target.value) || f.max!])} aria-label={`${f.label} to`} />
              <span className="meta">{f.unit}</span>
            </div>
          </Field>
        );
      })}
    </Page>
  );
}

function SkillsPage() {
  const { viewer } = useStore();
  const save = useSave();
  const x = profileOf(viewer.id);
  const me = person(viewer.id);
  const cats = skillCategoriesFor([me.craft, ...(me.crafts ?? [])]);
  const [skills, setSkills] = useState<ProfileSkill[]>(x.skills.map((s) => ({ ...s })));
  const [suggested, setSuggested] = useState<string[]>([...x.suggestedSkills]);
  const [q, setQ] = useState('');
  const total = skills.length + suggested.length;
  const full = total >= MAX_SKILLS;
  const results = findSkills(q, cats).filter((s) => !skills.some((k) => k.id === s.id) && (q || cats.includes(s.category))).slice(0, q ? 12 : 18);
  const exact = findSkills(q).some((s) => s.label.toLowerCase() === q.trim().toLowerCase());
  const dirty = JSON.stringify(skills) !== JSON.stringify(x.skills) || suggested.join() !== x.suggestedSkills.join();
  const set = (id: string, patch: Partial<ProfileSkill>) => setSkills((ks) => ks.map((k) => (k.id === id ? { ...k, ...patch } : k)));
  return (
    <Page title="Skills" dirty={dirty} onSave={() => save({}, { skills, suggestedSkills: suggested })}>
      <p className="ep-note">
        {total} of {MAX_SKILLS}
      </p>
      {skills.map((k) => {
        const d = skillDef(k.id);
        const c = d && categoryOf(d.category);
        return (
          <div key={k.id} className="ep-skill">
            <div className="ep-skill-head">
              <b>{d?.label ?? k.id}</b>
              <IconButton label={`Remove ${d?.label}`} onClick={() => setSkills((ks) => ks.filter((s) => s.id !== k.id))}>
                <X size={16} />
              </IconButton>
            </div>
            {c?.levels && (
              <div className="chips chips--tight" role="radiogroup" aria-label={`${d?.label} level`}>
                {c.levels.map((l) => (
                  <Chip key={l} active={k.level === l} onClick={() => set(k.id, { level: k.level === l ? undefined : l })}>
                    {l}
                  </Chip>
                ))}
              </div>
            )}
            {c?.cert && <input className="field" value={k.cert ?? ''} onChange={(e) => set(k.id, { cert: e.target.value || undefined })} placeholder="Certification, if any" aria-label={`${d?.label} certification`} />}
          </div>
        );
      })}
      {suggested.map((sname) => (
        <div key={sname} className="ep-skill">
          <div className="ep-skill-head">
            <span>
              <b>{sname}</b> <span className="ep-suggest">Suggested · shown on your profile</span>
            </span>
            <IconButton label={`Remove ${sname}`} onClick={() => setSuggested((ss) => ss.filter((x2) => x2 !== sname))}>
              <X size={16} />
            </IconButton>
          </div>
        </div>
      ))}
      <Field label="Add skills">
        <input className="field" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. horse riding" aria-label="Search skills" disabled={full} />
      </Field>
      {!full && (
        <div className="chips" role="group" aria-label="Skills you can add">
          {results.map((s) => (
            <Chip key={s.id} icon={<Plus size={14} aria-hidden />} onClick={() => (setSkills((ks) => [...ks, { id: s.id }]), setQ(''))}>
              {s.label}
            </Chip>
          ))}
          {q.trim().length > 2 && !exact && !suggested.includes(q.trim()) && (
            <Chip icon={<Plus size={14} aria-hidden />} onClick={() => (setSuggested((ss) => [...ss, q.trim()]), setQ(''))}>
              Add “{q.trim()}”
            </Chip>
          )}
        </div>
      )}
    </Page>
  );
}

function LanguagesPage() {
  const { viewer } = useStore();
  const save = useSave();
  const me = person(viewer.id);
  const [langs, setLangs] = useState<string[]>(me.languages ?? []);
  return (
    <Page title="Languages" dirty={langs.join() !== (me.languages ?? []).join()} onSave={() => save({ languages: langs })}>
      <Field label="Languages you work in">
        <Chips label="Languages" options={LANGUAGES} value={langs} onChange={setLangs} />
      </Field>
    </Page>
  );
}

/** Showreel (a link), images (uploaded, ordered; the first is the cover), and work links. Nothing is all-or-nothing. */
function PortfolioPage() {
  const { viewer } = useStore();
  const save = useSave();
  const me = person(viewer.id);
  const x = profileOf(viewer.id);
  const words = craftProfile(me.craft).work;
  const [reel, setReel] = useState<Reel | undefined>(x.reel ? { ...x.reel } : undefined);
  const [images, setImages] = useState<Media[]>([...(seed.portfolio[viewer.id] ?? [])]);
  const [links, setLinks] = useState<WorkLink[]>(x.workLinks.map((l) => ({ ...l })));
  const [reelEdit, setReelEdit] = useState<Reel | null>(null);
  const [coverPick, setCoverPick] = useState(false);
  const [imgPick, setImgPick] = useState(false);
  const [imgMenu, setImgMenu] = useState<number | null>(null);
  const dirty = JSON.stringify(reel) !== JSON.stringify(x.reel) || images.map((m) => m.id).join() !== (seed.portfolio[viewer.id] ?? []).map((m) => m.id).join() || JSON.stringify(links) !== JSON.stringify(x.workLinks);
  const move = (i: number, d: number) => setImages((ms) => {
    const n = [...ms];
    const [m] = n.splice(i, 1);
    n.splice(Math.max(0, Math.min(n.length, i + d)), 0, m);
    return n;
  });
  const validUrl = (s: string) => /^https?:\/\/\S+\.\S+/.test(s.trim());
  return (
    <Page
      title={portfolioLabel(me.craft)}
      dirty={dirty}
      onSave={() => {
        seed.portfolio[viewer.id] = images;
        save({}, { reel, workLinks: links.filter((l) => validUrl(l.url)) });
      }}
    >
      {words.reel && (
        <Field label={words.reel}>
          {reel ? (
            <div className="ep-reel">
              <span className="ep-reel-cover">{reel.cover ? <Photo media={reel.cover} showPlay={false} /> : null}</span>
              <span className="ep-reel-t">
                <b>{reel.title}</b>
                <span className="meta">{reel.url.replace(/^https?:\/\//, '')}</span>
              </span>
              <Button size="s" variant="secondary" onClick={() => setReelEdit({ ...reel })}>
                Edit
              </Button>
            </div>
          ) : (
            <Button variant="secondary" icon={<Plus size={16} />} onClick={() => setReelEdit({ url: '', title: words.reel! })}>
              Add {words.reel.toLowerCase()}
            </Button>
          )}
        </Field>
      )}
      {words.images && (
        <Field label={words.images} aside={images.length > 1 ? <span className="meta">First is the cover</span> : undefined}>
          <div className="ep-images">
            {images.map((m, i) => (
              <span key={m.id} className="ep-img">
                <Photo media={m} showPlay={false} />
                {i === 0 && <span className="ep-img-cover">Cover</span>}
                <button className="ep-img-btn" onClick={() => setImgMenu(i)} aria-label={`Image ${i + 1} of ${images.length}${i === 0 ? ', cover' : ''}. Options`} />
              </span>
            ))}
            <button className="ep-add-tile" onClick={() => setImgPick(true)} aria-label={`Add ${words.images.toLowerCase()}`} style={{ aspectRatio: '1', borderRadius: 10 }}>
              <Plus size={20} aria-hidden />
            </button>
          </div>
        </Field>
      )}
      <Field label={words.links}>
        {links.map((l, i) => (
          <div key={l.id} className="ep-link-row">
            <input className="field" value={l.label} onChange={(e) => setLinks((ls) => ls.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)))} aria-label={`Link ${i + 1} title`} placeholder="Title" />
            <input className="field" type="url" value={l.url} onChange={(e) => setLinks((ls) => ls.map((y, j) => (j === i ? { ...y, url: e.target.value } : y)))} aria-label={`Link ${i + 1} address`} placeholder="https://" />
            <IconButton label={`Remove link ${i + 1}`} onClick={() => setLinks((ls) => ls.filter((_, j) => j !== i))}>
              <Trash2 size={16} />
            </IconButton>
          </div>
        ))}
        <Button variant="secondary" size="s" icon={<Plus size={14} />} onClick={() => setLinks((ls) => [...ls, { id: `w-${Date.now().toString(36)}`, label: '', url: '' }])}>
          Add a link
        </Button>
      </Field>

      <Sheet open={!!reelEdit} onClose={() => setReelEdit(null)} title={words.reel ?? 'Showreel'}>
        {reelEdit && (
          <div className="stack">
            <Field label="Link">
              <input className="field" type="url" inputMode="url" value={reelEdit.url} onChange={(e) => setReelEdit({ ...reelEdit, url: e.target.value })} placeholder="YouTube, Vimeo or Google Drive" aria-label="Link" />
            </Field>
            <Field label="Title">
              <input className="field" value={reelEdit.title} onChange={(e) => setReelEdit({ ...reelEdit, title: e.target.value })} aria-label="Title" />
            </Field>
            <Field label="Cover image">
              <div className="ep-reel">
                <span className="ep-reel-cover">{reelEdit.cover ? <Photo media={reelEdit.cover} showPlay={false} /> : null}</span>
                <Button size="s" variant="secondary" onClick={() => setCoverPick(true)}>
                  {reelEdit.cover ? 'Change' : 'Add'}
                </Button>
              </div>
            </Field>
            <Button block size="l" disabled={!validUrl(reelEdit.url) || !reelEdit.title.trim()} onClick={() => (setReel({ ...reelEdit, url: reelEdit.url.trim(), title: reelEdit.title.trim() }), setReelEdit(null))}>
              Done
            </Button>
            {reel && (
              <Button block variant="secondary" onClick={() => (setReel(undefined), setReelEdit(null))}>
                Remove {(words.reel ?? 'showreel').toLowerCase()}
              </Button>
            )}
          </div>
        )}
      </Sheet>
      <Sheet open={coverPick} onClose={() => setCoverPick(false)} title="Cover image" size="tall">
        <MediaPicker single selected={[]} onDone={(ms: Media[]) => (reelEdit && ms[0] && setReelEdit({ ...reelEdit, cover: ms[0] }), setCoverPick(false))} />
      </Sheet>
      <Sheet open={imgPick} onClose={() => setImgPick(false)} title={words.images ?? 'Images'} size="tall">
        <MediaPicker selected={[]} onDone={(ms: Media[]) => (setImages((cur) => [...cur, ...ms.filter((m) => m.kind === 'image' && !cur.some((c) => c.id === m.id))]), setImgPick(false))} />
      </Sheet>
      <Sheet open={imgMenu !== null} onClose={() => setImgMenu(null)} title="" label="Image options">
        {imgMenu !== null && (
          <div className="group">
            {imgMenu > 0 && <Row icon={<Check size={18} />} label="Make cover" onPress={() => (move(imgMenu, -imgMenu), setImgMenu(null))} />}
            {imgMenu > 0 && <Row icon={<ArrowUp size={18} />} label="Move earlier" onPress={() => (move(imgMenu, -1), setImgMenu(null))} />}
            {imgMenu < images.length - 1 && <Row icon={<ArrowDown size={18} />} label="Move later" onPress={() => (move(imgMenu, 1), setImgMenu(null))} />}
            <Row icon={<Trash2 size={18} />} label="Remove" onPress={() => (setImages((ms) => ms.filter((_, j) => j !== imgMenu)), setImgMenu(null))} />
          </div>
        )}
      </Sheet>
    </Page>
  );
}

function WorkPage() {
  const { viewer, push, pop } = useStore();
  return (
    <div className="screen">
      <header className="topbar topbar--nav browse-top">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
        <h1 className="topbar-title">Work</h1>
        <span className="icon-btn-spacer" aria-hidden />
      </header>
      <div className="ep-page">
        <div className="group">
          <Row label="Credits" value="Issued by productions" onPress={() => push({ name: 'profile', id: viewer.id })} />
          <Row label="Independent projects" value="On your profile" onPress={() => push({ name: 'profile', id: viewer.id })} />
        </div>
        <p className="ep-note">To correct a credit, open it on your profile and tap Something wrong.</p>
      </div>
    </div>
  );
}

function AboutPage() {
  const { viewer } = useStore();
  const save = useSave();
  const x = profileOf(viewer.id);
  const [about, setAbout] = useState(seed.about[viewer.id] ?? '');
  const [exp, setExp] = useState<Experience | undefined>(x.experience);
  const [links, setLinks] = useState<WorkLink[]>(x.links.map((l) => ({ ...l })));
  const dirty = about !== (seed.about[viewer.id] ?? '') || exp !== x.experience || JSON.stringify(links) !== JSON.stringify(x.links);
  return (
    <Page
      title="About"
      dirty={dirty}
      onSave={() => {
        seed.about[viewer.id] = about.trim();
        save({}, { experience: exp, links: links.filter((l) => /^https?:\/\/\S+\.\S+/.test(l.url.trim())) });
      }}
    >
      <Field label="Bio">
        <textarea className="field field--area" rows={5} maxLength={ABOUT_MAX} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="The work you do and the work you want" aria-label="Bio" />
        <p className="counter">
          {about.length}/{ABOUT_MAX}
        </p>
      </Field>
      <Field label="Experience">
        <div className="chips" role="radiogroup" aria-label="Experience">
          {EXPERIENCE.map((e) => (
            <Chip key={e.id} active={exp === e.id} onClick={() => setExp(exp === e.id ? undefined : e.id)}>
              {e.label}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Links">
        {links.map((l, i) => (
          <div key={l.id} className="ep-link-row">
            <input className="field" value={l.label} onChange={(e) => setLinks((ls) => ls.map((y, j) => (j === i ? { ...y, label: e.target.value } : y)))} placeholder="IMDb, Instagram…" aria-label={`Link ${i + 1} title`} />
            <input className="field" type="url" value={l.url} onChange={(e) => setLinks((ls) => ls.map((y, j) => (j === i ? { ...y, url: e.target.value } : y)))} placeholder="https://" aria-label={`Link ${i + 1} address`} />
            <IconButton label={`Remove link ${i + 1}`} onClick={() => setLinks((ls) => ls.filter((_, j) => j !== i))}>
              <Trash2 size={16} />
            </IconButton>
          </div>
        ))}
        <Button variant="secondary" size="s" icon={<Plus size={14} />} onClick={() => setLinks((ls) => [...ls, { id: `l-${Date.now().toString(36)}`, label: '', url: '' }])}>
          Add a link
        </Button>
      </Field>
    </Page>
  );
}

function AvailabilityPage() {
  const { viewer, availability, openSheet } = useStore();
  const save = useSave();
  const me = person(viewer.id);
  const x = profileOf(viewer.id);
  const [travel, setTravel] = useState(!!me.openToTravel);
  const [types, setTypes] = useState<string[]>(x.workTypes);
  return (
    <Page title="Availability & travel" dirty={travel !== !!me.openToTravel || types.join() !== x.workTypes.join()} onSave={() => save({ openToTravel: travel }, { workTypes: types })}>
      <div className="group">
        <Row label="Availability" value={availability.open ? availableLabel(availability.from) : 'Not taking work'} onPress={() => openSheet({ name: 'availability' })} />
      </div>
      <div className="ep-toggle-row">
        <span>Open to travel for work</span>
        <Toggle on={travel} onChange={setTravel} label="Open to travel for work" />
      </div>
      <Field label="Types of work you want">
        <Chips label="Types of work" options={WORK_TYPES} value={types} onChange={setTypes} />
      </Field>
    </Page>
  );
}

/** Contact & privacy: identity (the verified mobile) is separate from sharing contact with someone. */
function ContactPage() {
  const { viewer, pop, push, confirmPendingRecord, declinePendingRecord, profileVersion } = useStore();
  void profileVersion;
  const x = profileOf(viewer.id);
  const me = person(viewer.id);
  const [phone, setPhone] = useState<{ number: string; verified: boolean } | null>(x.phone?.verified ? x.phone : null);
  const pending = x.phone?.verified ? pendingForPhone(x.phone.number) : [];
  const sensitive = setsFor([me.craft, ...(me.crafts ?? [])]).flatMap((s) => s.fields.filter((f) => f.choosable).map((f) => ({ f, set: s })));
  return (
    <div className="screen">
      <header className="topbar topbar--nav browse-top">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
        <h1 className="topbar-title">Contact & privacy</h1>
        <span className="icon-btn-spacer" aria-hidden />
      </header>
      <div className="ep-page">
        <section className="stack" aria-label="Mobile number">
          <p className="field-label">Mobile number · only you</p>
          <MobileVerify value={phone} onChange={(v) => setPhone(v)} />
          {x.phone?.verified && phone?.verified && <p className="ep-note">Productions never see it. To give someone your number, share it in a conversation with them.</p>}
        </section>
        {pending.map((a) => {
          const p = wproject(a.projectId)!;
          return (
            <div key={a.id} className="pend-card" role="group" aria-label="A production added this number">
              <p className="item-title">
                {p.houseId ? org(p.houseId).name : 'A production'} added {maskedPhone(x.phone!.number)} to {p.workingTitle} as {a.workingRole}
              </p>
              <p className="meta">Is this you?</p>
              <div className="pend-actions">
                <Button size="s" onClick={() => confirmPendingRecord(a.id)}>
                  Yes, it's me
                </Button>
                <Button size="s" variant="secondary" onClick={() => declinePendingRecord(a.id)}>
                  Not me
                </Button>
              </div>
            </div>
          );
        })}
        <div className="group">
          <Row label="Email" value="Only you" />
        </div>
        {sensitive.length > 0 && (
          <div className="group">
            {sensitive.map(({ f, set }) => (
              <Row key={f.id} label={f.label} value={VISIBILITY_LABEL[visibilityOf(x, f.id)]} onPress={() => push({ name: 'editProfile', section: `details:${set.id}` })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
