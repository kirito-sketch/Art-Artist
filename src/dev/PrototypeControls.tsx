import { useStore } from '../state/store';
import { Toggle } from '../ui/primitives';

/** Evaluation panel outside the phone. Not part of the product. */
export function PrototypeControls() {
  const { viewer, switchViewer, scenario, setScenario } = useStore();
  const rows: { key: keyof typeof scenario; label: string; help: string }[] = [
    { key: 'newUser', label: 'New user', help: 'No network, few matches, profile 40%' },
    { key: 'loading', label: 'Slow network', help: 'Skeletons, then content arrives' },
    { key: 'forYouError', label: 'For You fails', help: 'Inline error with retry' },
    { key: 'offline', label: 'Offline', help: 'Banner, disabled responses, queued sends' },
    { key: 'failPublish', label: 'Publishing fails', help: 'Upload stops at 62%, retry or keep draft' },
  ];
  return (
    <aside className="proto" aria-label="Prototype controls">
      <p className="proto-brand">
        <span className="wordmark wordmark--s">Ana</span> Prototype v0.1
      </p>
      <p className="proto-h">Signed in as</p>
      <div className="proto-seg">
        <button className={viewer.id === 'kiran' ? 'is-on' : ''} onClick={() => switchViewer('kiran')}>
          Kiran · Cinematographer
        </button>
        <button className={viewer.id === 'tara' ? 'is-on' : ''} onClick={() => switchViewer('tara')}>
          Tara · Actor
        </button>
      </div>
      <p className="proto-h">Scenarios</p>
      {rows.map((r) => (
        <div key={r.key} className="proto-row">
          <div>
            <p className="proto-label">{r.label}</p>
            <p className="proto-help">{r.help}</p>
          </div>
          <Toggle on={scenario[r.key]} onChange={(v) => setScenario({ [r.key]: v })} label={r.label} />
        </div>
      ))}
      <p className="proto-foot">Esc goes back. State resets on reload. See docs/PRODUCT_STRATEGY.md for the reasoning.</p>
    </aside>
  );
}
