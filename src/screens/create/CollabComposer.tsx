import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ImagePlus, MessageCircle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import type { Media, Opportunity } from '../../data/types';
import { useStore } from '../../state/store';
import { person } from '../../state/selectors';
import { Button, Segmented, Toggle } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { Still } from '../../ui/Still';
import { OpportunityCard } from '../home/OpportunityCard';
import { MediaPicker } from './PostComposer';

const ROLES = ['Cinematographer', '1st AC', 'Gaffer', 'Editor', 'Colourist', 'Sound recordist', 'Production designer', 'Actor', 'Costume designer'];
const TYPES = ['Short film', 'Feature film', 'Web series', 'Music video', 'Ad film', 'Documentary', 'Theatre'];
const PAY = ['Paid', 'Unpaid', 'Deferred', 'Negotiable'];
const STAGES = ['Development', 'Funded', 'Pre-production', 'Shooting'];

type Intent = 'looking' | 'available';

function Picks({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="chip-picker chip-picker--wrap">
      {options.map((o) => (
        <button key={o} type="button" className={`pick ${value === o ? 'is-on' : ''}`} onClick={() => onChange(value === o ? '' : o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

/**
 * Structured collaboration composer. The result is a typed card, not a text post, so it can be
 * matched, filtered in Discover and answered with the right permission model.
 */
export function CollabComposer({ intent: initial = 'looking' }: { intent?: Intent }) {
  const { pop, viewer, publishCollab } = useStore();
  const me = person(viewer.id);
  const [intent, setIntent] = useState<Intent>(initial);
  const [step, setStep] = useState<0 | 1>(0);
  const [role, setRole] = useState(initial === 'available' ? me.role : '');
  const [project, setProject] = useState('');
  const [type, setType] = useState('');
  const [city, setCity] = useState(me.city);
  const [dates, setDates] = useState('');
  const [pay, setPay] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState('');
  const [about, setAbout] = useState('');
  const [looking, setLooking] = useState('');
  const [cover, setCover] = useState<Media | null>(null);
  const [allowDM, setAllowDM] = useState(initial === 'available');
  const [picker, setPicker] = useState(false);
  const [discard, setDiscard] = useState(false);

  const available = intent === 'available';
  const missing = [!role && 'role', !available && !project && 'project', !city && 'location', !dates && 'dates'].filter(Boolean) as string[];
  const dirty = !!(project || dates || about || looking || cover || (role && !available));

  const build = (): Opportunity => ({
    id: `mine-${Date.now()}`,
    kind: 'collab',
    collabIntent: intent,
    role: role || me.role,
    project: available ? 'Open to new projects' : project,
    projectType: available ? `${me.years ?? 1} yrs experience` : type || 'Independent project',
    authorId: viewer.id,
    allowDM,
    city,
    dates: dates || 'Flexible',
    compensation: pay === 'Paid' ? amount || 'Paid' : pay || (available ? 'Day rate on request' : 'To be discussed'),
    paid: pay === 'Paid' || (available && pay !== 'Unpaid'),
    stage: available ? 'Available' : stage || 'In development',
    about: about || (available ? `${me.name} is available for ${role.toLowerCase()} work.` : 'Details to follow.'),
    lookingFor: looking ? looking.split('\n').filter(Boolean) : [available ? 'Features, series and brand films' : 'Someone who loves the work'],
    match: [],
    forCrafts: [],
    media: cover ?? seed.portfolio[viewer.id][1] ?? seed.cameraRoll[0],
    postedAgo: 'now',
  });

  return (
    <div className="composer">
      <header className="composer-bar">
        {step === 0 ? (
          <button className="composer-cancel" onClick={() => (dirty ? setDiscard(true) : pop())}>
            Cancel
          </button>
        ) : (
          <button className="composer-cancel composer-cancel--icon" onClick={() => setStep(0)} aria-label="Back to details">
            <ChevronLeft size={20} /> Edit
          </button>
        )}
        <p className="composer-title">{step === 0 ? 'New collaboration' : 'Preview'}</p>
        <span className="composer-step">{step + 1}/2</span>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {step === 0 ? (
          <motion.div key="details" className="composer-body composer-body--form" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
            <Segmented
              id="intent"
              value={intent}
              onChange={(v) => {
                setIntent(v);
                setAllowDM(v === 'available');
                if (v === 'available' && !role) setRole(me.role);
              }}
              options={[
                { value: 'looking', label: 'Looking for someone' },
                { value: 'available', label: 'Available for work' },
              ]}
            />

            <div className="field">
              <label className="form-label">{available ? 'Available as' : 'Role needed'}</label>
              <Picks options={available ? [me.role, ...ROLES.filter((r) => r !== me.role)].slice(0, 6) : ROLES} value={role} onChange={setRole} />
            </div>

            {!available && (
              <>
                <div className="field">
                  <label className="form-label" htmlFor="c-project">
                    Project title
                  </label>
                  <input id="c-project" className="input" value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. The Quiet Hours" />
                </div>
                <div className="field">
                  <label className="form-label">Project type</label>
                  <Picks options={TYPES} value={type} onChange={setType} />
                </div>
              </>
            )}

            <div className="field-row">
              <div className="field">
                <label className="form-label" htmlFor="c-city">
                  {available ? 'Based in' : 'Location'}
                </label>
                <input id="c-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="field">
                <label className="form-label" htmlFor="c-dates">
                  {available ? 'From' : 'Dates'}
                </label>
                <input id="c-dates" className="input" value={dates} onChange={(e) => setDates(e.target.value)} placeholder={available ? '3 Oct' : '9 – 21 Nov'} />
              </div>
            </div>

            <div className="field">
              <label className="form-label">{available ? 'Rate' : 'Compensation'}</label>
              <Picks options={PAY} value={pay} onChange={setPay} />
              <AnimatePresence initial={false}>
                {pay === 'Paid' && (
                  <motion.input
                    className="input"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 46, marginTop: 10 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="₹ per day or flat"
                  />
                )}
              </AnimatePresence>
              {pay === 'Unpaid' && <p className="form-help form-help--note">Say what people get instead (credit, meals, travel) in About.</p>}
            </div>

            {!available && (
              <div className="field">
                <label className="form-label">Production stage</label>
                <Picks options={STAGES} value={stage} onChange={setStage} />
              </div>
            )}

            <div className="field">
              <label className="form-label" htmlFor="c-about">
                {available ? 'What you are looking for' : 'About the project'}
              </label>
              <textarea id="c-about" className="input input--area" rows={3} value={about} onChange={(e) => setAbout(e.target.value)} placeholder={available ? 'Kinds of projects, languages, whether you travel' : 'Story, tone, what makes it worth doing'} />
            </div>

            {!available && (
              <div className="field">
                <label className="form-label" htmlFor="c-looking">
                  Who would be a great fit <span className="muted">(one per line)</span>
                </label>
                <textarea id="c-looking" className="input input--area" rows={2} value={looking} onChange={(e) => setLooking(e.target.value)} placeholder="Comfortable with handheld night work" />
              </div>
            )}

            <div className="field">
              <label className="form-label">Cover image <span className="muted">(optional)</span></label>
              <button className="cover-pick" onClick={() => setPicker(true)}>
                {cover ? <Still media={cover} /> : (
                  <span className="cover-pick-empty">
                    <ImagePlus size={20} />
                    Add a still, poster or moodboard frame
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="preview" className="composer-body composer-body--form" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}>
            <p className="form-help">This is how it appears in For You and Discover.</p>
            <div className="preview-card">
              <OpportunityCard o={build()} onOpen={() => undefined} />
            </div>

            <div className="dm-setting">
              <div className="form-row form-row--toggle">
                <div>
                  <p className="form-label">Allow direct messages</p>
                  <p className="form-help">{allowDM ? 'People can message you straight away.' : 'People send interest. You review profiles and message the ones you want.'}</p>
                </div>
                <Toggle on={allowDM} onChange={setAllowDM} label="Allow direct messages" />
              </div>
              <div className="dm-explain">
                <span className={`dm-mode ${allowDM ? 'is-on' : ''}`}>
                  <span className="dm-mode-label">Viewers see</span>
                  <b>
                    <MessageCircle size={14} /> Message
                  </b>
                </span>
                <span className={`dm-mode ${!allowDM ? 'is-on' : ''}`}>
                  <span className="dm-mode-label">Viewers see</span>
                  <b>
                    <Sparkles size={14} /> Show interest
                  </b>
                </span>
              </div>
            </div>
            {available && <p className="form-fineprint">Publishing also marks you as available on your profile from {dates || 'now'}. You can switch it off anytime.</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="composer-footer">
        {step === 0 ? (
          <Button block size="l" disabled={missing.length > 0} onClick={() => setStep(1)}>
            {missing.length ? `Add ${missing.join(', ')}` : 'Preview'}
          </Button>
        ) : (
          <Button block size="l" onClick={() => publishCollab(build())}>
            Publish collaboration
          </Button>
        )}
      </div>

      <Sheet open={picker} onClose={() => setPicker(false)} title="Cover image" size="tall">
        <MediaPicker
          single
          selected={cover ? [cover] : []}
          onDone={(ms) => {
            setCover(ms[0] ?? null);
            setPicker(false);
          }}
        />
      </Sheet>
      <Sheet open={discard} onClose={() => setDiscard(false)} title="Discard this collaboration?" showClose={false}>
        <div className="form">
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
