import { Camera, ChevronLeft, FileText, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { Media } from '../../data/types';
import { DraftTag } from '../../legal/docs';
import { useStore } from '../../state/store';
import { org } from '../../state/selectors';
import { Avatar, Button } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { MediaPicker } from '../create/PostComposer';

const WORK = ['Features', 'Series', 'Ads', 'Documentary', 'Music videos', 'Shorts'];
const CITIES = ['Hyderabad', 'Mumbai', 'Chennai', 'Kochi', 'Bengaluru', 'Kolkata'];

/**
 * Self-serve setup (secondary path; most houses are set up by the Art and Artist team and invite people).
 * The house exists at once, but trust-sensitive actions (public roles, credits, sharing projects)
 * stay locked until Art and Artist verifies it. Not business registration: four short things, then a check.
 */
export function HouseSetup() {
  const { pop, createHouse, setActing, showToast, recordConsent } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [work, setWork] = useState<string[]>([]);
  const [about, setAbout] = useState('');
  const [site, setSite] = useState('');
  const [logo, setLogo] = useState<string | undefined>();
  const [doc, setDoc] = useState<string | null>(null);
  const [myRole, setMyRole] = useState('');
  const [authorised, setAuthorised] = useState(false);
  const [picker, setPicker] = useState<null | 'logo' | 'doc'>(null);
  const [id, setId] = useState<string | null>(null);
  const draft = { id: 'draft', kind: 'org' as const, name: name || 'New house', city, tone: 2, verified: false, about, logo };

  return (
    <div className="screen">
      <header className="topbar topbar--nav">
        <button className="icon-btn" aria-label="Back" onClick={() => (step && !id ? setStep(step - 1) : pop())}>
          <ChevronLeft size={26} />
        </button>
        {!id && <span className="meta">Step {step + 1} of 3</span>}
      </header>

      {step === 0 && (
        <div className="ws-pad stack">
          <h1 className="large-title">Set up a production house</h1>
          <p className="meta">Most houses are set up with the Art and Artist team. If yours isn't on Art and Artist yet, start here. You'll be its owner.</p>
          <div className="ob-photo">
            <Avatar party={draft} size={72} />
            <button className="link" onClick={() => setPicker('logo')}>
              <Camera size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
              {logo ? 'Change logo' : 'Add logo'}
            </button>
          </div>
          <label className="ob-field">
            <span className="field-label">Name</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears on screen" />
          </label>
          <label className="ob-field">
            <span className="field-label">City</span>
            <input className="field" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <div className="chips chips--tight">
            {CITIES.map((c) => (
              <button key={c} className={`chip ${city === c ? 'is-on' : ''}`} aria-pressed={city === c} onClick={() => setCity(c)}>
                {c}
              </button>
            ))}
          </div>
          <span className="field-label">What you make</span>
          <div className="chips">
            {WORK.map((w) => (
              <button key={w} className={`chip ${work.includes(w) ? 'is-on' : ''}`} aria-pressed={work.includes(w)} onClick={() => setWork((x) => (x.includes(w) ? x.filter((y) => y !== w) : [...x, w]))}>
                {w}
              </button>
            ))}
          </div>
          <Button block size="l" disabled={!name.trim() || !city.trim() || !work.length} onClick={() => setStep(1)}>
            Continue
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="ws-pad stack">
          <h1 className="large-title">About {name}</h1>
          <label className="ob-field">
            <span className="field-label">In two lines</span>
            <textarea className="field field--area" rows={3} maxLength={200} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="e.g. Telugu features and streaming series since 2014." />
          </label>
          <label className="ob-field">
            <span className="field-label">Website or Instagram (optional)</span>
            <input className="field" value={site} onChange={(e) => setSite(e.target.value)} />
          </label>
          <Button block size="l" onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && !id && (
        <div className="ws-pad stack">
          <h1 className="large-title">Verification</h1>
          <p className="meta">Art and Artist checks every production house before it can post public roles or issue credits. It protects people from fake productions and keeps credits trustworthy.</p>
          <button className="doc-pick" onClick={() => setPicker('doc')}>
            <FileText size={20} />
            <span>
              <span className="item-title">{doc ?? 'Add a document'}</span>
              <span className="meta">Registration, GST certificate, or a link to an official listing</span>
            </span>
          </button>
          <label className="ob-field">
            <span className="field-label">Your role at {name}</span>
            <input className="field" value={myRole} onChange={(e) => setMyRole(e.target.value)} placeholder="e.g. Producer, Founder" />
          </label>
          <DraftTag />
          <button className={`check-row ${authorised ? 'is-on' : ''}`} onClick={() => setAuthorised(!authorised)} role="checkbox" aria-checked={authorised}>
            <span className="check-box">{authorised ? '✓' : ''}</span>
            <span>I'm authorised to set up {name} on Art and Artist and act for it</span>
          </button>
          <Button
            block
            size="l"
            disabled={!doc || !myRole.trim() || !authorised}
            onClick={() => {
              const nid = createHouse({ name: name.trim(), city: city.trim(), about: about.trim(), work, website: site, logo });
              recordConsent([`Authority to act for ${name.trim()}`], 'House setup');
              setId(nid);
            }}
          >
            Submit for verification
          </Button>
        </div>
      )}

      {id && (
        <div className="ws-pad stack">
          <div className="pending-hero">
            <ShieldCheck size={32} />
          </div>
          <h1 className="large-title">{org(id).name} is set up</h1>
          <p className="body">Art and Artist checks houses within 2 working days. Until then you can edit your page and prepare private projects.</p>
          <ul className="block-list">
            <li>Public roles unlock after verification</li>
            <li>Credits unlock after verification</li>
            <li>Sharing projects on Art and Artist unlocks after verification</li>
          </ul>
          <Button
            block
            size="l"
            onClick={() => {
              pop();
              setActing(id, false);
              showToast({ text: `Now acting for ${org(id).name}` });
            }}
          >
            Switch to {org(id).name}
          </Button>
          <Button block size="l" variant="secondary" onClick={pop}>
            Stay as myself
          </Button>
        </div>
      )}

      <Sheet open={!!picker} onClose={() => setPicker(null)} title={picker === 'logo' ? 'Logo' : 'Verification document'} size="tall">
        <MediaPicker
          single
          selected={[]}
          onDone={(ms: Media[]) => {
            if (picker === 'logo') setLogo(ms[0]?.src);
            else if (ms[0]) setDoc('Registration certificate.pdf');
            setPicker(null);
          }}
        />
      </Sheet>
    </div>
  );
}
