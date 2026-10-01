import { Check, ImagePlus, IndianRupee, MapPin, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import type { Media, Opportunity } from '../../data/types';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { Avatar, Button, IconButton, Photo, Row, Toggle } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { MediaPicker } from './PostComposer';

const ROLES = ['Cinematographer', '1st AC', 'Gaffer', 'Editor', 'Colourist', 'Sound recordist', 'Actor'];
const TYPES = ['Short film', 'Feature film', 'Web series', 'Music video', 'Ad film', 'Documentary'];
const PAY = ['Paid', 'Unpaid', 'Deferred', 'Negotiable'];

/**
 * Collaboration composer, one page. Cover first, the role as the title, then grouped rows.
 * The intent (looking / available) was chosen in the Create sheet, so it is not asked again.
 */
export function CollabComposer({ intent = 'looking' }: { intent?: 'looking' | 'available' }) {
  const { pop, viewer, publishCollab, acting } = useStore();
  // Publishing always shows who it comes from: the person, or the house they act for.
  const me = acting !== 'self' ? org(acting) : person(viewer.id);
  const available = intent === 'available';
  const [role, setRole] = useState(available ? person(viewer.id).role : '');
  const [project, setProject] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [city, setCity] = useState(me.city);
  const [pay, setPay] = useState('Paid');
  const [amount, setAmount] = useState('');
  const [about, setAbout] = useState('');
  const [cover, setCover] = useState<Media | null>(null);
  const [allowDM, setAllowDM] = useState(available);
  const [picker, setPicker] = useState(false);
  const [discard, setDiscard] = useState(false);

  const valid = role.trim() && start.trim() && city.trim() && (available || project.trim());
  const dirty = !!(project || start || about || cover || (!available && role));
  const dates = end ? `${start} – ${end}` : start;

  const publish = () => {
    const o: Opportunity = {
      id: `mine-${Date.now()}`,
      kind: 'collab',
      collabIntent: intent,
      role: role.trim(),
      project: available ? me.name : project.trim(),
      projectType: available ? person(viewer.id).role : type,
      ...(acting !== 'self' ? { orgId: acting } : { authorId: viewer.id }),
      allowDM,
      city: city.trim(),
      dates,
      compensation: pay === 'Paid' ? amount.trim() || 'Paid' : pay,
      paid: pay === 'Paid',
      stage: available ? 'Available' : 'In development',
      about: about.trim() || (available ? `Available for ${role.toLowerCase()} work.` : 'Details to follow.'),
      lookingFor: [],
      match: [],
      forCrafts: [],
      // A new account may have no work yet: fall back to a neutral Art and Artist image, never undefined.
      media: cover ?? (seed.portfolio[viewer.id] ?? [])[0] ?? { id: 'collab-cover', kind: 'image', src: 'images/brand/entry/camera.jpg' },
      postedAgo: 'now',
    };
    publishCollab(o);
  };

  return (
    <div className="composer">
      <header className="composer-bar">
        <IconButton label="Close" onClick={() => (dirty ? setDiscard(true) : pop())}>
          <X size={24} />
        </IconButton>
        <p className="composer-title">{available ? 'Available for work' : 'Looking for someone'}</p>
        <button className="confirm" disabled={!valid} onClick={publish} aria-label="Publish">
          <Check size={22} strokeWidth={2.6} />
        </button>
      </header>

      <div className="composer-body stack stack--loose">
        <div className="composer-who composer-who--small">
          <Avatar party={me} size={28} />
          <span className="meta meta--dark">{me.name}</span>
        </div>

        <button className="cover" onClick={() => setPicker(true)} aria-label="Add cover">
          {cover ? (
            <Photo media={cover} />
          ) : (
            <span className="cover-empty">
              <ImagePlus size={24} />
            </span>
          )}
        </button>

        <div>
          <input id="c-role" className="title-input" value={role} onChange={(e) => setRole(e.target.value)} placeholder={available ? 'Your role' : 'Who do you need?'} aria-label="Role" />
          {!role && (
            <div className="chips chips--scroll">
              {ROLES.map((r) => (
                <button key={r} className="chip" onClick={() => setRole(r)}>
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {!available && (
          <div className="group">
            <Row label={<input id="c-project" className="row-input" value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project title" aria-label="Project title" />} />
            <Row
              label="Type"
              value={
                <select id="c-type" className="row-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Project type">
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              }
            />
          </div>
        )}

        <div className="group">
          <div className="timeline">
            <span className="timeline-rail" aria-hidden>
              <span className="timeline-dot" />
              <span className="timeline-line" />
              <span className="timeline-dot timeline-dot--hollow" />
            </span>
            <div className="timeline-rows">
              <Row label={available ? 'From' : 'Start'} value={<input id="c-start" className="row-input row-input--right" value={start} onChange={(e) => setStart(e.target.value)} placeholder="9 Nov" aria-label="Start" />} />
              <Row label={available ? 'Until' : 'End'} value={<input id="c-end" className="row-input row-input--right" value={end} onChange={(e) => setEnd(e.target.value)} placeholder={available ? 'Open' : '21 Nov'} aria-label="End" />} />
            </div>
          </div>
        </div>

        <div className="group">
          <Row icon={<MapPin size={20} />} label={<input id="c-city" className="row-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Location" aria-label="Location" />} />
          <Row
            icon={<IndianRupee size={20} />}
            label={
              pay === 'Paid' ? (
                <input id="c-amount" className="row-input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={available ? 'Day rate' : 'Amount, e.g. ₹60k flat'} aria-label="Amount" />
              ) : (
                pay
              )
            }
            value={
              <select id="c-pay" className="row-select" value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Compensation">
                {PAY.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            }
          />
          <Row label={<textarea id="c-about" className="row-input row-area" rows={2} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Add details" aria-label="Details" />} />
        </div>

        <div>
          <div className="group">
            <Row icon={<MessageCircle size={20} />} label="Allow messages">
              <Toggle on={allowDM} onChange={setAllowDM} label="Allow messages" />
            </Row>
          </div>
          <p className="group-note">{allowDM ? 'Anyone can message you about this.' : 'People send interest. You choose who to message.'}</p>
        </div>
      </div>

      <Sheet open={picker} onClose={() => setPicker(false)} title="Cover" size="tall">
        <MediaPicker
          single
          selected={cover ? [cover] : []}
          onDone={(ms) => {
            setCover(ms[0] ?? null);
            setPicker(false);
          }}
        />
      </Sheet>
      <Sheet open={discard} onClose={() => setDiscard(false)} title="Discard?">
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
