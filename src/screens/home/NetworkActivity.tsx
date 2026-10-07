import { motion } from 'framer-motion';
import type { NetworkEvent } from '../../data/types';
import { useStore } from '../../state/store';
import { findOpportunity, person } from '../../state/selectors';
import { publicProjects } from '../../domain/discovery';
import { stagger } from '../../ui/motion';
import { Avatar, PressCard, Photo } from '../../ui/primitives';

/** One sentence per event. Credits are always production-issued on Art and Artist, so they need no extra label. */
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
      return <>{who} {first.availableFrom === 'Now' ? 'is open to work' : `is open to work from ${first.availableFrom}`} </>;
    case 'reel':
      return <>{who} added a new showreel</>;
    case 'portfolio':
      return <>{who} added {e.title?.toLowerCase()}</>;
  }
}

/**
 * One network event. `quiet` is the Notifications variant: news from your network sits below what
 * happened to you, so it is lighter (smaller face, no photo, secondary text) and opens exactly what it
 * describes: a new project opens the project (docs/NOTIFICATIONS_SETTINGS_AUDIT.md N1, N6).
 */
export function NetworkRow({ e, index = 0, quiet = false }: { e: NetworkEvent; index?: number; quiet?: boolean }) {
  const { push, userCollabs } = useStore();
  const first = person(e.actorIds[0]);
  const o = e.opportunityId ? findOpportunity(e.opportunityId, userCollabs) : undefined;
  const thumb = e.media?.[0];
  const project = quiet && e.kind === 'project' && e.title ? publicProjects().find((w) => w.title.toLowerCase() === e.title!.toLowerCase()) : undefined;

  const open = () => {
    if (o) push({ name: 'opportunity', id: o.id });
    else if (project) push({ name: 'work', id: project.id });
    else if (quiet) push({ name: 'profile', id: first.id });
    else if (thumb && e.kind !== 'credit') push({ name: 'media', items: e.media!, index: 0 });
    else push({ name: 'profile', id: first.id });
  };

  return (
    <motion.div {...stagger(index)}>
      <PressCard className={`nrow ${quiet ? 'nrow--quiet' : ''}`} onPress={open} scale={0.985}>
        <Avatar party={first} size={quiet ? 36 : 44} />
        <div className="nrow-text">
          <p className="nrow-line">{sentence(e, o?.role, o?.city)}</p>
          <p className="meta">{e.time}</p>
        </div>
        {thumb && !quiet && <Photo surface="search-thumbnail" media={thumb} className="nrow-thumb" showPlay={false} />}
      </PressCard>
    </motion.div>
  );
}
