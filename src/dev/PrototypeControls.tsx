import { useStore } from '../state/store';
import { Toggle } from '../ui/primitives';

/** Evaluation panel outside the phone. Not part of the product. */
export function PrototypeControls() {
  const { viewer, switchViewer, scenario, setScenario, homeLayout, setHomeLayout, look, setLook } = useStore();
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
        <button className={viewer.id === 'kiran' ? 'is-on' : ''} onClick={() => switchViewer('kiran')}>
          Kiran · Cinematographer
        </button>
        <button className={viewer.id === 'tara' ? 'is-on' : ''} onClick={() => switchViewer('tara')}>
          Tara · Actor
        </button>
      </div>
      <p className="proto-h">Visual direction</p>
      <div className="proto-seg">
        {(
          [
            ['minimal', 'Minimal'],
            ['glass', 'Glass'],
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
