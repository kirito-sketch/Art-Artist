import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Media, Org, Person } from '../data/types';
import { CraftObject, type CraftObjectKind } from './craft';
import { Avatar, Photo, PressCard, Verified } from './primitives';

/*
 * Ana composition families (docs/VISUAL_COMPOSITION_SYSTEM.md, section 5). Each family is one
 * component so every screen composes from the same grammar: type styles, radii, surfaces and the
 * frame label never vary per screen. Only the composition does.
 */

/**
 * Frame label: the one way Ana writes status on media. Small caps on a smoked plate, like the
 * label on a film can or a slate. Stage, kind, closing time, privacy. Never a coloured pill.
 */
export function FrameLabel({ children, tone = 'plate', icon }: { children: ReactNode; tone?: 'plate' | 'paper' | 'urgent'; icon?: ReactNode }) {
  return (
    <span className={`frame-label frame-label--${tone}`}>
      {icon}
      {children}
    </span>
  );
}

/** Portrait Card: person-led. Their work sits behind; the portrait breaks the edge. */
export function PortraitCard({ person, still, context, action, onPress }: { person: Person; still?: Media; context?: ReactNode; action?: ReactNode; onPress: () => void }) {
  return (
    <PressCard className="portrait-card" onPress={onPress} scale={0.98} aria-label={person.name}>
      <div className="portrait-card-still">{still ? <Photo media={still} showPlay={false} /> : <span className="portrait-card-blank" />}</div>
      <span className="portrait-card-face">
        <Avatar party={person} size={64} available={!!person.availableFrom} />
      </span>
      <div className="portrait-card-text">
        <p className="item-title">{person.name}</p>
        <p className="meta">{person.role}</p>
        {context && <p className="portrait-card-context">{context}</p>}
      </div>
      {action && <div className="portrait-card-action">{action}</div>}
    </PressCard>
  );
}

/** Poster / Stills: the work carries the tile. Lead items are larger; the rail varies its rhythm. */
export function PosterTile({ media, title, meta, label, lead, locked, onPress, children }: { media?: Media; title: string; meta?: ReactNode; label?: ReactNode; lead?: boolean; locked?: boolean; onPress: () => void; children?: ReactNode }) {
  return (
    <PressCard className={`poster-tile ${lead ? 'poster-tile--lead' : ''}`} onPress={onPress} scale={0.97} aria-label={title}>
      <div className="poster-tile-media">
        {media ? <Photo media={media} showPlay={false} /> : <TitleCard title={title} locked={locked} />}
        {label && <span className="poster-tile-label">{label}</span>}
        {children}
      </div>
      <p className="item-title poster-tile-title">{title}</p>
      {meta && <p className="meta poster-tile-meta">{meta}</p>}
    </PressCard>
  );
}

/**
 * Title card: a project without public artwork is shown as its own title set on a dark slate,
 * never as an empty grey box. The one sanctioned dark surface outside media viewers.
 */
export function TitleCard({ title, locked }: { title: string; locked?: boolean }) {
  return (
    <div className="title-card">
      <span className="title-card-rule" />
      <span className="title-card-title">{title}</span>
      {locked && (
        <span className="title-card-lock">
          <Lock size={11} strokeWidth={2.4} /> Private
        </span>
      )}
    </div>
  );
}

/** Object Tile: a craft, represented by its tool. The object breaks out of the tile. */
export function ObjectTile({ kind, label, meta, onPress }: { kind: CraftObjectKind; label: string; meta?: string; onPress: () => void }) {
  return (
    <PressCard className="object-tile" onPress={onPress} scale={0.97} aria-label={label}>
      <CraftObject kind={kind} size={112} className="object-tile-object" />
      <span className="object-tile-text">
        <span className="item-title">{label}</span>
        {meta && <span className="meta">{meta}</span>}
      </span>
    </PressCard>
  );
}

/** Wide editorial card for a production house: its current work leads, the house signs it. */
export function HouseFeature({ house, still, line, onPress }: { house: Org; still?: Media; line: ReactNode; onPress: () => void }) {
  return (
    <PressCard className="house-feature" onPress={onPress} scale={0.985} aria-label={house.name}>
      <div className="house-feature-still">{still ? <Photo media={still} showPlay={false} /> : <TitleCard title={house.name} />}</div>
      <div className="house-feature-sign">
        <Avatar party={house} size={40} />
        <span className="house-feature-text">
          <span className="item-title">
            {house.name} {house.verified && <Verified size={13} />}
          </span>
          <span className="meta">{line}</span>
        </span>
      </div>
    </PressCard>
  );
}

/**
 * Call sheet: the facts of a role set as a two-column sheet with hairlines, the way a production
 * lists them. Unboxed; the grid gives the order.
 */
export function CallSheet({ items }: { items: { label: string; value: ReactNode; wide?: boolean }[] }) {
  return (
    <dl className="call-sheet">
      {items.map((it, i) => (
        <div key={it.label} className={`call-sheet-cell ${it.wide || (items.length % 2 === 1 && i === items.length - 1) ? 'call-sheet-cell--wide' : ''}`}>
          <dt>{it.label}</dt>
          <dd>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Overlapping faces: the people connected to a piece of work. */
export function Faces({ people, size = 26, max = 4 }: { people: (Person | Org)[]; size?: number; max?: number }) {
  const shown = people.slice(0, max);
  return (
    <span className="faces-stack" aria-hidden>
      {shown.map((p, i) => (
        <span key={p.id + i} className="faces-stack-item" style={{ marginLeft: i ? -size * 0.32 : 0 }}>
          <Avatar party={p} size={size} />
        </span>
      ))}
    </span>
  );
}
