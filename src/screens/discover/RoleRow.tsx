import { useStore } from '../../state/store';
import type { Opportunity } from '../../data/types';
import { PressCard, Photo } from '../../ui/primitives';
import { Byline, useSentLabel } from '../home/OpportunityCard';

/** Compact opportunity row for lists. Three lines; state replaces the last line once the user has acted. */
export function RoleRow({ o, note }: { o: Opportunity; note?: string }) {
  const { push } = useStore();
  const sent = useSentLabel(o);
  return (
    <PressCard className="rrow" onPress={() => push({ name: 'opportunity', id: o.id })} scale={0.985}>
      <Photo surface="search-thumbnail" media={o.media} className="rrow-thumb" showPlay={false} />
      <div className="rrow-text">
        <p className="item-title">{o.role}</p>
        <p className="meta meta--dark">
          <Byline o={o} />
        </p>
        <p className={`meta ${sent || note ? 'meta--done' : ''}`}>{note ?? sent ?? `${o.kind === 'collab' ? 'Collaboration · ' : ''}${o.city} · ${o.paid ? o.compensation : 'Unpaid'}`}</p>
      </div>
    </PressCard>
  );
}
