import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, useState, type ReactNode } from 'react';
import { BadgeCheck, Check, ChevronRight, ImageOff, Play } from 'lucide-react';
import type { Media, Party } from '../data/types';
import { spring } from './motion';

/* ------------------------------------------------------------ Pressable */

type PressableProps = HTMLMotionProps<'button'> & { scale?: number };

/** Every tappable surface compresses slightly on touch. */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(function Pressable(
  { scale = 0.97, className = '', children, type = 'button', ...rest },
  ref,
) {
  return (
    <motion.button ref={ref} type={type} whileTap={{ scale }} transition={spring.press} className={`pressable ${className}`} {...rest}>
      {children}
    </motion.button>
  );
});

type PressCardProps = HTMLMotionProps<'div'> & { scale?: number; onPress: () => void };

/** A tappable block that can contain its own buttons (save, follow) without nesting <button>s. */
export function PressCard({ scale = 0.98, className = '', onPress, children, ...rest }: PressCardProps) {
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
  /** See docs/CTA_SYSTEM.md. primary = graphite; secondary (outline is the same) = raised with an edge; selected = tonal state; plain = tertiary; danger = destructive confirmation only; light = on media. */
  variant?: 'primary' | 'secondary' | 'selected' | 'plain' | 'danger' | 'outline' | 'light';
  size?: 'l' | 'm' | 's';
  icon?: ReactNode;
  block?: boolean;
  loading?: boolean;
};

export function Button({ variant = 'primary', size = 'm', icon, block, loading, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <Pressable scale={0.96} className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="spinner" aria-label="Loading" /> : icon}
      {children as ReactNode}
    </Pressable>
  );
}

/**
 * Follow is always a secondary action, everywhere: Follow (secondary) → Following (selected, with a
 * check). One component so it can never drift between screens again (docs/CTA_SYSTEM.md).
 */
export function FollowButton({ on, onToggle, size = 's', block, name }: { on: boolean; onToggle: () => void; size?: 'm' | 's'; block?: boolean; name?: string }) {
  return (
    <Button
      size={size}
      block={block}
      layout={!block}
      transition={spring.snappy}
      variant={on ? 'selected' : 'secondary'}
      aria-pressed={on}
      aria-label={name ? `${on ? 'Following' : 'Follow'} ${name}` : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {/* State morph: the label and check swap in place while the fill changes; the width follows. */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={on ? 'on' : 'off'} className="follow-label" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}>
          {on && <Check size={size === 's' ? 14 : 16} strokeWidth={2.6} />}
          {on ? 'Following' : 'Follow'}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}

export function IconButton({ label, className = '', children, ...rest }: HTMLMotionProps<'button'> & { label: string }) {
  return (
    <Pressable scale={0.9} aria-label={label} title={label} className={`icon-btn ${className}`} {...rest}>
      {children as ReactNode}
    </Pressable>
  );
}

/* ----------------------------------------------------------------- Photo */

/**
 * Real image with a delivery fallback: tries `src`, then `fallback`, then a quiet placeholder.
 * Video media gets a play affordance and duration.
 */
export function Photo({ media, className = '', alt = '', showPlay = true }: { media?: Media | null; className?: string; alt?: string; showPlay?: boolean }) {
  const [stage, setStage] = useState(0);
  const url = !media ? null : stage === 0 ? media.src : stage === 1 && media.fallback ? media.fallback : null;
  return (
    <div className={`photo ${className}`}>
      {url ? (
        <img src={url} alt={alt} loading="lazy" draggable={false} onError={() => setStage((s) => (s === 0 && media?.fallback ? 1 : 2))} />
      ) : (
        <span className="photo-missing" aria-label="Image unavailable">
          <ImageOff size={18} strokeWidth={1.6} />
        </span>
      )}
      {media?.kind === 'video' && showPlay && (
        <span className="photo-play">
          <Play size={12} fill="currentColor" strokeWidth={0} />
          {media.duration}
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Avatar */

export function initials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  const latin = words.filter((w) => /[A-Za-z]/.test(w[0]));
  if (latin.length) return latin.slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  // Scripts without capitals (Telugu and other Indic scripts): one whole akshara, never a split glyph.
  const first = words[0] ?? '';
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) for (const g of new Seg(undefined, { granularity: 'grapheme' }).segment(first)) return g.segment;
  return Array.from(first)[0] ?? '';
}

/**
 * The one source of a person's (or house's) image across Ana: the profile photo they chose (logo for
 * a house). A failed load is remembered per source, so a component that later shows someone else,
 * or the same person with a new photo, tries again instead of staying on initials.
 */
export function usePartyImage(party: Party) {
  const src = party.kind === 'person' ? party.photo : party.logo;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return { src, show: !!src && failedSrc !== src, onError: () => setFailedSrc(src ?? null) };
}

/**
 * A person's photo at any size (portrait cards, the profile identity): cover-cropped with a
 * face-safe focal point, never stretched. Without a photo: their initials, as an intentional
 * monogram on the quiet tint. Never a broken image, never a stock face.
 */
export function PersonPhoto({ party, className = '' }: { party: Party; className?: string }) {
  const img = usePartyImage(party);
  return (
    <span className={`person-photo ${img.show ? '' : 'person-photo--initials'} ${className}`} aria-hidden>
      {img.show ? <img src={img.src} alt="" onError={img.onError} draggable={false} /> : <span className="person-photo-initials">{initials(party.name)}</span>}
    </span>
  );
}

/** Headshot when delivered, otherwise a neutral monogram. Organisations are rounded squares. */
export function Avatar({ party, size = 40, available }: { party: Party; size?: number; available?: boolean }) {
  const img = usePartyImage(party);
  const isOrg = party.kind === 'org';
  return (
    <span className={`avatar ${isOrg ? 'avatar--org' : ''}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }} aria-hidden>
      {img.show ? <img src={img.src} alt="" onError={img.onError} /> : size >= 24 ? initials(party.name) : null}
      {available && <span className="avatar-dot" style={{ width: Math.max(10, size * 0.24), height: Math.max(10, size * 0.24) }} />}
    </span>
  );
}

export function Verified({ size = 15, label = 'Verified' }: { size?: number; label?: string }) {
  return (
    <span className="verified" role="img" aria-label={label} title={label}>
      <BadgeCheck size={size} strokeWidth={2.2} />
    </span>
  );
}

/* --------------------------------------------------------------- Layout */

/** Section title. When the section has more to show, the title itself is the link, with a chevron. */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-head">
      {action && onAction ? (
        <button className="section-link" onClick={onAction} aria-label={`${title}, ${action.toLowerCase()}`}>
          <h2>{title}</h2>
          <ChevronRight size={22} strokeWidth={2.6} />
        </button>
      ) : (
        <h2>{title}</h2>
      )}
    </div>
  );
}

/** iOS inset-grouped row: icon, label, value, and optional chevron. */
export function Row({ icon, label, value, onPress, chevron = !!onPress, children }: { icon?: ReactNode; label: ReactNode; value?: ReactNode; onPress?: () => void; chevron?: boolean; children?: ReactNode }) {
  const inner = (
    <>
      {icon && <span className="row-icon">{icon}</span>}
      <span className="row-label">{label}</span>
      {value !== undefined && <span className="row-value">{value}</span>}
      {children}
      {chevron && <ChevronRight size={18} className="row-chevron" />}
    </>
  );
  return onPress ? (
    <Pressable className="row" onClick={onPress} scale={0.99}>
      {inner}
    </Pressable>
  ) : (
    <div className="row">{inner}</div>
  );
}

export function Chip({ active, children, onClick, icon }: { active?: boolean; children: ReactNode; onClick?: () => void; icon?: ReactNode }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} className={`chip ${active ? 'is-on' : ''}`} onClick={onClick} aria-pressed={active}>
      {icon}
      {children}
    </motion.button>
  );
}

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

export function Tabs<T extends string>({ value, options, onChange, id }: { value: T; options: { value: T; label: string; icon?: ReactNode }[]; onChange: (v: T) => void; id: string }) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={`tab ${value === o.value ? 'is-on' : ''}`} onClick={() => onChange(o.value)}>
          {o.icon}
          <span>{o.label}</span>
          {value === o.value && <motion.span layoutId={`tabs-${id}`} className="tab-underline" transition={spring.snappy} />}
        </button>
      ))}
    </div>
  );
}
