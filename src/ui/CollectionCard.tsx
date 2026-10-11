import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { PressCard } from './primitives';

export interface CollectionRow {
  key: string;
  /** Round or rounded-square lead: an avatar, a logo or a thumbnail. */
  lead: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  /** The small coloured line under the meta ("Open to work", "Closes in 2 days"). */
  tag?: ReactNode;
  onPress: () => void;
  label?: string;
  /** Round lead (people) instead of a rounded square (logos, posters, thumbnails). */
  round?: boolean;
}

/**
 * A themed card holding a few tidy rows: a title in the accent ink, a line under it, an arrow to open the whole
 * theme, then up to four rows (lead, title, meta, tag). Many small items become one calm object.
 * Cards sit in a sideways rail (CollectionRail), one theme per card.
 */
export function CollectionCard({ title, subtitle, onOpen, openLabel, rows }: { title: string; subtitle?: string; onOpen?: () => void; openLabel?: string; rows: CollectionRow[] }) {
  return (
    <section className="ccard" aria-label={title}>
      <header className="ccard-head">
        <div className="ccard-titles">
          <h3 className="ccard-title">{title}</h3>
          {subtitle && <p className="ccard-sub">{subtitle}</p>}
        </div>
        {onOpen && (
          <button type="button" className="ccard-open" onClick={onOpen} aria-label={openLabel ?? `See all: ${title}`}>
            <ChevronRight size={20} aria-hidden />
          </button>
        )}
      </header>
      <div className="ccard-rows">
        {rows.map((r) => (
          <PressCard key={r.key} className="ccard-row" onPress={r.onPress} scale={0.985} aria-label={r.label}>
            <span className={`ccard-lead${r.round ? ' ccard-lead--round' : ''}`}>{r.lead}</span>
            <span className="ccard-text">
              <span className="ccard-rtitle">{r.title}</span>
              {r.meta && <span className="ccard-meta">{r.meta}</span>}
              {r.tag && <span className="ccard-tag">{r.tag}</span>}
            </span>
          </PressCard>
        ))}
      </div>
    </section>
  );
}

/** A sideways, snapping rail of CollectionCards. The next card peeks in so it reads as swipeable. */
export function CollectionRail({ children, label, stacked = false }: { children: ReactNode; label: string; stacked?: boolean }) {
  return (
    <div className={`ccards${stacked ? ' ccards--stacked' : ''}`} role="group" aria-label={label}>
      {children}
    </div>
  );
}
