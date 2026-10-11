import { motion } from 'framer-motion';
import type { NetworkEvent, Post } from '../../data/types';
import { useStore } from '../../state/store';
import { findOpportunity, party, person } from '../../state/selectors';
import { publicProjects } from '../../domain/discovery';
import { stagger } from '../../ui/motion';
import { Avatar, PressCard, Photo } from '../../ui/primitives';
import { CollectionCard, CollectionRail, type CollectionRow } from '../../ui/CollectionCard';

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

/**
 * "From your network" as collection cards: what people you know have done, grouped by theme, four to a card.
 * A new project or portfolio piece leads with its picture; people and availability lead with a face.
 */
/** Home shows a short rail; with `all` the same cards stack down the page with every row (the "See all" page). */
export function NetworkCollections({ events, posts = [], onOpenAll, onOpenPosts, all = false }: { events: NetworkEvent[]; posts?: Post[]; onOpenAll?: () => void; onOpenPosts?: () => void; all?: boolean }) {
  const { push, userCollabs } = useStore();
  const toRow = (e: NetworkEvent): CollectionRow => {
    const first = person(e.actorIds[0]);
    const o = e.opportunityId ? findOpportunity(e.opportunityId, userCollabs) : undefined;
    const thumb = e.media?.[0];
    const project = e.kind === 'project' && e.title ? publicProjects().find((w) => w.title.toLowerCase() === e.title!.toLowerCase()) : undefined;
    const open = () => {
      if (o) push({ name: 'opportunity', id: o.id });
      else if (project) push({ name: 'work', id: project.id });
      else if (thumb && e.kind !== 'credit') push({ name: 'media', items: e.media!, index: 0 });
      else push({ name: 'profile', id: first.id });
    };
    return {
      key: e.id,
      lead: thumb && e.kind !== 'credit' ? <Photo surface="search-thumbnail" media={thumb} showPlay={false} /> : <Avatar party={first} size={48} />,
      round: !(thumb && e.kind !== 'credit'),
      title: sentence(e, o?.role, o?.city),
      meta: e.time,
      tag: e.kind === 'available' ? 'Open to work' : e.kind === 'collab' ? 'Looking for crew' : undefined,
      onPress: open,
    };
  };
  const work = events.filter((e) => e.kind === 'credit' || e.kind === 'project' || e.kind === 'portfolio' || e.kind === 'reel').slice(0, all ? 40 : 4);
  const crew = events.filter((e) => e.kind === 'collab' || e.kind === 'available').slice(0, all ? 40 : 4);
  const postRows: CollectionRow[] = posts.map((p, i) => {
    const a = party(p.authorId);
    return {
      key: `post-${p.id}`,
      lead: p.media[0] ? <Photo surface="search-thumbnail" media={p.media[0]} showPlay={false} /> : a ? <Avatar party={a} size={48} /> : null,
      title: p.text ? p.text : 'Shared new work',
      meta: a ? a.name : undefined,
      onPress: () => push({ name: 'posts', ids: posts.map((x) => x.id), index: i }),
    };
  });
  return (
    <CollectionRail label="From your network" stacked={all}>
      {postRows.length > 0 && !all && <CollectionCard title="New work" subtitle="Fresh from people you know" onOpen={onOpenPosts} openLabel="See all new work" rows={postRows} />}
      {work.length > 0 && <CollectionCard title="New credits and work" subtitle="Added by people you know" onOpen={all ? undefined : onOpenAll} openLabel="See all from your network" rows={work.map(toRow)} />}
      {crew.length > 0 && <CollectionCard title="Hiring and availability" subtitle="Who needs crew, who is free" onOpen={all ? undefined : onOpenAll} openLabel="See all from your network" rows={crew.map(toRow)} />}
    </CollectionRail>
  );
}
