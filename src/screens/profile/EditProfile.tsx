import { Camera } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import type { Media } from '../../data/types';
import { useStore } from '../../state/store';
import { availableLabel, person } from '../../state/selectors';
import { Avatar, Button, Row } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { MediaPicker } from '../create/PostComposer';

const LANGS = ['Telugu', 'Hindi', 'English', 'Tamil', 'Malayalam', 'Kannada', 'Marathi', 'Bengali'];
const ABOUT_MAX = 400;

/**
 * Edit Profile. Identity fields the person owns. Credits are not editable here: they are issued by
 * productions, so the screen points to where corrections happen instead.
 */
export function EditProfile() {
  const { viewer, pop, availability, openSheet, showToast, bumpProfile, userPortfolio, attempt } = useStore();
  const me = person(viewer.id);
  const [name, setName] = useState(me.name);
  const [role, setRole] = useState(me.role);
  const [city, setCity] = useState(me.city);
  const [langs, setLangs] = useState<string[]>(me.languages ?? []);
  const [about, setAbout] = useState(seed.about[viewer.id] ?? '');
  const [gear, setGear] = useState(me.gear ?? '');
  const [photo, setPhoto] = useState<string | undefined>(me.photo);
  const [picker, setPicker] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const dirty =
    name !== me.name || role !== me.role || city !== me.city || gear !== (me.gear ?? '') || about !== (seed.about[viewer.id] ?? '') || photo !== me.photo || langs.join() !== (me.languages ?? []).join();
  const nameError = touched && !name.trim() ? 'Add your name' : null;
  const roleError = touched && !role.trim() ? 'Add what you do' : null;

  const save = () => {
    setTouched(true);
    if (!name.trim() || !role.trim()) return;
    setSaving(true);
    setSaveFailed(false);
    attempt('profile-save', () => {
      // Prototype: write straight into the seed so every screen picks it up.
      Object.assign(me, { name: name.trim(), role: role.trim(), city: city.trim(), languages: langs, gear: gear.trim() || undefined, photo });
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
        {saveFailed && <p className="inline-error">Couldn't save. Your changes are still here. Tap Save to try again.</p>}
        <div className="edit-photo">
          <Avatar party={preview} size={96} />
          <button className="link" onClick={() => setPicker(true)}>
            <Camera size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
            Change photo
          </button>
        </div>

        <div>
          <label className="field-label" htmlFor="ep-name">Name</label>
          <input id="ep-name" className="field" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} />
          {nameError && <p className="field-error">{nameError}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="ep-role">What you do</label>
          <input id="ep-role" className="field" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Director of Photography, Painter" />
          {roleError && <p className="field-error">{roleError}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="ep-city">Based in</label>
          <input id="ep-city" className="field" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div>
          <span className="field-label">Languages</span>
          <div className="chips">
            {LANGS.map((l) => (
              <button key={l} className={`chip ${langs.includes(l) ? 'is-on' : ''}`} onClick={() => setLangs((x) => (x.includes(l) ? x.filter((y) => y !== l) : [...x, l]))}>
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
          <Row label="Showreel and work" value={`${seed.portfolio[viewer.id].length + userPortfolio.length} items`} onPress={() => showToast({ text: 'Add work from Create, with "Add to portfolio" on' })} />
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
      <Sheet open={discard} onClose={() => setDiscard(false)} title="Discard changes?">
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
