import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { BadgeCheck, Check, ChevronRight, ImageOff, Play } from 'lucide-react';
import type { Media, MediaSurface, Party } from '../data/types';
import { mediaPosition } from '../domain/mediaLayout';
import { deliveredMedia, mediaPresentation, MEDIA_PRESETS } from '../domain/mediaPresentation';
import { spring } from './motion';
import { rovingKeys } from './a11y';

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

/** The card's own words, for the name of its open control (skipping its buttons and decoration). */
function cardText(root: HTMLElement) {
  const groups: { block: Element; text: string }[] = [];
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    // Skip controls and real decoration; text this card hid itself (data-pc-hidden) still counts.
    acceptNode: (n) => (n.parentElement?.closest('button, a, input, select, textarea, [aria-hidden="true"]:not([data-pc-hidden]), .pc-hit, .pc-desc, .sr-only') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const t = n.textContent?.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    // Words in the same line of text read together; separate lines (blocks, flex items) get a comma.
    let block: Element = n.parentElement!;
    while (block !== root && getComputedStyle(block).display === 'inline') block = block.parentElement!;
    const last = groups[groups.length - 1];
    if (last && last.block === block) last.text += ' ' + t;
    else groups.push({ block, text: t });
  }
  return groups.map((g) => g.text.replace(/\s*[·•|]\s*/g, ', ').replace(/^, |, $/g, '').trim()).filter((t, i, all) => t && t !== all[i - 1]);
}

const INTERACTIVE = 'button, a[href], input, select, textarea, [role="button"], [tabindex="0"]';

/**
 * A tappable card that can hold its own actions (Save, Follow, Review). Visually unchanged: the whole
 * card opens on tap. For VoiceOver the card is one clean element: an open button that covers the card
 * (so the VoiceOver highlight wraps it) named by the card's title, with its other details as the
 * description; the card's own text is not read twice; Save / Follow / Review stay separate controls,
 * never nested inside a button. Pass `aria-label` for a short name.
 */
export function PressCard({ scale = 0.98, className = '', onPress, children, 'aria-label': label, ...rest }: PressCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const descId = useId();
  const [text, setText] = useState<{ name: string; desc: string }>({ name: '', desc: '' });
  const seen = useRef('');
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    // Reading the card's words walks its text and computed styles, which forces a style pass. Every
    // card re-renders on any store change, so it runs only when the card's text has changed.
    const sig = `${label ?? ''}\u0000${root.textContent}`;
    if (sig !== seen.current) {
      seen.current = sig;
      const parts = cardText(root);
      const name = label || parts[0] || '';
      const rest = (label ? parts.filter((p) => !label.includes(p)) : parts.slice(1)).join(', ');
      const desc = rest.length > 180 ? rest.slice(0, 177) + '…' : rest;
      if (name !== text.name || desc !== text.desc) setText({ name, desc });
    }
    // The open button already says what the card says: hide text-only parts from screen readers.
    for (const child of Array.from(root.children) as HTMLElement[]) {
      if (child.classList.contains('pc-hit') || child.classList.contains('pc-desc')) continue;
      const interactive = child.matches(INTERACTIVE) || !!child.querySelector(INTERACTIVE);
      if (!interactive && !child.hasAttribute('aria-hidden')) {
        child.setAttribute('aria-hidden', 'true');
        child.setAttribute('data-pc-hidden', '');
      }
    }
  });
  return (
    // tabIndex -1: Framer Motion makes tap-animated elements tabbable; the card must not be a stop.
    <motion.div ref={ref} whileTap={{ scale }} transition={spring.press} className={`pressable press-card ${className}`} onClick={onPress} tabIndex={-1} {...rest}>
      {/* Activating it fires a click that reaches the card (onPress). Taps pass through it. */}
      <button type="button" className="pc-hit" aria-label={text.name || 'Open'} aria-describedby={text.desc ? descId : undefined} />
      {text.desc && (
        <span id={descId} className="pc-desc" hidden>
          {text.desc}
        </span>
      )}
      {children as ReactNode}
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
      {loading ? (
        <span className="spinner" role="status">
          <span className="sr-only">Working</span>
        </span>
      ) : (
        icon
      )}
      {children as ReactNode}
    </Pressable>
  );
}

/**
 * Follow is always a secondary action, everywhere: Follow (secondary) → Following (selected, with a
 * check). One component so it can never drift between screens again (docs/CTA_SYSTEM.md).
 */
/** Follow ↔ Following. `primary` makes Follow the dominant green action (another person's profile, V30); Following keeps a clear, quieter state. */
export function FollowButton({ on, onToggle, size = 's', block, name, primary }: { on: boolean; onToggle: () => void; size?: 'm' | 's'; block?: boolean; name?: string; primary?: boolean }) {
  // Width follows the label, but only around a toggle: an always-on layout node in every Follow
  // button made any tap anywhere measure all of them.
  const [moving, setMoving] = useState(false);
  const release = useRef(0);
  const arm = () => {
    window.clearTimeout(release.current);
    setMoving(true);
    release.current = window.setTimeout(() => setMoving(false), 700);
  };
  useEffect(() => () => window.clearTimeout(release.current), []);
  return (
    <Button
      size={size}
      block={block}
      layout={!block && moving}
      onPointerDown={arm}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && arm()}
      transition={spring.snappy}
      variant={on ? 'selected' : primary ? 'primary' : 'secondary'}
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
export function Photo({ media, className = '', alt, showPlay = true, onImageLoad, focal, imageFit, surface = 'preview', frameRatio, priority = false }: { media?: Media | null; className?: string; alt?: string; showPlay?: boolean; onImageLoad?: (image: HTMLImageElement) => void; focal?: { x: number; y: number }; imageFit?: 'cover' | 'contain'; surface?: MediaSurface; frameRatio?: number; priority?: boolean }) {
  const [failure, setFailure] = useState<{ source: string; stage: number }>();
  const stage = failure && failure.source === media?.src ? failure.stage : 0;
  const url = !media ? null : stage === 0 ? (media.kind === 'video' ? media.poster ?? media.src : media.src) : stage === 1 && media.fallback ? media.fallback : null;
  const asset = media && url ? deliveredMedia(media, url) : media;
  const policy = asset ? mediaPresentation(asset, surface, frameRatio) : undefined;
  const deliveredOriginal = surface !== 'original' && media?.kind !== 'video' && url === media?.src;
  return <div className={`photo ${className}`} data-media-surface={surface} data-media-fit={imageFit ?? policy?.fit}>
    {url ? <img key={url} ref={arrived} data-loading="" src={url} srcSet={deliveredOriginal && media?.variants?.length ? media.variants.map(v => `${v.src} ${v.width}w`).join(', ') : undefined} sizes={policy?.sizes} alt={alt ?? media?.alt ?? ''} loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} draggable={false} style={{ objectFit: imageFit ?? policy?.fit, objectPosition: focal ? mediaPosition(asset ?? undefined, focal) : policy?.position }} onLoad={e => { e.currentTarget.removeAttribute('data-loading'); onImageLoad?.(e.currentTarget); }} onError={() => setFailure({ source: media?.src ?? '', stage: stage === 0 && media?.fallback ? 1 : 2 })} /> : <span className="photo-missing" aria-label="Image unavailable"><ImageOff size={18} strokeWidth={1.6} /></span>}
    {media?.kind === 'video' && showPlay && <span className="photo-play"><Play size={12} fill="currentColor" strokeWidth={0} />{media.duration}</span>}
  </div>;
}

/** An image already in the cache shows at once; only one that is still arriving fades in (materials.css). */
function arrived(img: HTMLImageElement | null) {
  if (img?.complete && img.naturalWidth) img.removeAttribute('data-loading');
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
 * The one source of a person's (or house's) image across Art and Artist: the profile photo they chose (logo for
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
      {img.show ? <img src={img.src} alt="" onError={img.onError} draggable={false} style={{ objectFit: party.kind === 'org' ? MEDIA_PRESETS.logo.fit : MEDIA_PRESETS.avatar.fit, objectPosition: party.kind === 'person' ? mediaPresentation({ id: party.id, kind: 'image', src: img.src!, contentType: 'portrait',  }, 'preview').position : 'center' }} /> : <span className="person-photo-initials">{initials(party.name)}</span>}
    </span>
  );
}

/** Headshot when delivered, otherwise a neutral monogram. Organisations are rounded squares. */
export function Avatar({ party, size = 40 }: { party: Party; size?: number }) {
  const img = usePartyImage(party);
  const isOrg = party.kind === 'org';
  return (
    <span className={`avatar ${isOrg ? 'avatar--org' : ''}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }} aria-hidden>
      {img.show ? <img src={img.src} alt="" onError={img.onError} style={{ objectFit: isOrg ? MEDIA_PRESETS.logo.fit : MEDIA_PRESETS.avatar.fit, objectPosition: party.kind === 'person' ? mediaPresentation({ id: party.id, kind: 'image', src: img.src!, contentType: 'portrait', presentations: { avatar: party.avatarFraming } }, 'avatar').position : 'center' }} /> : size >= 24 ? initials(party.name) : null}
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

/**
 * Section header, the same everywhere (docs/REVIEW_EVENTS_PROFILE.md §3): title on the left, "See all" on the
 * right when there is more to see. "See all" always navigates to the complete list. The title is never a link.
 */
export function SectionHeader({ title, action, onAction, className = '' }: { title: string; action?: string; onAction?: () => void; className?: string }) {
  return (
    <div className={`section-head ${className}`}>
      <h2>{title}</h2>
      {action && onAction && (
        <button className="section-all" onClick={onAction} aria-label={`See all: ${title}`}>
          See all
        </button>
      )}
    </div>
  );
}

/** iOS inset-grouped row: icon, label, value, and optional chevron. */
export function Row({ icon, label, value, onPress, chevron = !!onPress, pressed, children }: { icon?: ReactNode; label: ReactNode; value?: ReactNode; onPress?: () => void; chevron?: boolean; pressed?: boolean; children?: ReactNode }) {
  const inner = (
    <>
      {icon && (
        <span className="row-icon" aria-hidden>
          {icon}
        </span>
      )}
      <span className="row-label">{label}</span>
      {value !== undefined && <span className="row-value">{value}</span>}
      {children}
      {chevron && <ChevronRight size={18} className="row-chevron" aria-hidden />}
    </>
  );
  return onPress ? (
    <Pressable className="row" onClick={onPress} scale={0.99} aria-pressed={pressed}>
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
    <div className="tabs" role="tablist" onKeyDown={(e) => rovingKeys(e, '[role="tab"]')}>
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} tabIndex={value === o.value ? 0 : -1} className={`tab ${value === o.value ? 'is-on' : ''}`} onClick={() => onChange(o.value)}>
          {o.icon}
          <span>{o.label}</span>
          {value === o.value && <motion.span layoutId={`tabs-${id}`} className="tab-underline" transition={spring.snappy} />}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ HowItWorks */

/**
 * A one-line explanation stays on screen; the full one opens on request ("How credits work"). Used where
 * the same paragraph would otherwise repeat on every visit (docs/UX_HEURISTIC_AUDIT.md F4).
 */
export function HowItWorks({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button type="button" className="link link--small how-link" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      <div id={id} className="how-body" hidden={!open}>
        {children}
      </div>
    </>
  );
}
