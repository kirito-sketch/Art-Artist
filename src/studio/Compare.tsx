import { useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import './studio.css';

/*
 * Studio › Compare (/studio/compare): today's app and the District direction, each a live, tappable app in a
 * phone, shown one at a time or side by side. Only Home and Discover differ between the two; everything
 * else is the same app. Behind the shared password like the rest of Studio.
 */
type Show = 'current' | 'district' | 'both';
type Who = 'kiran' | 'tara' | 'new';
const WHO: { id: Who; label: string }[] = [
  { id: 'kiran', label: 'Kiran Varma, cinematographer' },
  { id: 'tara', label: 'Tara Menon, actor' },
  { id: 'new', label: 'Someone who just signed up' },
];
type Bg = 'artwork' | 'brand' | 'plain';
const BG: { id: Bg; label: string }[] = [
  { id: 'artwork', label: 'Top: spotlight artwork' },
  { id: 'brand', label: 'Top: brand green' },
  { id: 'plain', label: 'Top: atmosphere only' },
];
const LABEL: Record<Exclude<Show, 'both'>, string> = { current: 'Current', district: 'New' };

const src = (home: 'current' | 'district', who: Who, n: number, bg: Bg) => {
  const q = new URLSearchParams({ view: 'app', home, embed: '1', r: String(n) });
  if (home === 'district') q.set('dhbg', bg);
  if (who === 'new') q.set('flow', 'new');
  else q.set('as', who);
  return `/?${q.toString()}`;
};

// The phone is always a real 390 × 844 screen with a 10 px bezel; it is scaled as a whole to fit the window.
const PW = 410;
const PH = 864;

function Phone({ home, who, n, onRestart, scale, bg }: { home: 'current' | 'district'; who: Who; n: number; onRestart: () => void; scale: number; bg: Bg }) {
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
          <iframe key={`${home}-${who}-${n}-${home === 'district' ? bg : ''}`} title={`${LABEL[home]} app`} src={src(home, who, n, bg)} />
        </div>
      </div>
    </figure>
  );
}

export function Compare() {
  const narrow = () => typeof window !== 'undefined' && window.innerWidth < 860;
  const [show, setShow] = useState<Show>(narrow() ? 'district' : 'both');
  const [who, setWho] = useState<Who>('kiran');
  const [bg, setBg] = useState<Bg>('artwork');
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
            {(['current', 'district', 'both'] as Show[])
              .filter((s) => !(isNarrow && s === 'both'))
              .map((s) => (
                <button key={s} aria-pressed={view === s} className={view === s ? 'on' : ''} onClick={() => setShow(s)}>
                  {s === 'both' ? 'Both' : LABEL[s]}
                </button>
              ))}
          </div>
          {view !== 'current' && (
            <label className="cmp-who">
              <span className="sr-only">New Home background</span>
              <select value={bg} onChange={(e) => setBg(e.target.value as Bg)}>
                {BG.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
          )}
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
        {(view === 'both' || view === 'current') && <Phone home="current" who={who} n={n.current} onRestart={() => restart('current')} scale={scale} bg={bg} />}
        {(view === 'both' || view === 'district') && <Phone home="district" who={who} n={n.district} onRestart={() => restart('district')} scale={scale} bg={bg} />}
      </div>

      <p className="cmp-foot">In New, the clips in the spotlight are made from still images.</p>
    </div>
  );
}
