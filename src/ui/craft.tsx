import { useId } from 'react';

/*
 * PLACEHOLDER craft objects. The concept and placement are approved; the artwork is not final.
 * The Craft Object Asset family is supplied externally as transparent WebP/PNG files (see
 * docs/VISUAL_COMPOSITION_SYSTEM.md, "Object Tile and Craft Object Asset"). These drawings only
 * hold the slot until then: do not refine them. The Object Tile hides their built-in shadow and
 * draws its own, exactly as it will for the supplied assets.
 */

export type CraftObjectKind = 'lens' | 'timeline' | 'microphone' | 'swatches' | 'lamp' | 'clapper' | 'hanger';

const INK = '#1d1d1f';
const GRAPHITE = ['#4a4a4e', '#26262a', '#141416'];
const ALU = ['#f4f2ee', '#cfcbc4', '#9a968f'];
const AMBER = '#c99a4e';
const CLAY = '#b8735a';
const SAGE = '#6f8b83';
const RED = '#c4412e';

function Shadow({ id, cx = 84, cy = 140, rx = 50 }: { id: string; cx?: number; cy?: number; rx?: number }) {
  return (
    <g className="craft-shadow">
      <defs>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={9} fill="#2a1d10" opacity={0.26} filter={`url(#${id}-blur)`} />
    </g>
  );
}

/** Cinematography: a cine prime standing on its mount, front element up. */
function Lens({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" x2="1">
          <stop offset="0" stopColor={GRAPHITE[0]} />
          <stop offset="0.35" stopColor={GRAPHITE[1]} />
          <stop offset="1" stopColor={GRAPHITE[2]} />
        </linearGradient>
        <linearGradient id={`${id}-ring`} x1="0" x2="1">
          <stop offset="0" stopColor="#5a5a5f" />
          <stop offset="0.4" stopColor="#2c2c30" />
          <stop offset="1" stopColor="#101012" />
        </linearGradient>
        <linearGradient id={`${id}-alu`} x1="0" x2="1">
          <stop offset="0" stopColor={ALU[0]} />
          <stop offset="0.5" stopColor={ALU[1]} />
          <stop offset="1" stopColor={ALU[2]} />
        </linearGradient>
        <radialGradient id={`${id}-glass`} cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#5a6f8c" />
          <stop offset="0.45" stopColor="#1f2a3d" />
          <stop offset="1" stopColor="#07090e" />
        </radialGradient>
      </defs>
      <Shadow id={id} cx={86} cy={138} rx={48} />
      <g className="craft-body">
        {/* mount */}
        <path d="M44 116 L44 124 A36 11 0 0 0 116 124 L116 116 Z" fill={`url(#${id}-alu)`} />
        <ellipse cx="80" cy="116" rx="36" ry="11" fill="#bdb8b0" />
        {/* barrel */}
        <path d="M34 50 L34 112 A46 15 0 0 0 126 112 L126 50 Z" fill={`url(#${id}-wall)`} />
        {/* focus ring with ridges */}
        <path d="M32 72 L32 94 A48 16 0 0 0 128 94 L128 72 Z" fill={`url(#${id}-ring)`} />
        {Array.from({ length: 15 }, (_, i) => {
          const t = (i + 0.5) / 15;
          const x = 80 - 48 * Math.cos(Math.PI * t);
          const y = 94 + 16 * Math.sin(Math.PI * t);
          return <line key={i} x1={x} y1={y - 20} x2={x} y2={y} stroke="#000" strokeOpacity={0.35 + 0.3 * t} strokeWidth={1.4} />;
        })}
        <path d="M32 72 A48 16 0 0 0 128 72" fill="none" stroke="#6b6b70" strokeWidth="1" opacity="0.8" />
        {/* distance scale */}
        <path d="M40 104 A42 13 0 0 0 120 104" fill="none" stroke="#e9e5de" strokeWidth="1" strokeDasharray="1.2 5" opacity="0.8" />
        <circle cx="80" cy="109" r="2.2" fill={RED} />
        {/* front rim and glass */}
        <ellipse cx="80" cy="50" rx="46" ry="15" fill="#2f2f33" />
        <ellipse cx="80" cy="50" rx="41" ry="12.5" fill="#0c0c0e" />
        <ellipse cx="80" cy="51" rx="34" ry="10" fill={`url(#${id}-glass)`} />
        <path d="M58 47 A26 7 0 0 1 90 43" fill="none" stroke="#e7b86a" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
        <path d="M94 55 A22 6 0 0 1 104 50" fill="none" stroke="#8fb3d9" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
        {/* key light on the left edge */}
        <path d="M36 54 L36 110" stroke="#fff" strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" />
      </g>
    </>
  );
}

/** Editing: three tracks of clips on a timeline slab, with the playhead. */
function Timeline({ id }: { id: string }) {
  // Flat design space (x 0..120, y 0..64) projected into three-quarter view.
  const M = 'matrix(0.92 0.3 -0.54 0.6 40 30)';
  const clip = (x: number, y: number, w: number, color: string, k: string) => (
    <g key={k}>
      <rect x={x} y={y + 4} width={w} height={12} rx={3} fill="#000" opacity={0.28} />
      <rect x={x} y={y} width={w} height={12} rx={3} fill={color} />
      <rect x={x + 1} y={y + 1} width={w - 2} height={3} rx={1.5} fill="#fff" opacity={0.28} />
    </g>
  );
  return (
    <>
      <defs>
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ALU[0]} />
          <stop offset="1" stopColor={ALU[1]} />
        </linearGradient>
      </defs>
      <Shadow id={id} cx={82} cy={118} rx={62} />
      <g className="craft-body">
        {/* slab thickness */}
        <g transform={M}>
          <rect x="0" y="8" width="120" height="64" rx="7" fill={ALU[2]} />
        </g>
        <g transform={M}>
          <rect x="0" y="0" width="120" height="64" rx="7" fill={`url(#${id}-plate)`} />
          {clip(6, 7, 40, AMBER, 'a')}
          {clip(50, 7, 42, GRAPHITE[1], 'b')}
          {clip(96, 7, 18, CLAY, 'c')}
          {clip(14, 25, 46, SAGE, 'd')}
          {clip(64, 25, 44, AMBER, 'e')}
          <g>
            <rect x="6" y="47" width="108" height="10" rx="3" fill="#000" opacity={0.28} />
            <rect x="6" y="43" width="108" height="10" rx="3" fill={GRAPHITE[1]} />
            {Array.from({ length: 34 }, (_, i) => {
              const h = 1.5 + Math.abs(Math.sin(i * 1.7)) * 3.5;
              return <rect key={i} x={9 + i * 3.1} y={48 - h / 2} width={1.4} height={h} rx={0.7} fill="#e8e3da" opacity={0.75} />;
            })}
          </g>
          {/* playhead */}
          <rect x="73" y="-2" width="2" height="62" rx="1" fill={RED} />
        </g>
        {/* playhead pin, standing up from where the playhead meets the top edge */}
        <line x1="109" y1="51" x2="109" y2="30" stroke={RED} strokeWidth="2" strokeLinecap="round" />
        <path d="M104 20 L114 20 L114 28 L109 33 L104 28 Z" fill={RED} />
      </g>
    </>
  );
}

/** Sound: a studio capsule microphone, with a waveform behind it. */
function Microphone({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" x2="1">
          <stop offset="0" stopColor={GRAPHITE[0]} />
          <stop offset="0.4" stopColor={GRAPHITE[1]} />
          <stop offset="1" stopColor={GRAPHITE[2]} />
        </linearGradient>
        <linearGradient id={`${id}-grille`} x1="0" x2="1">
          <stop offset="0" stopColor={ALU[0]} />
          <stop offset="0.55" stopColor={ALU[1]} />
          <stop offset="1" stopColor={ALU[2]} />
        </linearGradient>
        <pattern id={`${id}-mesh`} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill="#6d6962" opacity="0.55" />
        </pattern>
        <clipPath id={`${id}-cap`}>
          <path d="M56 50 A24 24 0 0 1 104 50 L104 70 L56 70 Z" />
        </clipPath>
      </defs>
      <Shadow id={id} cx={84} cy={140} rx={40} />
      {/* waveform behind */}
      <g className="craft-back" opacity="0.9">
        {Array.from({ length: 13 }, (_, i) => {
          const h = 10 + Math.abs(Math.sin(i * 0.9 + 0.4)) * 34;
          const x = 18 + i * 10;
          return <rect key={i} x={x} y={74 - h / 2} width={4} height={h} rx={2} fill={AMBER} opacity={i > 3 && i < 9 ? 0 : 0.55} />;
        })}
      </g>
      <g className="craft-body">
        {/* stand */}
        <rect x="76" y="108" width="8" height="24" rx="2" fill={GRAPHITE[1]} />
        <ellipse cx="80" cy="133" rx="22" ry="6" fill={GRAPHITE[2]} />
        <ellipse cx="80" cy="131" rx="22" ry="6" fill={GRAPHITE[0]} />
        {/* body */}
        <path d="M56 70 L56 96 Q56 112 80 112 Q104 112 104 96 L104 70 Z" fill={`url(#${id}-body)`} />
        <circle cx="80" cy="92" r="2.2" fill={RED} />
        {/* ring */}
        <rect x="54" y="66" width="52" height="8" rx="3" fill={`url(#${id}-grille)`} />
        {/* grille */}
        <path d="M56 50 A24 24 0 0 1 104 50 L104 70 L56 70 Z" fill={`url(#${id}-grille)`} />
        <rect x="56" y="24" width="48" height="46" fill={`url(#${id}-mesh)`} clipPath={`url(#${id}-cap)`} />
        <path d="M62 44 A18 18 0 0 1 76 30" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
        <path d="M58 76 L58 98" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round" />
      </g>
    </>
  );
}

/** Production design: a fan of material samples (fabric, timber, paint chips) on a brass pivot. */
function Swatches({ id }: { id: string }) {
  const card = (rot: number, fill: React.ReactNode, k: string) => (
    <g key={k} transform={`rotate(${rot} 80 124)`}>
      <rect x="58" y="34" width="44" height="94" rx="6" fill="#000" opacity="0.22" transform="translate(3 4)" />
      <rect x="58" y="34" width="44" height="94" rx="6" fill="#f3efe8" />
      {fill}
      <rect x="58" y="34" width="44" height="94" rx="6" fill="none" stroke="#000" strokeOpacity="0.08" />
    </g>
  );
  return (
    <>
      <defs>
        <pattern id={`${id}-weave`} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill={CLAY} />
          <path d="M0 1 H4 M1 0 V4" stroke="#8f5642" strokeWidth="0.8" opacity="0.5" />
        </pattern>
        <linearGradient id={`${id}-wood`} x1="0" x2="1">
          <stop offset="0" stopColor="#c89668" />
          <stop offset="1" stopColor="#9c6b43" />
        </linearGradient>
      </defs>
      <Shadow id={id} cx={86} cy={140} rx={46} />
      <g className="craft-body">
        {card(-24, <rect x="62" y="38" width="36" height="70" rx="4" fill={`url(#${id}-weave)`} />, 'fabric')}
        {card(
          -6,
          <g>
            <rect x="62" y="38" width="36" height="70" rx="4" fill={`url(#${id}-wood)`} />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M${64 + i * 8} 38 Q${70 + i * 8} 72 ${63 + i * 8} 108`} fill="none" stroke="#6e4527" strokeWidth="0.9" opacity="0.45" />
            ))}
          </g>,
          'timber',
        )}
        {card(
          14,
          <g>
            <rect x="62" y="38" width="36" height="22" rx="3" fill={SAGE} />
            <rect x="62" y="62" width="36" height="22" rx="3" fill="#d9cdb8" />
            <rect x="62" y="86" width="36" height="22" rx="3" fill={INK} />
          </g>,
          'paint',
        )}
        <circle cx="80" cy="120" r="6" fill="#b3924f" />
        <circle cx="79" cy="119" r="2.4" fill="#f1dfb0" />
      </g>
    </>
  );
}

/** Lighting: a fresnel lamp on a stand, barn doors open, a warm beam. */
function Lamp({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" x2="1">
          <stop offset="0" stopColor={GRAPHITE[0]} />
          <stop offset="0.5" stopColor={GRAPHITE[1]} />
          <stop offset="1" stopColor={GRAPHITE[2]} />
        </linearGradient>
        <radialGradient id={`${id}-beam`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#ffe9b8" />
          <stop offset="1" stopColor={AMBER} stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow id={id} cx={82} cy={142} rx={36} />
      <g className="craft-back"><path d="M96 56 L150 30 L150 100 L96 78 Z" fill={`url(#${id}-beam)`} opacity="0.7" /></g>
      <g className="craft-body">
        <path d="M80 100 L66 140 M80 100 L94 140 M80 100 L80 142" stroke={GRAPHITE[1]} strokeWidth="4" strokeLinecap="round" />
        <rect x="76" y="86" width="8" height="18" rx="2" fill={ALU[2]} />
        <rect x="50" y="36" width="50" height="52" rx="8" fill={`url(#${id}-body)`} />
        <rect x="46" y="44" width="6" height="36" rx="2" fill={GRAPHITE[2]} />
        <circle cx="96" cy="62" r="22" fill={ALU[1]} />
        <circle cx="96" cy="62" r="17" fill="#fff3d2" />
        <circle cx="96" cy="62" r="9" fill="#ffe3a0" />
        <path d="M82 52 Q90 44 100 46" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="62" cy="48" r="2.4" fill={RED} />
        <path d="M100 38 L120 24 M100 86 L120 100" stroke={GRAPHITE[1]} strokeWidth="5" strokeLinecap="round" />
      </g>
    </>
  );
}

/** Direction: a clapperboard with the arm lifted, scene and take lines on the slate. */
function Clapper({ id }: { id: string }) {
  return (
    <>
      <defs>
        <pattern id={`${id}-stripe`} width="20" height="12" patternUnits="userSpaceOnUse" patternTransform="skewX(-28)">
          <rect width="10" height="12" fill={INK} />
          <rect x="10" width="10" height="12" fill={ALU[0]} />
        </pattern>
      </defs>
      <Shadow id={id} cx={82} cy={140} rx={46} />
      <g className="craft-body">
        <rect x="34" y="68" width="92" height="64" rx="6" fill={GRAPHITE[1]} />
        <g stroke="#f4f2ee" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round">
          <path d="M44 86 H84 M44 100 H72 M44 114 H96" />
        </g>
        <circle cx="108" cy="90" r="4" fill={AMBER} />
        <g transform="rotate(-22 36 66)">
          <rect x="34" y="52" width="92" height="16" rx="4" fill={`url(#${id}-stripe)`} />
          <rect x="34" y="52" width="92" height="16" rx="4" fill="none" stroke="#000" strokeOpacity="0.2" />
        </g>
        <rect x="34" y="62" width="92" height="12" rx="3" fill={`url(#${id}-stripe)`} />
        <circle cx="38" cy="66" r="3.2" fill={ALU[1]} />
      </g>
    </>
  );
}

/** Costume: a wooden hanger carrying a draped garment. */
function Hanger({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-cloth`} x1="0" x2="1">
          <stop offset="0" stopColor={CLAY} />
          <stop offset="1" stopColor="#8f5642" />
        </linearGradient>
      </defs>
      <Shadow id={id} cx={82} cy={142} rx={42} />
      <g className="craft-body">
        <path d="M80 34 Q80 24 88 24 Q96 24 96 32 Q96 38 88 40 L80 46" fill="none" stroke={ALU[2]} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M80 46 L28 84 Q22 90 30 90 L130 90 Q138 90 132 84 Z" fill="none" stroke="#9c6b43" strokeWidth="5" strokeLinejoin="round" />
        <path d="M44 74 Q80 66 116 74 L128 134 Q80 144 32 134 Z" fill={`url(#${id}-cloth)`} />
        <path d="M60 80 Q58 112 54 138 M80 78 Q80 112 80 140 M100 80 Q102 112 106 138" fill="none" stroke="#000" strokeOpacity="0.14" strokeWidth="2" />
        <circle cx="80" cy="84" r="3" fill="#f1dfb0" />
        <circle cx="80" cy="100" r="3" fill="#f1dfb0" />
      </g>
    </>
  );
}

const DRAW: Record<CraftObjectKind, (p: { id: string }) => JSX.Element> = { lens: Lens, timeline: Timeline, microphone: Microphone, swatches: Swatches, lamp: Lamp, clapper: Clapper, hanger: Hanger };

export function CraftObject({ kind, size = 120, className = '' }: { kind: CraftObjectKind; size?: number; className?: string }) {
  const id = `craft-${useId().replace(/:/g, '')}`;
  const Draw = DRAW[kind];
  return (
    <svg className={`craft-object ${className}`} width={size} height={size} viewBox="0 0 160 160" aria-hidden focusable="false">
      <Draw id={id} />
    </svg>
  );
}

/**
 * The crafts Home offers as objects. Labels are Art and Artist's craft names; routes go to existing Discover.
 * `asset` is the supplied Craft Object Asset (e.g. 'images/craft/lens.webp'). While it is unset
 * the Object Tile shows the placeholder drawing in the same slot, so layout never changes.
 */
export const CRAFT_OBJECTS: { kind: CraftObjectKind; label: string; crafts: string[]; asset?: string }[] = [
  { kind: 'lens', label: 'Cinematography', crafts: ['cinematographer', 'camera'] },
  { kind: 'timeline', label: 'Editing', crafts: ['editor'] },
  { kind: 'microphone', label: 'Sound', crafts: ['sound'] },
  { kind: 'swatches', label: 'Production design', crafts: ['production-design'] },
  { kind: 'lamp', label: 'Lighting', crafts: ['lighting'] },
  { kind: 'clapper', label: 'Direction', crafts: ['director'] },
  { kind: 'hanger', label: 'Costume', crafts: ['costume'] },
];
