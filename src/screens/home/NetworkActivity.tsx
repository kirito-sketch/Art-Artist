import { ChevronRight } from 'lucide-react';
import type { NetworkEvent } from '../../data/types';
import { useStore } from '../../state/store';
import { findOpportunity, org, person } from '../../state/selectors';
import { Avatar, Chip, PressCard, Verified } from '../../ui/primitives';
import { Still } from '../../ui/Still';
import { motion } from 'framer-motion';
import { stagger } from '../../ui/motion';

function names(ids: string[]) {
  const ps = ids.map(person);
  if (ps.length === 1) return <b>{ps[0].name}</b>;
  if (ps.length === 2) return (<><b>{ps[0].name}</b> and <b>{ps[1].name}</b></>);
  return (
    <>
      <b>{ps[0].name}</b>, <b>{ps[1].name}</b> and {ps.length - 2} others
    </>
  );
}

/**
 * Professional signals from people you follow. Rows are compact by default and only become
 * media-rich when the event is about media (a project, a reel, new stills).
 */
export function NetworkRow({ e, index = 0 }: { e: NetworkEvent; index?: number }) {
  const { push, userCollabs } = useStore();
  const actors = e.actorIds.map(person);
  const first = actors[0];

  const open = () => {
    if (e.kind === 'collab' && e.opportunityId) push({ name: 'opportunity', id: e.opportunityId });
    else if ((e.kind === 'reel' || e.kind === 'portfolio' || e.kind === 'project') && e.media) push({ name: 'media', items: e.media, index: 0 });
    else push({ name: 'profile', id: first.id });
  };

  const avatar = actors.length > 1 ? (
    <span className="avatar-pair" aria-hidden>
      <Avatar party={actors[0]} size={30} />
      <Avatar party={actors[1]} size={30} />
    </span>
  ) : <Avatar party={first} size={42} ring={e.kind === 'available' ? 'available' : undefined} />;

  let line: JSX.Element;
  let sub: JSX.Element | null = null;
  let aside: JSX.Element | null = null;
  let below: JSX.Element | null = null;

  switch (e.kind) {
    case 'credit': {
      const house = org(e.orgId!);
      line = (
        <>
          {names(e.actorIds)} {actors.length > 1 ? 'were' : 'was'} credited on <i>{e.title}</i>
        </>
      );
      sub = (
        <span className="net-verified">
          <Verified size={12} label="Verified credit" /> {e.detail} · added by {house.name}
        </span>
      );
      if (e.media?.[0]) aside = <Still media={e.media[0]} className="net-poster" />;
      break;
    }
    case 'project':
      line = (
        <>
          {names(e.actorIds)} added a project, <i>{e.title}</i>
        </>
      );
      sub = <span>{e.detail}</span>;
      below = (
        <div className="net-strip">
          {e.media!.map((m) => (
            <Still key={m.id} media={m} className="net-strip-item" />
          ))}
        </div>
      );
      break;
    case 'collab': {
      const o = findOpportunity(e.opportunityId!, userCollabs)!;
      line = (
        <>
          {names(e.actorIds)} is looking for a <b>{o.role}</b>
        </>
      );
      sub = <span>{o.project} · {o.projectType}</span>;
      below = (
        <div className="net-chips">
          <Chip tone="collab">Collaboration</Chip>
          <Chip>{o.city}</Chip>
          <Chip>{o.dates}</Chip>
        </div>
      );
      break;
    }
    case 'available':
      line = (
        <>
          {names(e.actorIds)} is available for work
        </>
      );
      sub = <span>{first.role} · {e.detail}</span>;
      break;
    case 'reel':
      line = (
        <>
          {names(e.actorIds)} added <i>{e.title}</i>
        </>
      );
      sub = <span>{first.role}</span>;
      below = <Still media={e.media![0]} className="net-reel" />;
      break;
    case 'portfolio':
      line = (
        <>
          {names(e.actorIds)} added {e.title}
        </>
      );
      sub = <span>{e.detail}</span>;
      below = (
        <div className="net-strip net-strip--two">
          {e.media!.map((m) => (
            <Still key={m.id} media={m} className="net-strip-item" />
          ))}
        </div>
      );
      break;
  }

  return (
    <motion.div {...stagger(index)}>
      <PressCard className={`net-row ${e.isNew ? 'net-row--new' : ''}`} onPress={open} scale={0.985}>
        <div className="net-row-main">
          <span className="net-avatar">{avatar}</span>
          <div className="net-text">
            <p className="net-line">{line}</p>
            {sub && <p className="net-sub">{sub}</p>}
          </div>
          <div className="net-aside">
            <span className="net-time">{e.time}</span>
            {aside ?? <ChevronRight size={16} className="net-chevron" />}
          </div>
        </div>
        {below && <div className="net-below">{below}</div>}
      </PressCard>
    </motion.div>
  );
}
