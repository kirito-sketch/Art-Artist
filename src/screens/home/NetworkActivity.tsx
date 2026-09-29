import { motion } from 'framer-motion';
import type { NetworkEvent } from '../../data/types';
import { useStore } from '../../state/store';
import { findOpportunity, person } from '../../state/selectors';
import { stagger } from '../../ui/motion';
import { Avatar, PressCard, Photo } from '../../ui/primitives';

/** One sentence per event. Credits are always production-issued on Ana, so they need no extra label. */
function sentence(e: NetworkEvent, role?: string, city?: string) {
  const [first, ...rest] = e.actorIds.map(person);
  const who = rest.length ? (
    <>
      <b>{first.name}</b> and {rest.length} {rest.length === 1 ? 'other' : 'others'}
    </>
  ) : (
    <b>{first.name}</b>
  );
  const plural = rest.length > 0;
  switch (e.kind) {
    case 'credit':
      return <>{who} {plural ? 'were' : 'was'} credited on {e.title}</>;
    case 'project':
      return <>{who} added the project {e.title}</>;
    case 'collab':
      return <>{who} is looking for a {role?.toLowerCase()} in {city}</>;
    case 'available':
      return <>{who} is available from {first.availableFrom}</>;
    case 'reel':
      return <>{who} added a new showreel</>;
    case 'portfolio':
      return <>{who} added {e.title?.toLowerCase()}</>;
  }
}

export function NetworkRow({ e, index = 0 }: { e: NetworkEvent; index?: number }) {
  const { push, userCollabs } = useStore();
  const first = person(e.actorIds[0]);
  const o = e.opportunityId ? findOpportunity(e.opportunityId, userCollabs) : undefined;
  const thumb = e.media?.[0];

  const open = () => {
    if (o) push({ name: 'opportunity', id: o.id });
    else if (thumb && e.kind !== 'credit') push({ name: 'media', items: e.media!, index: 0 });
    else push({ name: 'profile', id: first.id });
  };

  return (
    <motion.div {...stagger(index)}>
      <PressCard className="nrow" onPress={open} scale={0.985}>
        <Avatar party={first} size={44} available={e.kind === 'available'} />
        <div className="nrow-text">
          <p className="nrow-line">{sentence(e, o?.role, o?.city)}</p>
          <p className="meta">{e.time}</p>
        </div>
        {thumb && <Photo media={thumb} className="nrow-thumb" showPlay={false} />}
      </PressCard>
    </motion.div>
  );
}
