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
const LABEL: Record<Exclude<Show, 'both'>, string> = { current: 'Current', district: 'New' };

const src = (home: 'current' | 'district', who: Who, n: number) => {
  const q = new URLSearchParams({ view: 'app', home, embed: '1', r: String(n) });
  if (who === 'new') q.set('flow', 'new');
  else q.set('as', who);
  return `/?${q.toString()}`;
};

function Phone({ home, who, n, onRestart }: { home: 'current' | 'district'; who: Who; n: number; onRestart: () => void }) {
  return (
    <figure className="cmp-phone">
      <figcaption className="cmp-cap">
        <span className={`cmp-tag cmp-tag--${home}`}>{LABEL[home]}</span>
        <button className="cmp-restart" onClick={onRestart} aria-label={`Restart ${LABEL[home]}`}>
          <RotateCcw size={14} aria-hidden /> Restart
        </button>
      </figcaption>
      <div className="cmp-frame">
        <iframe key={`${home}-${who}-${n}`} title={`${LABEL[home]} app`} src={src(home, who, n)} />
      </div>
    </figure>
  );
}

export function Compare() {
  const narrow = () => typeof window !== 'undefined' && window.innerWidth < 860;
  const [show, setShow] = useState<Show>(narrow() ? 'district' : 'both');
  const [who, setWho] = useState<Who>('kiran');
  const [n, setN] = useState({ current: 0, district: 0 });
  const [isNarrow, setNarrow] = useState(narrow());
  useEffect(() => {
    document.title = 'Compare · Art and Artist Studio';
    const r = () => setNarrow(narrow());
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
        {(view === 'both' || view === 'current') && <Phone home="current" who={who} n={n.current} onRestart={() => restart('current')} />}
        {(view === 'both' || view === 'district') && <Phone home="district" who={who} n={n.district} onRestart={() => restart('district')} />}
      </div>

      <p className="cmp-foot">In New, the clips in the spotlight are made from still images and the reviews are sample content.</p>
    </div>
  );
}
