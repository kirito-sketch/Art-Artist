import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';
import { BadgeCheck, ChevronRight, Clapperboard, Handshake, Megaphone } from 'lucide-react';
import type { Opportunity, Party } from '../data/types';
import { spring } from './motion';

/* ------------------------------------------------------------ Pressable */

type PressableProps = HTMLMotionProps<'button'> & { scale?: number };

/** Every tappable surface compresses slightly on touch, like a physical card. */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(function Pressable(
  { scale = 0.97, className = '', children, type = 'button', ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={{ scale }}
      transition={spring.press}
      className={`pressable ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
});

type PressCardProps = HTMLMotionProps<'div'> & { scale?: number; onPress: () => void };

/** A tappable card that can contain its own buttons (save, follow) without nesting <button>s. */
export function PressCard({ scale = 0.975, className = '', onPress, children, ...rest }: PressCardProps) {
  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileTap={{ scale }}
      transition={spring.press}
      className={`pressable ${className}`}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPress();
        }
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------- Button */

type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'light' | 'danger';
  size?: 'l' | 'm' | 's';
  icon?: ReactNode;
  trailing?: ReactNode;
  block?: boolean;
  loading?: boolean;
};

export function Button({ variant = 'primary', size = 'm', icon, trailing, block, loading, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <Pressable
      scale={0.96}
      className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="spinner" aria-label="Loading" /> : icon}
      {children as ReactNode}
      {trailing}
    </Pressable>
  );
}

export function IconButton({ label, className = '', children, ...rest }: HTMLMotionProps<'button'> & { label: string }) {
  return (
    <Pressable scale={0.9} aria-label={label} className={`icon-btn ${className}`} {...rest}>
      {children as ReactNode}
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Avatar */

const TONES: [string, string][] = [
  ['#6d4b3a', '#c89066'],
  ['#3d4f5c', '#8fb1c2'],
  ['#5a3b52', '#c9879f'],
  ['#3f5448', '#95b89f'],
  ['#6a5530', '#e0bb72'],
  ['#4b3a63', '#a592cf'],
  ['#5c3a33', '#d1897a'],
  ['#34485a', '#7fa3c4'],
];

export function initials(name: string) {
  return name
    .split(' ')
    .filter((w) => /[A-Za-z]/.test(w[0]))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

export function Avatar({ party, size = 40, ring }: { party: Party; size?: number; ring?: 'available' | 'new' }) {
  const [a, b] = TONES[party.tone % TONES.length];
  const isOrg = party.kind === 'org';
  return (
    <span
      className={`avatar ${isOrg ? 'avatar--org' : ''} ${ring ? `avatar--ring-${ring}` : ''}`}
      style={{ width: size, height: size, fontSize: size * (isOrg ? 0.34 : 0.38), background: `linear-gradient(145deg, ${b}, ${a})` }}
      aria-hidden
    >
      {initials(party.name)}
    </span>
  );
}

export function AvatarStack({ parties, size = 28, max = 3 }: { parties: Party[]; size?: number; max?: number }) {
  const shown = parties.slice(0, max);
  return (
    <span className="avatar-stack" style={{ height: size }}>
      {shown.map((p) => (
        <span key={p.id} className="avatar-stack-item" style={{ marginLeft: -size * 0.32 }}>
          <Avatar party={p} size={size} />
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------ Trust type */

const TYPE_META = {
  crew: { label: 'Crew job', Icon: Clapperboard },
  casting: { label: 'Casting call', Icon: Megaphone },
  collab: { label: 'Collaboration', Icon: Handshake },
} as const;

/** The single most important label in Ana: official vs peer. Icon + text + hue, so it survives greyscale. */
export function TypeBadge({ kind, onMedia }: { kind: Opportunity['kind']; onMedia?: boolean }) {
  const { label, Icon } = TYPE_META[kind];
  return (
    <span className={`type-badge type-badge--${kind} ${onMedia ? 'type-badge--on-media' : ''}`}>
      <Icon size={12} strokeWidth={2.2} />
      {label}
    </span>
  );
}

export function Verified({ size = 14, label = 'Verified production house' }: { size?: number; label?: string }) {
  return (
    <span className="verified" title={label} aria-label={label}>
      <BadgeCheck size={size} strokeWidth={2.2} />
    </span>
  );
}

export function Chip({ children, tone = 'default', icon }: { children: ReactNode; tone?: 'default' | 'available' | 'accent' | 'collab' | 'danger'; icon?: ReactNode }) {
  return (
    <span className={`chip chip--${tone}`}>
      {icon}
      {children}
    </span>
  );
}

/* --------------------------------------------------------- Section header */

export function SectionHeader({ title, meta, action, onAction }: { title: string; meta?: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="section-header">
      <div className="section-header-title">
        <h2>{title}</h2>
        {meta && <span className="section-header-meta">{meta}</span>}
      </div>
      {action && (
        <Pressable className="section-header-action" onClick={onAction} scale={0.94}>
          {action}
          <ChevronRight size={15} strokeWidth={2.2} />
        </Pressable>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- States */

export function Skeleton({ w = '100%', h = 14, r = 8, className = '' }: { w?: number | string; h?: number | string; r?: number; className?: string }) {
  return <span className={`skeleton ${className}`} style={{ width: w, height: h, borderRadius: r }} />;
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon && <span className="empty-icon">{icon}</span>}
      <p className="empty-title">{title}</p>
      {body && <p className="empty-body">{body}</p>}
      {action}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`toggle ${on ? 'toggle--on' : ''}`} onClick={() => onChange(!on)}>
      <motion.span className="toggle-knob" layout transition={spring.snappy} />
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, id }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void; id: string }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={`segmented-item ${value === o.value ? 'is-active' : ''}`} onClick={() => onChange(o.value)}>
          {value === o.value && <motion.span layoutId={`seg-${id}`} className="segmented-pill" transition={spring.snappy} />}
          <span className="segmented-label">
            {o.label}
            {o.count ? <span className="segmented-count">{o.count}</span> : null}
          </span>
        </button>
      ))}
    </div>
  );
}
