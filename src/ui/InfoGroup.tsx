import type { ReactNode } from 'react';

/*
 * Detail info group (docs/ux-refinement/PLAN.md, Stage 3): the key facts of a detail page (when, where, price,
 * dates, pay) as rows without a box. Each row is an icon, a primary line and an optional secondary line under it,
 * never a split column, so long venues and cities wrap cleanly at 320 px. Hairlines separate rows; an optional
 * trailing action (View on map) sits on the row it belongs to.
 */
export type InfoItem = { icon?: ReactNode; primary: ReactNode; secondary?: ReactNode; action?: ReactNode; key?: string };

export function InfoGroup({ items, label }: { items: InfoItem[]; label?: string }) {
  const shown = items.filter((x) => x.primary !== undefined && x.primary !== null && x.primary !== '');
  if (!shown.length) return null;
  return (
    <ul className="info-group" aria-label={label}>
      {shown.map((x, i) => (
        <li key={x.key ?? i} className="info-row">
          {x.icon && (
            <span className="info-icon" aria-hidden>
              {x.icon}
            </span>
          )}
          <span className="info-text">
            <span className="info-primary">{x.primary}</span>
            {x.secondary && <span className="info-secondary">{x.secondary}</span>}
            {x.action && <span className="info-action">{x.action}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
