import { memo, useMemo, useState } from 'react';
import type { Media, Mood, Motif } from '../data/types';
import { ImageOff, Play } from 'lucide-react';

/*
 * Procedural "cinematic still".
 * No licensed imagery is available to the prototype, so media renders as a seeded, lit scene:
 * graded sky, a light source, layered terrain and a silhouette motif, finished with grain and vignette.
 * When a real `src` is supplied it takes over; if it fails to load we fall back to the designed
 * missing-media state instead of a broken image.
 */

const PALETTES: Record<Mood, { sky: [string, string, string]; light: string; far: string; near: string; ink: string }> = {
  golden: { sky: ['#2b1b2c', '#a24a2a', '#f2a04e'], light: '#ffd9a0', far: '#5a2a22', near: '#1a0f0b', ink: '#0d0806' },
  dusk: { sky: ['#15183a', '#5b3b6b', '#e08a6c'], light: '#ffc4a0', far: '#3a2746', near: '#140f1c', ink: '#090610' },
  monsoon: { sky: ['#0c171c', '#294850', '#8db0aa'], light: '#dcebe5', far: '#1f3a3f', near: '#0b1517', ink: '#050b0c' },
  neon: { sky: ['#0a0716', '#3b1150', '#df3f7c'], light: '#ff8fc0', far: '#26103a', near: '#0c0716', ink: '#05030a' },
  tungsten: { sky: ['#140c07', '#44260f', '#d0802f'], light: '#ffcf8a', far: '#2c1a0e', near: '#120a05', ink: '#080402' },
  dawn: { sky: ['#1b2433', '#6c7c90', '#ecc8a4'], light: '#fff0da', far: '#3f4a5a', near: '#161b24', ink: '#0a0d12' },
  desert: { sky: ['#2c1911', '#a3532a', '#f1b56d'], light: '#ffe2b0', far: '#6b3419', near: '#1f110a', ink: '#0e0704' },
  night: { sky: ['#04060c', '#0f1a2f', '#3a5a8a'], light: '#cfe0ff', far: '#0f1a2a', near: '#05080f', ink: '#020306' },
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 400;
const H = 500;

function ridge(r: () => number, base: number, amp: number, steps: number) {
  let d = `M0 ${H} L0 ${base}`;
  for (let i = 1; i <= steps; i++) {
    const x = (W / steps) * i;
    const y = base - r() * amp;
    const cx = x - W / steps / 2;
    d += ` Q${cx.toFixed(1)} ${(y - r() * amp * 0.4).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d} L${W} ${H} Z`;
}

/** Backlit figure: sloped shoulders, tapered neck, slightly narrower hips, legs apart. */
function personPath(x: number, g: number, h: number) {
  const s = h / 100;
  const X = (dx: number) => (x + dx * s).toFixed(1);
  const Y = (dy: number) => (g - h + dy * s).toFixed(1);
  return `M${X(-3)} ${Y(13)}
    C${X(-3)} ${Y(16)} ${X(-4)} ${Y(17)} ${X(-6)} ${Y(18)}
    C${X(-11)} ${Y(19)} ${X(-13)} ${Y(20)} ${X(-14)} ${Y(24)}
    L${X(-16)} ${Y(52)} L${X(-12.5)} ${Y(53)} L${X(-11)} ${Y(34)}
    L${X(-10)} ${Y(52)} L${X(-9)} ${Y(100)} L${X(-2.5)} ${Y(100)} L${X(0)} ${Y(58)}
    L${X(2.5)} ${Y(100)} L${X(9)} ${Y(100)} L${X(10)} ${Y(52)} L${X(11)} ${Y(34)}
    L${X(12.5)} ${Y(53)} L${X(16)} ${Y(52)} L${X(14)} ${Y(24)}
    C${X(13)} ${Y(20)} ${X(11)} ${Y(19)} ${X(6)} ${Y(18)}
    C${X(4)} ${Y(17)} ${X(3)} ${Y(16)} ${X(3)} ${Y(13)} Z`;
}

function Person({ x, g, h, fill }: { x: number; g: number; h: number; fill: string }) {
  const s = h / 100;
  return (
    <g fill={fill}>
      <ellipse cx={x} cy={g - h + 7.5 * s} rx={5.4 * s} ry={6.6 * s} />
      <path d={personPath(x, g, h)} />
    </g>
  );
}

function Camera({ x, g, fill }: { x: number; g: number; fill: string }) {
  return (
    <g fill={fill} stroke={fill} strokeLinecap="round">
      <line x1={x} y1={g - 78} x2={x - 26} y2={g} strokeWidth={3.5} />
      <line x1={x} y1={g - 78} x2={x + 24} y2={g} strokeWidth={3.5} />
      <line x1={x} y1={g - 78} x2={x + 3} y2={g} strokeWidth={3} />
      <rect x={x - 22} y={g - 104} width={46} height={26} rx={3} />
      <rect x={x + 22} y={g - 99} width={18} height={14} rx={2} />
      <rect x={x + 38} y={g - 104} width={6} height={24} rx={1} />
      <rect x={x - 12} y={g - 114} width={20} height={10} rx={2} />
      <circle cx={x - 8} cy={g - 122} r={9} />
      <circle cx={x + 12} cy={g - 122} r={9} />
    </g>
  );
}

function LightStand({ x, g, fill, glow, flip }: { x: number; g: number; fill: string; glow: string; flip?: boolean }) {
  const dir = flip ? -1 : 1;
  return (
    <g>
      <polygon
        points={`${x + dir * 20},${g - 150} ${x + dir * 180},${g - 20} ${x + dir * 40},${g + 10}`}
        fill={glow}
        opacity={0.16}
      />
      <g fill={fill} stroke={fill} strokeLinecap="round">
        <line x1={x} y1={g} x2={x} y2={g - 150} strokeWidth={3} />
        <line x1={x} y1={g - 20} x2={x - 18} y2={g} strokeWidth={3} />
        <line x1={x} y1={g - 20} x2={x + 18} y2={g} strokeWidth={3} />
        <rect x={x - 4 + dir * 4} y={g - 186} width={46} height={40} rx={3} transform={`rotate(${dir * 28} ${x} ${g - 160})`} />
      </g>
    </g>
  );
}

function Skyline({ r, g, fill, glow }: { r: () => number; g: number; fill: string; glow: string }) {
  const blocks: JSX.Element[] = [];
  let x = -10;
  let i = 0;
  while (x < W + 10) {
    const w = 26 + r() * 46;
    const h = 60 + r() * 170;
    blocks.push(<rect key={`b${i}`} x={x} y={g - h} width={w} height={h + 4} fill={fill} />);
    for (let wy = g - h + 12; wy < g - 10; wy += 16) {
      for (let wx = x + 6; wx < x + w - 8; wx += 12) {
        if (r() > 0.72) blocks.push(<rect key={`w${i}-${wx}-${wy}`} x={wx} y={wy} width={4} height={6} fill={glow} opacity={0.5 + r() * 0.4} />);
      }
    }
    x += w + 2;
    i++;
  }
  return <g>{blocks}</g>;
}

function Scene({ seed, mood, motif }: { seed: string; mood: Mood; motif: Motif }) {
  const pal = PALETTES[mood];
  const r = rng(seed);
  const id = `s${hash(seed + mood + motif).toString(36)}`;
  const lightX = 60 + r() * 280;
  const lightY = motif === 'interior' || motif === 'stage' ? 120 + r() * 80 : 170 + r() * 110;
  const horizon = motif === 'sea' ? 300 + r() * 30 : 330 + r() * 40;
  const g = 450 + r() * 20;
  const subjectX = 110 + r() * 180;

  let content: JSX.Element | null = null;
  switch (motif) {
    case 'crew':
      content = (
        <>
          <path d={ridge(r, horizon, 70, 5)} fill={pal.far} opacity={0.9} />
          <path d={ridge(r, g - 10, 24, 4)} fill={pal.near} />
          <LightStand x={subjectX - 110} g={g} fill={pal.ink} glow={pal.light} />
          <Camera x={subjectX + 10} g={g} fill={pal.ink} />
          <Person x={subjectX - 34} g={g} h={150} fill={pal.ink} />
          <Person x={subjectX + 120} g={g + 6} h={140} fill={pal.ink} />
        </>
      );
      break;
    case 'figure':
      content = (
        <>
          <path d={ridge(r, horizon, 50, 4)} fill={pal.far} opacity={0.85} />
          <path d={ridge(r, g, 16, 3)} fill={pal.near} />
          <Person x={subjectX} g={g + 110} h={360} fill={pal.ink} />
        </>
      );
      break;
    case 'landscape':
      content = (
        <>
          <path d={ridge(r, horizon - 40, 110, 6)} fill={pal.far} opacity={0.7} />
          <path d={ridge(r, horizon + 20, 80, 5)} fill={pal.near} opacity={0.9} />
          <path d={ridge(r, g, 30, 4)} fill={pal.ink} />
        </>
      );
      break;
    case 'street':
      content = (
        <>
          <Skyline r={r} g={g - 20} fill={pal.far} glow={pal.light} />
          <rect x={0} y={g - 22} width={W} height={H} fill={pal.near} />
          <rect x={0} y={g - 22} width={W} height={3} fill={pal.light} opacity={0.25} />
          <Person x={subjectX} g={g + 20} h={170} fill={pal.ink} />
        </>
      );
      break;
    case 'stage':
      content = (
        <>
          <polygon points={`${lightX - 20},0 ${lightX + 20},0 ${subjectX + 110},${g} ${subjectX - 110},${g}`} fill={pal.light} opacity={0.14} />
          <ellipse cx={subjectX} cy={g} rx={120} ry={16} fill={pal.light} opacity={0.22} />
          <rect x={0} y={g} width={W} height={H} fill={pal.near} />
          <Person x={subjectX} g={g + 4} h={230} fill={pal.ink} />
        </>
      );
      break;
    case 'sea':
      content = (
        <>
          <path d={ridge(r, horizon - 6, 26, 3)} fill={pal.far} opacity={0.6} />
          <rect x={0} y={horizon} width={W} height={H} fill={pal.near} opacity={0.92} />
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} x={lightX - 40 - r() * 60} y={horizon + 8 + i * 12} width={60 + r() * 90} height={2} fill={pal.light} opacity={0.35 - i * 0.03} />
          ))}
          <path d={ridge(r, g + 10, 12, 3)} fill={pal.ink} />
          <Person x={subjectX} g={g + 8} h={120} fill={pal.ink} />
        </>
      );
      break;
    case 'road':
      content = (
        <>
          <path d={ridge(r, horizon, 60, 5)} fill={pal.far} opacity={0.8} />
          <rect x={0} y={horizon + 30} width={W} height={H} fill={pal.near} />
          <polygon points={`${W / 2 - 8},${horizon + 30} ${W / 2 + 8},${horizon + 30} ${W / 2 + 190},${H} ${W / 2 - 190},${H}`} fill={pal.ink} opacity={0.8} />
          <g fill={pal.ink}>
            <rect x={subjectX - 40} y={g - 44} width={92} height={28} rx={8} />
            <rect x={subjectX - 22} y={g - 64} width={54} height={24} rx={8} />
            <circle cx={subjectX - 20} cy={g - 14} r={10} />
            <circle cx={subjectX + 32} cy={g - 14} r={10} />
          </g>
          <circle cx={subjectX + 50} cy={g - 32} r={4} fill={pal.light} />
        </>
      );
      break;
    case 'interior':
      content = (
        <>
          <rect x={lightX - 70} y={70} width={140} height={190} fill={pal.light} opacity={0.18} rx={2} />
          <line x1={lightX} y1={70} x2={lightX} y2={260} stroke={pal.ink} strokeWidth={6} />
          <line x1={lightX - 70} y1={165} x2={lightX + 70} y2={165} stroke={pal.ink} strokeWidth={6} />
          <polygon points={`${lightX - 70},260 ${lightX + 70},260 ${lightX + 200},${H} ${lightX - 120},${H}`} fill={pal.light} opacity={0.08} />
          <rect x={0} y={g - 40} width={W} height={H} fill={pal.near} />
          <rect x={subjectX - 90} y={g - 80} width={180} height={12} rx={3} fill={pal.ink} />
          <rect x={subjectX - 80} y={g - 70} width={8} height={70} fill={pal.ink} />
          <rect x={subjectX + 72} y={g - 70} width={8} height={70} fill={pal.ink} />
          <Person x={subjectX + 130} g={g + 30} h={250} fill={pal.ink} />
        </>
      );
      break;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="still-svg" aria-hidden>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal.sky[0]} />
          <stop offset="0.55" stopColor={pal.sky[1]} />
          <stop offset="1" stopColor={pal.sky[2]} />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx={lightX / W} cy={lightY / H} r="0.55">
          <stop offset="0" stopColor={pal.light} stopOpacity="0.95" />
          <stop offset="0.12" stopColor={pal.light} stopOpacity="0.55" />
          <stop offset="0.5" stopColor={pal.sky[2]} stopOpacity="0.12" />
          <stop offset="1" stopColor={pal.sky[2]} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      <rect width={W} height={H} fill={`url(#${id}-light)`} />
      {motif !== 'interior' && motif !== 'stage' && <circle cx={lightX} cy={lightY} r={mood === 'night' ? 14 : 22} fill={pal.light} opacity={0.9} />}
      {content}
    </svg>
  );
}

const MemoScene = memo(Scene);

interface StillProps {
  media?: Media | null;
  className?: string;
  /** Show the play affordance for video. */
  showPlay?: boolean;
  rounded?: boolean;
  alt?: string;
}

export function Still({ media, className = '', showPlay = true, alt }: StillProps) {
  const [failed, setFailed] = useState(false);
  const content = useMemo(() => {
    if (!media) return null;
    if (media.src && !failed) {
      return <img src={media.src} alt={alt ?? media.caption ?? ''} onError={() => setFailed(true)} className="still-img" />;
    }
    if (media.src && failed) return null;
    return <MemoScene seed={media.seed} mood={media.mood} motif={media.motif} />;
  }, [media, failed, alt]);

  if (!content) {
    return (
      <div className={`still still--missing ${className}`} role="img" aria-label="Media unavailable">
        <ImageOff size={20} strokeWidth={1.6} />
        <span>Media unavailable</span>
      </div>
    );
  }

  return (
    <div className={`still ${className}`} role={alt ? 'img' : undefined} aria-label={alt}>
      {content}
      <div className="still-grain" />
      {media?.kind === 'video' && showPlay && (
        <div className="still-play">
          <span className="still-play-btn">
            <Play size={14} fill="currentColor" strokeWidth={0} />
          </span>
          {media.duration && <span className="still-duration">{media.duration}</span>}
        </div>
      )}
    </div>
  );
}
