import { useStore } from '../../state/store';
import type { Opportunity } from '../../data/types';
import { PressCard, Photo } from '../../ui/primitives';
import { Byline, useSentLabel } from '../home/OpportunityCard';

/** Compact opportunity row for lists. Three lines; state replaces the last line once the user has acted. */
export function RoleRow({ o }: { o: Opportunity }) {
  const { push } = useStore();
  const sent = useSentLabel(o);
  return (
    <PressCard className="rrow" onPress={() => push({ name: 'opportunity', id: o.id })} scale={0.985}>
      <Photo media={o.media} className="rrow-thumb" showPlay={false} />
      <div className="rrow-text">
        <p className="item-title">{o.role}</p>
        <p className="meta meta--dark">
          <Byline o={o} />
        </p>
        <p className={`meta ${sent ? 'meta--done' : ''}`}>{sent ?? `${o.kind === 'collab' ? 'Collaboration · ' : ''}${o.city.split(' ')[0]} · ${o.paid ? o.compensation : 'Unpaid'}`}</p>
      </div>
    </PressCard>
  );
}
