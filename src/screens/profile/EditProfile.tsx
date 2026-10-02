import { Camera } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import { CRAFTS } from '../../data/crafts';
import type { Craft, Media } from '../../data/types';
import { useStore } from '../../state/store';
import { availableLabel, person } from '../../state/selectors';
import { Avatar, Button, Row } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { MEDIA_LIMIT, MediaPicker } from '../create/PostComposer';

const LANGS = ['Telugu', 'Hindi', 'English', 'Tamil', 'Malayalam', 'Kannada', 'Marathi', 'Bengali'];
const ABOUT_MAX = 400;

/**
 * Edit Profile. Identity fields the person owns. Credits are not editable here: they are issued by
 * productions, so the screen points to where corrections happen instead.
 */
export function EditProfile() {
  const { viewer, pop, availability, openSheet, showToast, bumpProfile, userPortfolio, attempt, addToPortfolio } = useStore();
  const me = person(viewer.id);
  const [name, setName] = useState(me.name);
  const [role, setRole] = useState(me.role);
  const [city, setCity] = useState(me.city);
  const [langs, setLangs] = useState<string[]>(me.languages ?? []);
  // V30: profile completion that onboarding no longer asks for up front.
  const [more, setMore] = useState<Craft[]>(me.crafts ?? []);
  const [spec, setSpec] = useState(me.specialisation ?? '');
  const [workPicker, setWorkPicker] = useState(false);
  const [about, setAbout] = useState(seed.about[viewer.id] ?? '');
  const [gear, setGear] = useState(me.gear ?? '');
  const [photo, setPhoto] = useState<string | undefined>(me.photo);
  const [picker, setPicker] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const dirty =
    name !== me.name || role !== me.role || city !== me.city || gear !== (me.gear ?? '') || about !== (seed.about[viewer.id] ?? '') || photo !== me.photo || langs.join() !== (me.languages ?? []).join() || more.join() !== (me.crafts ?? []).join() || spec !== (me.specialisation ?? '');
  const nameError = touched && !name.trim() ? 'Add your name' : null;
  const roleError = touched && !role.trim() ? 'Add what you do' : null;

  const save = () => {
    setTouched(true);
    if (!name.trim() || !role.trim()) return;
    setSaving(true);
    setSaveFailed(false);
    attempt('profile-save', () => {
      // Prototype: write straight into the seed so every screen picks it up.
      Object.assign(me, { name: name.trim(), role: role.trim(), city: city.trim(), languages: langs, gear: gear.trim() || undefined, photo, crafts: more, specialisation: spec.trim() || undefined });
      seed.about[viewer.id] = about.trim();
      bumpProfile();
      pop();
      showToast({ text: 'Profile updated' });
    }, () => {
      setSaving(false);
      setSaveFailed(true);
    });
  };

  const preview = { ...me, name: name || me.name, photo };

  return (
    <div className="composer">
      <header className="composer-bar">
        <button className="link link--muted" onClick={() => (dirty ? setDiscard(true) : pop())}>
          Cancel
        </button>
        <p className="composer-title">Edit profile</p>
        <Button size="s" disabled={!dirty} loading={saving} onClick={save}>
          Save
        </Button>
      </header>

      <div className="composer-body stack stack--loose">
        {saveFailed && <p className="inline-error" role="alert">Couldn't save. Your changes are still here. Tap Save to try again.</p>}
        <div className="edit-photo">
          <Avatar party={preview} size={96} />
          <button className="link" onClick={() => setPicker(true)}>
            <Camera size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
            Change photo
          </button>
        </div>

        <div>
          <label className="field-label" htmlFor="ep-name">Name</label>
          <input id="ep-name" className="field" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} autoComplete="name" aria-invalid={nameError ? true : undefined} aria-describedby={nameError ? 'ep-name-err' : undefined} />
          {nameError && <p className="field-error" role="alert" id="ep-name-err">{nameError}: it's how productions credit you.</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="ep-role">What you do</label>
          <input id="ep-role" className="field" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Director of Photography, Painter" aria-invalid={roleError ? true : undefined} aria-describedby={roleError ? 'ep-role-err' : undefined} />
          {roleError && <p className="field-error" role="alert" id="ep-role-err">{roleError}, for example "Director of Photography".</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="ep-city">Based in</label>
          <input id="ep-city" className="field" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div>
          <span className="field-label">Other crafts (up to 4, optional)</span>
          <div className="chips">
            {CRAFTS.filter((c) => c.id !== me.craft).map((c) => (
              <button key={c.id} className={`chip ${more.includes(c.id) ? 'is-on' : ''}`} aria-pressed={more.includes(c.id)} disabled={!more.includes(c.id) && more.length >= 4} onClick={() => setMore((m) => (m.includes(c.id) ? m.filter((x) => x !== c.id) : [...m, c.id]))}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="ep-spec">Specialisation (optional)</label>
          <input id="ep-spec" className="field" value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="e.g. Anamorphic, night exteriors" maxLength={60} />
        </div>

        <div>
          <span className="field-label">Languages</span>
          <div className="chips">
            {LANGS.map((l) => (
              <button key={l} className={`chip ${langs.includes(l) ? 'is-on' : ''}`} aria-pressed={langs.includes(l)} onClick={() => setLangs((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]))}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="ep-about">About</label>
          <textarea id="ep-about" className="field field--area" rows={5} maxLength={ABOUT_MAX} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="The work you do and the work you want" />
          <p className="counter">{about.length}/{ABOUT_MAX}</p>
        </div>

        <div>
          <label className="field-label" htmlFor="ep-gear">Gear or tools (optional)</label>
          <input id="ep-gear" className="field" value={gear} onChange={(e) => setGear(e.target.value)} placeholder="Cameras, software, instruments" />
        </div>

        <div className="group">
          <Row label="Availability" value={availability.open ? availableLabel(availability.from) : 'Not taking work'} onPress={() => openSheet({ name: 'availability' })} />
          <Row label="Showreel and portfolio" value={`${(seed.portfolio[viewer.id] ?? []).length + userPortfolio.length} items · Add`} onPress={() => setWorkPicker(true)} />
          <Row label="Credits" value="Issued by productions" onPress={() => showToast({ text: 'To correct a credit, open it on your profile and tap report' })} />
        </div>
      </div>

      <Sheet open={picker} onClose={() => setPicker(false)} title="Profile photo" size="tall">
        <MediaPicker
          single
          selected={[]}
          onDone={(ms: Media[]) => {
            setPhoto(ms[0]?.src);
            setPicker(false);
          }}
        />
      </Sheet>
      <Sheet open={workPicker} onClose={() => setWorkPicker(false)} title="Add to your portfolio" size="tall">
        <MediaPicker
          selected={[]}
          onDone={(ms: Media[]) => {
            setWorkPicker(false);
            if (!ms.length) return;
            addToPortfolio(ms);
            showToast({ text: `Added ${ms.length} to your portfolio (up to ${MEDIA_LIMIT} at a time)` });
          }}
        />
      </Sheet>
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
