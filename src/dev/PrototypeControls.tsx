import { useStore } from '../state/store';
import { Button, Toggle } from '../ui/primitives';
import { startResearch } from '../research';
import { openAdmin } from '../admin/adminMode';

type Persona = 'kiran' | 'tara' | 'konark' | 'tidewater';
const PERSONAS: { id: Persona; name: string; sub: string }[] = [
  { id: 'kiran', name: 'Kiran Varma', sub: 'Cinematographer' },
  { id: 'tara', name: 'Tara Menon', sub: 'Actor, early career' },
  { id: 'konark', name: 'Konark Pictures', sub: 'Aditi Ghosh acting for a busy house' },
  { id: 'tidewater', name: 'Tidewater Films', sub: 'Aditi Ghosh acting for a smaller house' },
];

/**
 * Evaluation panel outside the phone. Not part of the product.
 * One primary path: pick who is using Ana. Earlier explorations live in one archive, for stakeholder
 * comparison only; new product work is designed for the primary path.
 */
export function PrototypeControls() {
  const { viewer, switchViewer, scenario, setScenario, homeLayout, setHomeLayout, look, setLook, acting, setActing, houseHome, setHouseHome, houseProfile, setHouseProfile, roleModel, setRoleModel, canIssue, setCanIssue, startEntry, setPolicyUpdate, verifyPendingHouses, showToast } = useStore();
  const persona: Persona = acting === 'konark' || acting === 'tidewater' ? acting : (viewer.id as Persona);
  const isHouse = persona === 'konark' || persona === 'tidewater';
  const pick = (p: Persona) => {
    if (p === 'kiran' || p === 'tara') {
      setActing('self');
      switchViewer(p);
    } else {
      switchViewer('aditi');
      setActing(p);
    }
  };
  const rows: { key: keyof typeof scenario; label: string }[] = [
    { key: 'newUser', label: 'New user' },
    { key: 'loading', label: 'Slow network' },
    { key: 'forYouError', label: 'For you fails' },
    { key: 'offline', label: 'Offline' },
    { key: 'failPublish', label: 'Posting fails' },
    { key: 'actionsFail', label: 'Actions fail once (retry works)' },
  ];
  const activeStates = rows.filter((r) => scenario[r.key]).length;
  const archived = homeLayout === 'slides' || houseHome !== 'slate' || houseProfile !== 'work' || roleModel !== 'interest' || look !== 'minimal';
  const reset = () => {
    setHomeLayout('cards');
    setHouseHome('slate');
    setHouseProfile('work');
    setRoleModel('interest');
    setLook('minimal');
  };
  const Alt = ({ on, label, click }: { on: boolean; label: string; click: () => void }) => (
    <button className={`proto-archive-btn ${on ? 'is-on' : ''}`} onClick={on ? reset : click}>
      {label}
    </button>
  );

  return (
    <aside className="proto" aria-label="Prototype controls">
      <p className="proto-step">Who is using Ana</p>
      {PERSONAS.map((p) => (
        <button key={p.id} className={`proto-persona ${persona === p.id ? 'is-on' : ''}`} onClick={() => pick(p.id)}>
          <span className="proto-radio" />
          <span>
            <span className="proto-persona-name">{p.name}</span>
            <span className="proto-persona-sub">{p.sub}</span>
          </span>
        </button>
      ))}
      <Button block size="s" variant="secondary" onClick={startResearch}>
        Start research session
      </Button>
      <p className="proto-q-note">Opens clean as Aditi acting for Konark, without these controls. Reload to reset between participants; Shift+E to leave.</p>
      <p className="proto-q-note proto-primary-note">Primary design: Large Cards Home, Slate house Home, Work-first house page, one Interest model, Minimal visual.</p>

      {isHouse && (
        <div className="proto-row proto-row--solo">
          <span>Aditi can issue credits</span>
          <Toggle on={canIssue} onChange={setCanIssue} label="Aditi can issue credits" />
        </div>
      )}

      <p className="proto-step">Foundation flows</p>
      <div className="proto-flows">
        <button className="proto-archive-btn" onClick={() => startEntry('new')}>Start as a new person</button>
        <button className="proto-archive-btn" onClick={() => startEntry('invite')}>Accept a house invite (Saffron)</button>
        <button className="proto-archive-btn" onClick={() => startEntry('signin')}>Sign in screen</button>
        <button className="proto-archive-btn" onClick={() => setPolicyUpdate(true)}>Policy update (re-consent)</button>
        <button className="proto-archive-btn" onClick={() => (verifyPendingHouses(), showToast({ text: 'Ana team verified pending houses' }))}>Ana team: verify pending houses</button>
        <button className="proto-archive-btn" onClick={openAdmin}>Open moderation console</button>
      </div>

      <details className="proto-more" open={activeStates > 0}>
        <summary>Test states{activeStates ? ` · ${activeStates} on` : ''}</summary>
        {rows.map((r) => (
          <div key={r.key} className="proto-row">
            <span>{r.label}</span>
            <Toggle on={scenario[r.key]} onChange={(v) => setScenario({ [r.key]: v })} label={r.label} />
          </div>
        ))}
      </details>

      <details className="proto-more" open={archived}>
        <summary>Archive, for stakeholder comparison{archived ? ' · showing one' : ''}</summary>
        <p className="proto-q-note">Earlier explorations. Not maintained; tap again to return to the primary design.</p>
        <p className="proto-q-title">Individual Home</p>
        <Alt on={homeLayout === 'slides'} label="Full-screen slides" click={() => setHomeLayout('slides')} />
        <p className="proto-q-title">House Home</p>
        <Alt on={houseHome === 'pulse'} label="Pulse · activity first" click={() => setHouseHome('pulse')} />
        <Alt on={houseHome === 'queue'} label="Queue · decisions list" click={() => setHouseHome('queue')} />
        <p className="proto-q-title">House page</p>
        <Alt on={houseProfile === 'hiring'} label="Hiring first" click={() => setHouseProfile('hiring')} />
        <p className="proto-q-title">Crew and casting roles (validate)</p>
        <Alt on={roleModel === 'respond'} label="Separate Respond form" click={() => setRoleModel('respond')} />
        <p className="proto-q-title">Visual</p>
        <Alt on={look === 'glass'} label="Glass" click={() => setLook('glass')} />
        <Alt on={look === 'bold'} label="Bold" click={() => setLook('bold')} />
        <Alt on={look === 'doodle'} label="Doodle" click={() => setLook('doodle')} />
      </details>

      <details className="proto-more">
        <summary>Decided vs still open</summary>
        <p className="proto-q-title">Decided</p>
        <ul className="proto-list">
          <li>Large Cards is the individual Home</li>
          <li>People can't claim their own credits</li>
          <li>Added to project is not a credit</li>
          <li>One account; acting for a house is a separate context</li>
          <li>A house's profile is its public page</li>
          <li>No comments on posts; Mark all as read</li>
          <li>Members are permissions, not a team product</li>
          <li>One primary design; alternatives only when a real hypothesis needs it</li>
        </ul>
        <p className="proto-q-title">Still open</p>
        <ul className="proto-list">
          <li>Who issues credits inside a house; co-productions</li>
          <li>Credits for independent projects</li>
          <li>Interest vs structured responses</li>
          <li>Project publication lifecycle</li>
          <li>Linking people not yet on Ana</li>
          <li>Slate and Work first (working hypotheses)</li>
        </ul>
      </details>
      <p className="proto-foot">Prototype · Esc goes back</p>
    </aside>
  );
}
