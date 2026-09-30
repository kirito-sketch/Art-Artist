import { useStore } from '../state/store';
import { Toggle } from '../ui/primitives';

/** Evaluation panel outside the phone. Not part of the product. */
export function PrototypeControls() {
  const { viewer, switchViewer, scenario, setScenario, homeLayout, setHomeLayout, look, setLook, acting, setActing, houseHome, setHouseHome, houseProfile, setHouseProfile } = useStore();
  const rows: { key: keyof typeof scenario; label: string }[] = [
    { key: 'newUser', label: 'New user' },
    { key: 'loading', label: 'Slow network' },
    { key: 'forYouError', label: 'For you fails' },
    { key: 'offline', label: 'Offline' },
    { key: 'failPublish', label: 'Posting fails' },
  ];
  return (
    <aside className="proto" aria-label="Prototype controls">
      <p className="proto-h">Signed in as</p>
      <div className="proto-seg">
        <button className={acting === 'self' && viewer.id === 'kiran' ? 'is-on' : ''} onClick={() => { setActing('self'); switchViewer('kiran'); }}>
          Kiran · Cinematographer
        </button>
        <button className={acting === 'self' && viewer.id === 'tara' ? 'is-on' : ''} onClick={() => { setActing('self'); switchViewer('tara'); }}>
          Tara · Actor
        </button>
      </div>
      <div className="proto-seg">
        <button className={acting === 'konark' ? 'is-on' : ''} onClick={() => { switchViewer('kiran'); setActing('konark'); }}>
          Kiran, acting for Konark
        </button>
        <button className={acting === 'tidewater' ? 'is-on' : ''} onClick={() => { switchViewer('kiran'); setActing('tidewater'); }}>
          Kiran, acting for Tidewater
        </button>
      </div>
      <p className="proto-h">House Home (hypotheses)</p>
      <div className="proto-seg">
        {([['slate', 'A · Slate'], ['pulse', 'B · Pulse'], ['queue', 'C · Queue']] as const).map(([id, label]) => (
          <button key={id} className={houseHome === id ? 'is-on' : ''} onClick={() => setHouseHome(id)}>
            {label}
          </button>
        ))}
      </div>
      <p className="proto-h">House profile order</p>
      <div className="proto-seg">
        {([['work', 'A · Work first'], ['hiring', 'B · Hiring first']] as const).map(([id, label]) => (
          <button key={id} className={houseProfile === id ? 'is-on' : ''} onClick={() => setHouseProfile(id)}>
            {label}
          </button>
        ))}
      </div>
      <p className="proto-h">Visual direction</p>
      <div className="proto-seg">
        {(
          [
            ['minimal', 'Minimal'],
            ['glass', 'Glass'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} className={look === id ? 'is-on' : ''} onClick={() => setLook(id)}>
            {label}
          </button>
        ))}
      </div>
      <p className="proto-h">Archived, for comparison</p>
      <div className="proto-seg proto-seg--archived">
        {(
          [
            ['bold', 'Bold'],
            ['doodle', 'Doodle'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} className={look === id ? 'is-on' : ''} onClick={() => setLook(id)}>
            {label}
          </button>
        ))}
      </div>
      <p className="proto-h">Home layout</p>
      <div className="proto-seg">
        <button className={homeLayout === 'slides' ? 'is-on' : ''} onClick={() => setHomeLayout('slides')}>
          A · Full-screen slides
        </button>
        <button className={homeLayout === 'cards' ? 'is-on' : ''} onClick={() => setHomeLayout('cards')}>
          B · Large cards
        </button>
      </div>
      <p className="proto-h">Scenarios</p>
      {rows.map((r) => (
        <div key={r.key} className="proto-row">
          <span>{r.label}</span>
          <Toggle on={scenario[r.key]} onChange={(v) => setScenario({ [r.key]: v })} label={r.label} />
        </div>
      ))}
      <p className="proto-foot">Prototype v2 · Esc goes back</p>
    </aside>
  );
}
