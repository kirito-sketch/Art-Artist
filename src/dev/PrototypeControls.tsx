import { useStore } from '../state/store';
import { Toggle } from '../ui/primitives';

type Persona = 'kiran' | 'tara' | 'konark' | 'tidewater';
const PERSONAS: { id: Persona; name: string; sub: string }[] = [
  { id: 'kiran', name: 'Kiran Varma', sub: 'Cinematographer, busy profile' },
  { id: 'tara', name: 'Tara Menon', sub: 'Actor, early career' },
  { id: 'konark', name: 'Konark Pictures', sub: 'Kiran acting for a busy house' },
  { id: 'tidewater', name: 'Tidewater Films', sub: 'Kiran acting for a quiet house' },
];

type Tag = 'working' | 'alt' | 'ref' | 'open';
const TAG: Record<Tag, string> = { working: 'Working', alt: 'Alternative', ref: 'Reference', open: 'Undecided' };

function Choice<T extends string>({ title, note, value, onChange, options }: { title: string; note?: string; value: T; onChange: (v: T) => void; options: { id: T; label: string; tag: Tag }[] }) {
  return (
    <div className="proto-q">
      <p className="proto-q-title">{title}</p>
      {note && <p className="proto-q-note">{note}</p>}
      {options.map((o) => (
        <button key={o.id} className={`proto-opt ${value === o.id ? 'is-on' : ''}`} onClick={() => onChange(o.id)}>
          <span className="proto-radio" />
          <span className="proto-opt-label">{o.label}</span>
          <span className={`proto-tag proto-tag--${o.tag}`}>{TAG[o.tag]}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Evaluation panel outside the phone. Not part of the product.
 * Three steps: pick who is using Ana, compare the open questions that apply to them, then adjust
 * the look. Test states are tucked away because they are for checking edge cases, not reviewing.
 */
export function PrototypeControls() {
  const { viewer, switchViewer, scenario, setScenario, homeLayout, setHomeLayout, look, setLook, acting, setActing, houseHome, setHouseHome, houseProfile, setHouseProfile } = useStore();
  const persona: Persona = acting === 'konark' || acting === 'tidewater' ? acting : (viewer.id as Persona);
  const isHouse = persona === 'konark' || persona === 'tidewater';
  const pick = (p: Persona) => {
    if (p === 'kiran' || p === 'tara') {
      setActing('self');
      switchViewer(p);
    } else {
      switchViewer('kiran');
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
  const archived = look === 'bold' || look === 'doodle';

  return (
    <aside className="proto" aria-label="Prototype controls">
      <p className="proto-step">1 · Who is using Ana</p>
      {PERSONAS.map((p) => (
        <button key={p.id} className={`proto-persona ${persona === p.id ? 'is-on' : ''}`} onClick={() => pick(p.id)}>
          <span className="proto-radio" />
          <span>
            <span className="proto-persona-name">{p.name}</span>
            <span className="proto-persona-sub">{p.sub}</span>
          </span>
        </button>
      ))}

      <p className="proto-step">2 · Compare for this person</p>
      {isHouse ? (
        <>
          <Choice
            title="House Home"
            note="Slate: the work leads. Pulse: activity leads. Queue: a plain decisions list."
            value={houseHome}
            onChange={setHouseHome}
            options={[
              { id: 'slate', label: 'Slate', tag: 'working' },
              { id: 'pulse', label: 'Pulse', tag: 'alt' },
              { id: 'queue', label: 'Queue', tag: 'ref' },
            ]}
          />
          <Choice
            title="House page"
            note="On the Profile tab"
            value={houseProfile}
            onChange={setHouseProfile}
            options={[
              { id: 'work', label: 'Work first', tag: 'working' },
              { id: 'hiring', label: 'Hiring first', tag: 'alt' },
            ]}
          />
        </>
      ) : (
        <>
          <Choice
            title="Home"
            value={homeLayout}
            onChange={setHomeLayout}
            options={[
              { id: 'slides', label: 'A · Slides', tag: 'open' },
              { id: 'cards', label: 'B · Large cards', tag: 'open' },
            ]}
          />
          <Choice
            title="Production pages"
            note="Open any production from a role or credit"
            value={houseProfile}
            onChange={setHouseProfile}
            options={[
              { id: 'work', label: 'Work first', tag: 'working' },
              { id: 'hiring', label: 'Hiring first', tag: 'alt' },
            ]}
          />
        </>
      )}

      <p className="proto-step">3 · Look</p>
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
      <details className="proto-more" open={archived}>
        <summary>Archived looks, for stakeholders</summary>
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
      </details>

      <details className="proto-more" open={activeStates > 0}>
        <summary>Test states{activeStates ? ` · ${activeStates} on` : ''}</summary>
        {rows.map((r) => (
          <div key={r.key} className="proto-row">
            <span>{r.label}</span>
            <Toggle on={scenario[r.key]} onChange={(v) => setScenario({ [r.key]: v })} label={r.label} />
          </div>
        ))}
      </details>
      <p className="proto-foot">Prototype v2 · Esc goes back</p>
    </aside>
  );
}
