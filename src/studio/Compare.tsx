import { useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import './studio.css';

/*
 * Studio › Compare (/studio/compare): today's app and the District direction, each a live, tappable app in a
 * phone, shown one at a time or side by side, including the house pages and flows.
 * Behind the shared password like the rest of Studio.
 */
type Show = 'current' | 'district' | 'both';
type Who = 'kiran' | 'tara' | 'new' | 'konark' | 'tidewater';
const WHO: { id: Who; label: string }[] = [
  { id: 'kiran', label: 'Kiran Varma, cinematographer' },
  { id: 'tara', label: 'Tara Menon, actor' },
  { id: 'new', label: 'Someone who just signed up' },
  { id: 'konark', label: 'Konark Pictures, production house' },
  { id: 'tidewater', label: 'Tidewater Films, production house' },
];
const LABEL: Record<Exclude<Show, 'both'>, string> = { current: 'Legacy Home', district: 'New Home (default)' };

const src = (home: 'current' | 'district', who: Who, n: number) => {
  const q = new URLSearchParams({ view: 'app', home: home === 'current' ? 'legacy' : home, embed: '1', r: String(n) });
  if (who === 'new') q.set('flow', 'new');
  else q.set('as', who);
  return `/?${q.toString()}`;
};

// The phone is always a real 390 × 844 screen with a 10 px bezel; it is scaled as a whole to fit the window.
const PW = 410;
const PH = 864;

function Phone({ home, who, n, onRestart, scale }: { home: 'current' | 'district'; who: Who; n: number; onRestart: () => void; scale: number }) {
  return (
    <figure className="cmp-phone">
      <figcaption className="cmp-cap">
        <span className={`cmp-tag cmp-tag--${home}`}>{LABEL[home]}</span>
        <button className="cmp-restart" onClick={onRestart} aria-label={`Restart ${LABEL[home]}`}>
          <RotateCcw size={14} aria-hidden /> Restart
        </button>
      </figcaption>
      <div className="cmp-fit" style={{ width: PW * scale, height: PH * scale }}>
        <div className="cmp-frame" style={{ transform: `scale(${scale})` }}>
          <iframe key={`${home}-${who}-${n}`} title={`${LABEL[home]} app`} src={src(home, who, n)} />
        </div>
      </div>
    </figure>
  );
}

/*
 * Studio › Compare › Post actions (/studio/compare?set=actions): the production row under the media beside the two
 * archived treatments, each a live app on the same review posts (docs/ux-refinement/PLAN.md D1). The archived ones
 * exist only here: the regular app never renders them.
 */
const ACTIONS: { id: 'row' | 'pill' | 'notch'; label: string }[] = [
  { id: 'row', label: 'Row under the media (live)' },
  { id: 'pill', label: 'Original Action Pill (archived)' },
  { id: 'notch', label: 'Corner Notch (archived)' },
];
function ActionsCompare() {
  const fit = () => (typeof window === 'undefined' ? 1 : Math.min(1, (window.innerHeight - 170) / PH, (window.innerWidth - 64) / (PW * 3)));
  const [scale, setScale] = useState(fit());
  const [n, setN] = useState(0);
  useEffect(() => {
    document.title = 'Post actions · Art and Artist Studio';
    const r = () => setScale(Math.max(0.42, fit()));
    r();
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  return (
    <div className="st st--wide cmp">
      <header className="cmp-head">
        <a className="cmp-back" href="/studio">
          <ArrowLeft size={14} aria-hidden /> Studio
        </a>
        <button className="cmp-restart" onClick={() => setN((x) => x + 1)} aria-label="Restart all three">
          <RotateCcw size={14} aria-hidden /> Restart
        </button>
      </header>
      <div className="cmp-stage cmp-stage--both cmp-stage--three">
        {ACTIONS.map((a) => (
          <figure key={a.id} className="cmp-phone">
            <figcaption className="cmp-cap">
              <span className={`cmp-tag ${a.id === 'row' ? 'cmp-tag--district' : 'cmp-tag--current'}`}>{a.label}</span>
            </figcaption>
            <div className="cmp-fit" style={{ width: PW * scale, height: PH * scale }}>
              <div className="cmp-frame" style={{ transform: `scale(${scale})` }}>
                <iframe key={`${a.id}-${n}`} title={a.label} src={`/?view=app&embed=1&samples&actions=${a.id}&r=${n}`} />
              </div>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function Compare() {
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('set') === 'actions') return <ActionsCompare />;
  return <CompareHomes />;
}

function CompareHomes() {
  const narrow = () => typeof window !== 'undefined' && window.innerWidth < 860;
  const [show, setShow] = useState<Show>(narrow() ? 'district' : 'both');
  const [who, setWho] = useState<Who>('kiran');
  const [n, setN] = useState({ current: 0, district: 0 });
  const [isNarrow, setNarrow] = useState(narrow());
  const fit = () => (typeof window === 'undefined' ? 1 : Math.min(1, (window.innerHeight - 210) / PH, (window.innerWidth - 32) / PW));
  const [scale, setScale] = useState(fit());
  useEffect(() => {
    document.title = 'Compare · Art and Artist Studio';
    const r = () => (setNarrow(narrow()), setScale(fit()));
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  const view: Show = isNarrow && show === 'both' ? 'district' : show;
  const restart = (h: 'current' | 'district') => setN((x) => ({ ...x, [h]: x[h] + 1 }));

  return (
    <div className="st st--wide cmp">
      <header className="cmp-head">
        <a className="cmp-back" href="/studio">
          <ArrowLeft size={14} aria-hidden /> Studio
        </a>
        <div className="cmp-controls">
          <div className="cmp-seg" role="group" aria-label="Show">
            {(['district', 'current', 'both'] as Show[])
              .filter((s) => !(isNarrow && s === 'both'))
              .map((s) => (
                <button key={s} aria-pressed={view === s} className={view === s ? 'on' : ''} onClick={() => setShow(s)}>
                  {s === 'both' ? 'Both' : LABEL[s]}
                </button>
              ))}
          </div>
          <label className="cmp-who">
            <span className="sr-only">Person</span>
            <select value={who} onChange={(e) => setWho(e.target.value as Who)}>
              {WHO.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className={`cmp-stage ${view === 'both' ? 'cmp-stage--both' : ''}`}>
        {(view === 'both' || view === 'district') && <Phone home="district" who={who} n={n.district} onRestart={() => restart('district')} scale={scale} />}
        {(view === 'both' || view === 'current') && <Phone home="current" who={who} n={n.current} onRestart={() => restart('current')} scale={scale} />}
      </div>

      {who !== 'konark' && who !== 'tidewater' && <p className="cmp-foot">In the New Home, the clips in the spotlight are made from still images.</p>}
    </div>
  );
}
