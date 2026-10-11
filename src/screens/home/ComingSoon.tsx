import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Work } from '../../data/works';
import { useStore } from '../../state/store';
import { creditedOn } from '../../state/world';
import { Photo, PressCard } from '../../ui/primitives';
import { useTabTint } from '../../ui/tabTint';

/**
 * Coming soon: dark cards for films not released yet. The card nearest the middle of the rail plays its trailer,
 * muted, inside the card; the others hold on the poster. Poster only for reduced motion and data saver.
 * (The prototype has no uploaded trailers yet, so a clip from the stand-in set plays; native uses the film's own.)
 */
const CLIPS = ['kaaval', 'faultlines', 'monsoon', 'neeliraat', 'neela', 'backwaters'];
const clipFor = (w: Work) => w.trailers?.find((t) => t.status === 'published')?.url ?? `video/${CLIPS[[...w.id].reduce((a, c) => a + c.charCodeAt(0), 0) % CLIPS.length]}.mp4`;

function playsMotion() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const c = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  return !c?.saveData;
}

function releasing(w: Work) {
  if (!w.releaseDate) return `Coming ${w.year}`;
  const d = new Date(w.releaseDate + 'T00:00:00');
  return `Releasing ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

function Card({ w, centred }: { w: Work; centred: boolean }) {
  const { push, following } = useStore();
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const motion = playsMotion();
  const known = creditedOn(w.id).filter((id) => following.includes(id)).length;
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (centred && motion) void v.play().catch(() => undefined);
    else v.pause();
  }, [centred, motion]);
  return (
    <article className={`csoon-card${centred ? ' is-centred' : ''}`}>
      <PressCard className="csoon-main" onPress={() => push({ name: 'work', id: w.id })} scale={0.985} aria-label={`${w.title}. ${releasing(w)}`}>
        <span className="csoon-media" aria-hidden>
          <Photo surface="spotlight" media={w.media} showPlay={false} />
          {motion && <video ref={ref} key={clipFor(w)} className={ready ? 'is-ready' : ''} muted={muted} loop playsInline preload="metadata" onPlaying={() => setReady(true)}>
            {clipFor(w).endsWith('.mp4') && <source src={clipFor(w).replace(/\.mp4$/, '.webm')} type="video/webm" />}
            <source src={clipFor(w)} />
          </video>}
        </span>
        <span className="csoon-text">
          <b>{w.title}</b>
          <i>{releasing(w)}</i>
          {known > 0 && <i>{known} {known === 1 ? 'person' : 'people'} you follow worked on it</i>}
        </span>
      </PressCard>
      {motion && centred && (
        <button className="csoon-sound" aria-label={muted ? 'Turn sound on' : 'Mute'} aria-pressed={!muted} onClick={() => setMuted((m) => !m)}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </article>
  );
}

export function ComingSoon({ films }: { films: Work[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [centre, setCentre] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  useTabTint(films[centre]?.media.src, onScreen);
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => {
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0, bestD = Infinity;
      [...el.children].forEach((c, i) => {
        const e = c as HTMLElement;
        const d = Math.abs(e.offsetLeft + e.offsetWidth / 2 - mid);
        if (d < bestD) { best = i; bestD = d; }
      });
      setCentre((p) => (p === best ? p : best));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const io = new IntersectionObserver(([e]) => setOnScreen(e.intersectionRatio > 0.5), { threshold: [0, 0.5, 1] });
    io.observe(el);
    return () => { el.removeEventListener('scroll', update); io.disconnect(); };
  }, [films.length]);
  return (
    <div className="csoon" ref={rail} role="group" aria-label="Coming soon">
      {films.map((w, i) => <Card key={w.id} w={w} centred={i === centre} />)}
    </div>
  );
}
